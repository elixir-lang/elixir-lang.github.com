---
layout: post
title: A peek inside Elixir's Parallel Compiler
author: José Valim
category: Internals
excerpt: Today, a parallel compiler just landed in Elixir master. The goal of the parallel compiler is to compile files in parallel, automatically detecting dependencies between files. In this blog post, we are going to take a peek into the parallel compiler internals and learn more about Erlang and Elixir in the process.
---

Today, a parallel compiler just landed in Elixir master. The goal of the parallel compiler is to compile files in parallel, automatically detecting dependencies between files. In this blog post, we are going to take a peek into the parallel compiler internals and learn more about Erlang and Elixir in the process.

## Process-based serial compilation

The idea of the parallel compiler is very simple: for each file we want to compile, we will spawn a new process that will be responsible for its compilation. When compilation finishes, the process is going to send a message to the main process (the one responsible for coordinating compilation) that compilation finished so a new file can be compiled.

In Elixir, we could write this code as follows:

    def spawn_compilers([current|files], output) do
      parent = Process.self()
      child  = spawn_link(fn ->
        :elixir_compiler.file_to_path(current, output)
        send parent, { :compiled, Process.self() }
      end)
      receive do
        { :compiled, ^child } ->
          spawn_compilers(files, output)
        { :EXIT, ^child, { reason, where } } ->
          :erlang.raise(:error, reason, where)
      end
    end

    def spawn_compilers([], _output) do
      :done
    end

In the first line, we define a function named `spawn_compilers` that receives two arguments, the first is a list of files to compile and the second is a string telling us where to write the compiled file. The first argument is represented as a list with head and tail (`[current|files]`) where the top of the list is assigned to `current` and the remaining items to `files`. If the list is empty, the first clause of `spawn_compilers` is not going to match, the clause `spawn_compilers([], _output)` defined at the end will instead.

Inside `spawn_compilers`, we first retrieve the PID of the current process with `Process.self` (remember we are talking about Erlang processes/actors and not OS processes) and then proceed to spawn a new process to execute the given function in parallel. Spawning a new process is done with the `spawn_link` function.

The `spawn_link` function starts a new process and automatically links the current (parent) process with the spawned (child) one, returning the child PID. By linking the process we ensure that, if the child process dies, a message will be sent to the parent process which then can act on it.

The function given to `spawn_link` is quite straight-forward. It simply invokes an Erlang function as `:elixir_compiler.file_to_path` and then proceeds to send a message to the parent process notifying that compilation finished.

After the child process is spawned, we invoke the `receive` macro and start waiting for messages. At this point, we are expecting two types of messages:

* `{ :compiled, ^child }` - a message sent by the child informing us that compilation finished. Note that use of `^` before the variable `child` to tell Elixir to match the current value of `child` with the one received in the message. If compilation succeeds, we move forward and spawn the next child by calling `spawn_compilers` recursively;

* `{ :EXIT, ^child, { reason, where } }` - this is the message sent by the child process in case it dies. This message is only received if the child is started via `spawn_link`. In the message, we can find the reason why it failed and the stacktrace. We then proceed to call an Erlang internal function to re-raise the error in the main process, effectively stopping compilation.

With this code, we were able to compile each file inside a different process. However, notice that we are not yet compiling in parallel. Every time we spawn a child process, we wait until it succeeds (or fails) before moving to the next step. We are going to eventually compile files in parallel, but before we reach to this point, let's understand the problem of dependencies between files.

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

The way we are going to handle this is by pausing compilation every time a module that was not yet defined is invoked. In this case, when compiling the file `a.ex` and `B.define` is invoked, the process responsible for compiling `a.ex` is going to pause and notify our main process. The main process will then start the compilation of other files. Whenever the module `B` is compiled, the main process is going to tell the process responsible for `a.ex` to resume compilation since its dependency `B` is now available.

In order to customize this process, we are going to take a look at Erlang's error handler.

## Custom error handler

By default, Elixir (and Erlang) code is autoloaded. This means that, if we invoke `List.delete` and the module `List` was not loaded yet, the Erlang VM is going to look into the `ebin` directory (the directory where we put compiled files) and try to load it. This process is controlled by the [`error_handler` module in Erlang](http://www.erlang.org/doc/man/error_handler.html) via two callback functions: `undefined_function` and `undefined_lambda`.

As discussed in the previous section, we want to extend the error handler to actually stop the currently running process whenever a module is not found and resume the process only after we ensure the module is compiled. To do that, we can simply define our own error handler and ask Erlang to use it. Our custom error handler is defined as follows:

    defmodule Elixir.ErrorHandler do
      def undefined_function(module, fun, args) do
        ensure_loaded(module)
        :error_handler.undefined_function(module, fun, args)
      end

      def undefined_lambda(module, fun, args) do
        ensure_loaded(module)
        :error_handler.undefined_lambda(module, fun, args)
      end

      defp ensure_loaded(module) do
        case Code.ensure_loaded(module) do
          { :module, _ } ->
            []
          { :error, _ } ->
            parent = Process.get(:elixir_parent_compiler)
            send parent, { :waiting, Process.self, module }
            receive do
              { :release, ^parent } -> ensure_loaded(module)
            end
        end
      end
    end

Our error handler defines two public functions. Both those functions are callbacks required to be implemented by the error handler. They simply call `ensure_loaded(module)` and then delegate the remaining logic to Erlang's original `error_handler`.

The private `ensure_loaded` function calls `Code.ensure_loaded(module)` which checks if the given module is loaded and, if not, tries to load it. In case it succeeds, it returns `{ :module, _ }`, which means the module is available and we don't need to stop the current process. However, if it returns `{ :error, _ }`, it means the module cannot be found and we need to wait until it is compiled. For that, we invoke `Process.get(:elixir_parent_compiler)` to get the PID of the main process so we can notify it that we are waiting on a given module. Then we invoke the macro `receive` as a way to stop the current process until we receive a message from the parent saying new modules are available, starting the flow again.

With our error handler code in place, the first thing we need to do is to change the function given to `spawn_link` to use the new error handler:

    spawn_link(fn ->
      Process.put(:elixir_parent_compiler, parent)
      Process.flag(:error_handler, Elixir.ErrorHandler)

      :elixir_compiler.file_to_path(current, output)
      send parent, { :compiled, Process.self() }
    end)

Notice that we have two small additions. First we store the `:elixir_parent_compiler` PID in the process dictionary so we are able to read it from the error handler and then we proceed to configure a flag in our process so our new error handler is invoked whenever a module or function cannot be found.

Second, our main process can now receive a new `{ :waiting, child, module }` message, so we need to extend it to account for those messages. Not only that, we need to control which PIDs we have spawned so we can notify them whenever a new module is compiled, forcing us to add a new argument to the `spawn_compilers` function. `spawn_compilers` would then be rewritten as follows:

    def spawn_compilers([current|files], output, stack) do
      parent = Process.self()
      child  = spawn_link(fn ->
        :elixir_compiler.file_to_path(current, output)
        send parent, { :compiled, Process.self() }
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

Notice we added an extra clause to `spawn_compilers` so we can properly handle the case where we don't have more files to spawn but we are still waiting for processes in the stack. We have also moved our `receive` logic to a new private function called `wait_for_messages`, implemented as follows:

    defp wait_for_messages(files, output, stack) do
      receive do
        { :compiled, child } ->
          new_stack = List.delete(stack, child)
          Enum.each new_stack, fn(pid) ->
            send pid, { :release, Process.self }
          end
          spawn_compilers(files, output, new_stack)
        { :waiting, _child, _module } ->
          spawn_compilers(files, output, stack)
        { :EXIT, _child, { reason, where } } ->
          :erlang.raise(:error, reason, where)
      after
        10_000 ->
          raise "dependency on unexesting module or possible deadlock"
      end
    end

The implementation for `wait_for_messages` is now broken into 4 clauses:

* `{ :compiled, child }` - Similar as before, it is the notification a child processed finished compilation. Every time we receive such notifications, we remove the child PID from the stack and notify the remaining PIDs in the stack that new modules are available. Notice that we no longer match on a specific `^child` PID, since now we can receive messages from different children at the same time;

* `{ :waiting, _child, _module }` - A message received every time a child process is waiting on a module to be compiled. In this scenario, all we do is spawn a new process to compile another file, ensuring compilation is never blocked;

* `{ :EXIT, _child, { reason, where } }` - The same behaviour as before, it simply raises an error if any of the child processes fail;

* `after: 10_000` - This clause is going to be invoked whenever the main process does not receive a message for 10 seconds. This means a file depends on a module that does not exist (and therefore waits forever) or there is a cyclic dependency;

And that's all we need to have a basic version of our parallel compilation working. Notice we start compiling only one file at a time but, as soon as we depend on other files, the number of PIDs in the stack starts to grow. If we wanted, we could modify the code to make use of a head start and compile more than one file since the beginning.

It is important to notice that this code has room for improvements. First, every time a new module is compiled, we notify all child process that new modules are available. This is a waste of resource if we consider that the child modules tells us explicitly on which modules they are waiting on. Therefore, the code could be modified to store a mapping from each child process to the module it is waiting for so that when a new module is compiled, only the children that depend on it are notified.

Also, if we start storing which module each process is depending on, we are able to know whenever we have a deadlock or a dependency on an nonexistent file, allowing us to get rid of the timeout.

All those improvements and other goodies like callbacks are implemented in Elixir source code and we recommend you take a look at both the [Elixir.ParallelCompiler](https://github.com/elixir-lang/elixir/blob/6182602f1205e2d9fc54666e0721270a27226fbc/lib/elixir/parallel_compiler.ex) and [Elixir.ErrorHandler](https://github.com/elixir-lang/elixir/blob/6182602f1205e2d9fc54666e0721270a27226fbc/lib/elixir/error_handler.ex) modules to see all the details firsthand.

Happy coding!
