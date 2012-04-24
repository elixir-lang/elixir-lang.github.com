---
layout: post
title: A peek inside Elixir's Parallel Compiler
author: José Valim
category: Internals
excerpt: Today, a parallel compiler just landed in Elixir master. The goal of the parallel compiler is to compile files in parallel, automatically detecting dependencies between files. In this blog post, we are going to take a peek into the parallel compiler internals and learn more about Erlang and Elixir in the process.
---

Today, a parallel compiler just landed in Elixir master. The goal of the parallel compiler is to compile files in parallel, automatically detecting dependencies between files. In this blog post, we are going to take a peek into the parallel compiler internals and learn more about Erlang and Elixir in the process.

## Actor-based serial compilation

The idea of the parallel compiler is very simple: for each file we want to compile, we will spawn a new actor that will be responsible for its compilation. When compilation finishes, the actor is going to send a message to the main actor (the one responsible for coordinating compilation) that compilation finished so a new file can be compiled.

In Elixir, we could write this code as follow:

    def spawn_compilers([current|files], output) do
      parent = Process.self()
      child  = spawn_link(fn ->
        Erlang.elixir_compiler.file_to_path(current, output)
        parent <- { :compiled, Process.self() }
      end)
      receive do
      match: { :compiled, ^child }
        spawn_compilers(files, output)
      match: { :EXIT, ^child, { reason, where } }
        Erlang.erlang.raise(:error, reason, where)
      end
    end
    
    def spawn_compilers([], _output) do
      :done
    end

We are going to discuss the code above line by line. In the first line, we define a function named `spawn_compilers` that receives two arguments, the first is a list of files to compile and the second is a string telling us where to write the compiled file. The first argument is represented as a list with head and tail (`[current|files]`) where the top of the list is assigned to `current` and the remaining items to `files`. If the list is empty, the first clause of `spawn_compilers` is not going to match, the clause `spawn_compilers([], _output)` defined at the end will instead.

Inside `spawn_compilers`, we first store the PID of the current process (remember we are talking about Erlang processes and not OS processes) and spawn a new actor/process which is going to execute the contents of the function. Spawning a new actor is done with the `spawn_link` function.

`spawn_link` starts a new process and automatically links the current (parent) process with the spawned (child) one. This means that, if the child process dies, a message will be sent to the parent process which then can act on it.

The function given to `spawn_link` is quite straight-forward. It simply invokes an Erlang function via `Erlang.elixir_compiler.file_to_path` and then proceeds to send a message to the parent process mentioning compilation finished.

After the child process is spawned, we invoke the macro `receive` and start waiting for messages. At this point, there are two types of messages we can receive:

* `{ :compiled, ^child }` - a message sent by the child informing us that compilation finished. Note that use of `^` before the variable `child` to tell Elixir to match the current value of `child` with the one received in the message. If compilation succeeds, we move forward and spawn the next child by calling `spawn_compilers` recursively;

* `{ :EXIT, ^child, { reason, what } }` - this is the message sent by the child process in case it dies. This message is only received if the child is started via `spawn_link`. In the message, we can find the reason while it fails and the stacktrace. We then proceed to call an Erlang internal function to re-raise the error in the main process, effectively stopping compilation.

With this code, we were able to compile each file inside a different actor. However, notice that we are not yet compiling in parallel. Every time we spawn a child actor, we wait until it succeeds (or fails) before moving to the next step. We are going to eventually compile files in parallel, but before we reach to this point, let's understand the problem of dependencies between files.

## Dependency between files

Imagine that we have two files, `a.ex` and `b.ex`, with the following contents:

    # a.ex
    defmodule A do
      B.define
    end

    # b.ex
    defmodule B do
      defmacro define do
        quote do
          def one, do: 1
        end
      end
    end

In order to compile `A`, we need to ensure that `B` is already compiled and loaded so we can invoke the `define` macro. This means the file `a.ex` depends on the file `b.ex`. When compiling files in parallel, we want to be able to detect such cases and automatically handle them.

The way we are going to solve this problem is by pausing compilation every time a module that was not defined yet is invoked. In this case, when compiling the file `a.ex` and `B.define` is invoked, the process responsible for compiling `a.ex` is going to pause and notify our main process. The main process will then start the compilation of other files. Whenever the module `B` is compiled, the main process is going to tell the actor responsible for `a.ex` to resume compilation since its dependency `B` is now available.

In order to customize this process, we are going to take a look at Erlang's error handler.

## Custom error handler

By default, Elixir code is autoloaded. This means that, if we invoke `List.delete` and the module `List` was not loaded yet, the Erlang VM is going to look into the `ebin` directory (the directory where we put compiled files) and try to load it. This process is controlled by the [`error_handler` module in Erlang](http://erlang.org/doc/man/error_handler.html) via two callback functions: `undefined_function` and `undefined_lambda`.

As discussed in the previous section, we want to extend the error handler to actually stop the currently running process whenever a module is not found and resume the process only after we ensure the module is compiled. To do that, we can simply define our own error handle and ask Erlang to use it. Our error handler is defined as follow:

    defmodule Elixir.ErrorHandler do
      def undefined_function(module, fun, args) do
        ensure_loaded(module)
        Erlang.error_handler.undefined_function(module, fun, args)
      end

      def undefined_lambda(module, fun, args) do
        ensure_loaded(module)
        Erlang.error_handler.undefined_lambda(module, fun, args)
      end

      defp ensure_loaded(module) do
        case Code.ensure_loaded(module) do
        match: { :module, _ }
          []
        match: { :error, _ }
          parent = Process.get(:elixir_parent_compiler)
          parent <- { :waiting, Process.self, module }
          receive do
          match: { :release, ^parent }
            ensure_loaded(module)
          end
        end
      end
    end

Our error handler has the two public functions defined. Both those functions are callbacks required to be implemented by the error handler and they simply call `ensure_loaded(module)` and then delegate the remaining logic to Erlang's original `error_handler`.

The private `ensure_loaded` function then proceeds to call `Code.ensure_loaded(module)` which, checks if the module given is loaded and, if not, tries to load it. In case it succeeds, it returns `{ :module, _ }`, which means the module is available and we don't need to stop the current process. However, if it returns `{ :error, _ }`, it means the module cannot be found and we need to wait until it is compiled. For that, we invoke `Process.get(:elixir_parent_compiler)` to get the PID of the main/parent compiler so we can notify it that we are waiting on a given module. Then we invoke the macro `receive` as a way to stop the current process until we receive a message from the parent saying new modules are available, starting the flow again.

With our error handler code in place, the first thing we need to do is to change the function given to `spawn_link` to use the new error handler:

    spawn_link(fn ->
      Process.put(:elixir_parent_compiler, parent)
      Process.flag(:error_handler, Elixir.ErrorHandler)

      Erlang.elixir_compiler.file_to_path(current, output)
      parent <- { :compiled, Process.self() }
    end)

Notice that we have two small additions. First we store the `:elixir_parent_compiler` PID in the process dictionary so we are able to read it from the error handler and then we proceed to configure a flag in our process so our new error handler is invoked whenever a module or function cannot be found.

Second, our main process can now receive a new `{ :waiting, child, module }` message so we need to extend it to account for those messages. Not only that, we need to control which PIDs we have spawned so we can notify them whenever a new module is compiled, so we at least need to add a new argument to the `spawn_compilers` function. Our function would then be rewritten as follow:

    def spawn_compilers([current|files], output, stack) do
      parent = Process.self()
      child  = spawn_link(fn ->
        Erlang.elixir_compiler.file_to_path(current, output)
        parent <- { :compiled, Process.self() }
      end)
      wait_for_messages(files, output, [child|stack])
    end

    # No more files and stack is empty, we are done
    def spawn_compilers([], _output, []) do
      :done
    end

    # No more files and stack is not empty, wait for all messages
    def spawn_compilers([], output, stack) do
      wait_for_messages([], output, stack)
    end

Notice we added an extra clause to `spawn_compilers` so we can properly handle the case where we don't have more files to spawn but we are still waiting for process in the stack. We have also moved our `receive` logic to a new private function called `wait_for_messages`, implemented as follow:

    defp wait_for_messages(files, output, stack) do
      receive do
      match: { :compiled, child }
        new_stack = List.delete(stack, child)
        Enum.each new_stack, fn(pid) ->
          pid <- { :release, Process.self }
        end
        spawn_compilers(files, output, new_stack)
      match: { :waiting, _child, _module }
        spawn_compilers(files, output, new_stack)
      match: { :EXIT, _child, { reason, where } }
        Erlang.erlang.raise(:error, reason, where)
      after: 10_000
        raise "dependency on unexesting module or possible deadlock"
      end
    end

The implementation for `wait_for_messages` is now broken into 4 clauses:

* `{ :compiled, child }` - Similar as before, it is the notification a child processed finished compilation. Every time we receive such notifications, we remove the child PID from the stack and notify the remaining of the stack that new modules are available. Notice that we no longer match on an specific `^child` id, since now we can receive messages from different sources;

* `{ :waiting, _child, _module }` - A message received every time a child process is waiting on a module to be compiled. In this scenario, all we do is to spawn a new process to compile another file;

* `{ :EXIT, _child, { reason, where } }` - Exactly the same as before, simply raises an error if any of the child fails;

* `after: 10_000` - This clause is going to be invoked whenever the main process does not receive a message for 10 seconds. This can happen whenever we invoke a module that does not exist or there is a cyclic dependency.

And that's all we need to have a basic version of our parallel compilation working. Notice we start compiling only one file at a time but, as soon as we depend on other files, the number of PIDs in the stack starts to grow.

It is important to notice that this code has room for improvements. First, every time a new module is released, we notify all child process that new modules are available. This is a waste of resource if we consider that the child modules tells us explicitly on which modules they are waiting on. That said, the code could be modified to store exactly on which modules each child process is depending on so they can be released just when their dependencies are definitely available.

Also, if we start storing on which file each process is depending on, we are able to know whenever we have a deadlock or a dependency on an inexistent file, allowing us to get rid of the timeout.

All those improvements and other goodies like callbacks are implemented in Elixir source code and we recommend you take a look at both the [Elixir.ParallelCompiler](https://github.com/elixir-lang/elixir/blob/master/lib/elixir/parallel_compiler.ex) and [Elixir.ErrorHandler](https://github.com/elixir-lang/elixir/blob/master/lib/elixir/error_handler.ex) modules for more information.

Happy coding!
