---
layout: getting-started
title: Processes
redirect_from: /getting_started/11.html
---

# {{ page.title }}

{% include toc.html %}

In Elixir, all code runs inside processes. Processes are isolated from each other, run concurrent to one another and communicate via message passing. Processes are not only the basis for concurrency in Elixir, but they also provide the means for building distributed and fault-tolerant programs.

Elixir's processes should not be confused with operating system processes. Processes in Elixir are extremely lightweight in terms of memory and CPU (unlike threads in many other programming languages). Because of this, it is not uncommon to have dozens of thousands of processes running simultaneously.

In this chapter, we will learn about the basic constructs for spawning new processes, as well as sending and receiving messages between different processes.

## `spawn`

The basic mechanism for spawning new processes is with the auto-imported `spawn/1` function:

```iex
iex> spawn fn -> 1 + 2 end
#PID<0.43.0>
```

`spawn/1` takes a function which it will execute in another process.

Notice `spawn/1` returns a PID (process identifier). At this point, the process you spawned is very likely dead. The spawned process will execute the given function and exit after the function is done:

```iex
iex> pid = spawn fn -> 1 + 2 end
#PID<0.44.0>
iex> Process.alive?(pid)
false
```

> Note: you will likely get different process identifiers than the ones we are getting in this guide.

We can retrieve the PID of the current process by calling `self/0`:

```iex
iex> self()
#PID<0.41.0>
iex> Process.alive?(self())
true
```

Processes get much more interesting when we are able to send and receive messages.

## `send` and `receive`

We can send messages to a process with `send/2` and receive them with `receive/1`:

```iex
iex> send self(), {:hello, "world"}
{:hello, "world"}
iex> receive do
...>   {:hello, msg} -> msg
...>   {:world, msg} -> "won't match"
...> end
"world"
```

When a message is sent to a process, the message is stored in the process mailbox. The `receive/1` block goes through the current process mailbox searching for a message that matches any of the given patterns. `receive/1` supports many clauses, like `case/2`, as well as guards in the clauses.

If there is no message in the mailbox matching any of the patterns, the current process will wait until a matching message arrives. A timeout can also be specified:

```iex
iex> receive do
...>   {:hello, msg}  -> msg
...> after
...>   1_000 -> "nothing after 1s"
...> end
"nothing after 1s"
```

A timeout of 0 can be given when you already expect the message to be in the mailbox.

Let's put all together and send messages between processes:

```iex
iex> parent = self()
#PID<0.41.0>
iex> spawn fn -> send(parent, {:hello, self()}) end
#PID<0.48.0>
iex> receive do
...>   {:hello, pid} -> "Got hello from #{inspect pid}"
...> end
"Got hello from #PID<0.48.0>"
```

While in the shell, you may find the helper `flush/0` quite useful. It flushes and prints all the messages in the mailbox.

```iex
iex> send self(), :hello
:hello
iex> flush()
:hello
:ok
```

## Links

The most common form of spawning in Elixir is actually via `spawn_link/1`. Before we show an example with `spawn_link/1`, let's try to see what happens when a process fails:

```iex
iex> spawn fn -> raise "oops" end
#PID<0.58.0>

[error] Error in process <0.58.0> with exit value: ...
```

It merely logged an error but the spawning process is still running. That's because processes are isolated. If we want the failure in one process to propagate to another one, we should link them. This can be done with `spawn_link/1`:

```iex
iex> spawn_link fn -> raise "oops" end
#PID<0.41.0>

** (EXIT from #PID<0.41.0>) an exception was raised:
    ** (RuntimeError) oops
        :erlang.apply/2
```

When a failure happens in the shell, the shell automatically traps the failure and shows it nicely formatted. In order to understand what would really happen in our code, let's use `spawn_link/1` inside a file and run it:

```iex
# spawn.exs
spawn_link fn -> raise "oops" end

receive do
  :hello -> "let's wait until the process fails"
end
```

This time the process failed and brought the parent process down as they are linked. Linking can also be done manually by calling `Process.link/1`. We recommend you to take a look at [the `Process` module](/docs/stable/elixir/Process.html) for other functionality provided by processes.

Process and links play an important role when building fault-tolerant systems. In Elixir applications, we often link our processes to supervisors which will detect when a process dies and start a new process in its place. This is only possible because processes are isolated and don't share anything by default. And if processes are isolated, there is no way a failure in a process will crash or corrupt the state of another.

While other languages would require us to catch/handle exceptions, in Elixir we are actually fine with letting processes fail because we expect supervisors to properly restart our systems. "Failing fast" is a common philosophy when writing Elixir software!

Before moving to the next chapter, let's see one of the most common use cases for creating processes in Elixir.

## Tasks

When making our processes crash in the previous section, you may have noticed the error messages were rather poor:

```iex
iex> spawn fn -> raise "oops" end
#PID<0.58.0>

[error] Error in process <0.58.0> with exit value: ...
```

With `spawn/1` and `spawn_link/1` functions, the error messages are generated directly by the Virtual Machine and therefore compact and lacking in details. In practice, developers would rather use the functions in the Task module, more explicitly, `Task.start/1` and `Task.start_link/1`:

```iex
iex(1)> Task.start fn -> raise "oops" end
{:ok, #PID<0.55.0>}

15:22:33.046 [error] Task #PID<0.55.0> started from #PID<0.53.0> terminating
Function: #Function<20.90072148/0 in :erl_eval.expr/5>
    Args: []
** (exit) an exception was raised:
    ** (RuntimeError) oops
        (elixir) lib/task/supervised.ex:74: Task.Supervised.do_apply/2
        (stdlib) proc_lib.erl:239: :proc_lib.init_p_do_apply/3
```

Besides providing better error logging, there are a couple other differences: `start/1` and `start_link/1` return `{:ok, pid}` rather than just the PID. This is what enables Tasks to be used in supervision trees. Furthermore, tasks provides convenience functions, like `Task.async/1` and `Task.await/1`, and functionality to ease distribution.

We will explore those functionalities in the ***Mix and OTP guide***, for now it is enough to remember to use Tasks to get better logging.

## State

We haven't talked about state so far in this guide. If you are building an application that requires state, for example, to keep your application configuration, or you need to parse a file and keep it in memory, where would you store it?

Processes are the most common answer to this question. We can write processes that loop infinitely, maintain state, and send and receive messages. As an example, let's write a module that starts new processes that work as a key-value store in a file named `kv.exs`:

```elixir
defmodule KV do
  def start_link do
    Task.start_link(fn -> loop(%{}) end)
  end

  defp loop(map) do
    receive do
      {:get, key, caller} ->
        send caller, Map.get(map, key)
        loop(map)
      {:put, key, value} ->
        loop(Map.put(map, key, value))
    end
  end
end
```

Note that the `start_link` function basically spawns a new process that runs the `loop/1` function, starting with an empty map. The `loop/1` function then waits for messages and performs the appropriate action for each message. In case of a `:get` message, it sends a message back to the caller and calls `loop/1` again, to wait for a new message. While the `:put` message actually invokes `loop/1` with a new version of the map, with the given `key` and `value` stored.

Let's give it a try by running `iex kv.exs`:

```iex
iex> {:ok, pid} = KV.start_link
#PID<0.62.0>
iex> send pid, {:get, :hello, self()}
{:get, :hello, #PID<0.41.0>}
iex> flush
nil
```

At first, the process map has no keys, so sending a `:get` message and then flushing the current process inbox returns `nil`. Let's send a `:put` message and try it again:

```iex
iex> send pid, {:put, :hello, :world}
#PID<0.62.0>
iex> send pid, {:get, :hello, self()}
{:get, :hello, #PID<0.41.0>}
iex> flush
:world
```

Notice how the process is keeping a state and we can get and update this state by sending the process messages. In fact, any process that knows the `pid` above will be able to send it messages and manipulate the state.

It is also possible to register the `pid`, giving it a name, and allowing everyone that knows the name to send it messages:

```iex
iex> Process.register(pid, :kv)
true
iex> send :kv, {:get, :hello, self()}
{:get, :hello, #PID<0.41.0>}
iex> flush
:world
```

Using processes around state and name registering are very common patterns in Elixir applications. However, most of the time, we won't implement those patterns manually as above, but by using one of the many of the abstractions that ships with Elixir. For example, Elixir provides [agents](/docs/stable/elixir/Agent.html) which are simple abstractions around state:

```iex
iex> {:ok, pid} = Agent.start_link(fn -> %{} end)
{:ok, #PID<0.72.0>}
iex> Agent.update(pid, fn map -> Map.put(map, :hello, :world) end)
:ok
iex> Agent.get(pid, fn map -> Map.get(map, :hello) end)
:world
```

A `:name` option could also be given to `Agent.start_link/2` and it would be automatically registered. Besides agents, Elixir provides an API for building generic servers (called GenServer), generic event managers and event handlers (called GenEvent), tasks and more, all powered by processes underneath. Those, along with supervision trees, will be explored with more detail in the ***Mix and OTP guide*** which will build a complete Elixir application from start to finish.

For now, let's move on and explore the world of I/O in Elixir.
