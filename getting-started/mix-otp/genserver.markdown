---
layout: getting-started
title: GenServer
---

# {{ page.title }}

{% include toc.html %}

{% include mix-otp-preface.html %}

In the [previous chapter](/getting-started/mix-otp/agent.html), we used agents to represent our buckets. In the first chapter, we specified we would like to name each bucket so we can do the following:

```elixir
CREATE shopping
OK

PUT shopping milk 1
OK

GET shopping milk
1
OK
```

In the session above we interacted with the "shopping" bucket.

Since agents are processes, each bucket has a process identifier (pid), but buckets do not have a name. Back [in the Process chapter](/getting-started/processes.html), we have learned that we can register processes in Elixir by giving them atom names:

```iex
iex> Agent.start_link(fn -> %{} end, name: :shopping)
{:ok, #PID<0.43.0>}
iex> KV.Bucket.put(:shopping, "milk", 1)
:ok
iex> KV.Bucket.get(:shopping, "milk")
1
```

However, naming dynamic processes with atoms is a terrible idea! If we use atoms, we would need to convert the bucket name (often received from an external client) to atoms, and **we should never convert user input to atoms**. This is because atoms are not garbage collected. Once an atom is created, it is never reclaimed. Generating atoms from user input would mean the user can inject enough different names to exhaust our system memory!

In practice, it is more likely you will reach the Erlang <abbr title="Virtual Machine">VM</abbr> limit for the maximum number of atoms before you run out of memory, which will bring your system down regardless.

Instead of abusing the built-in name facility, we will create our own *process registry* that associates the bucket name to the bucket process.

The registry needs to guarantee that it is always up to date. For example, if one of the bucket processes crashes due to a bug, the registry must notice this change and avoid serving stale entries. In Elixir, we say the registry needs to *monitor* each bucket.

We will use a [GenServer](https://hexdocs.pm/elixir/GenServer.html) to create a registry process that can monitor the bucket processes. GenServer provides industrial strength functionality for building servers in both Elixir and  <abbr title="Open Telecom Platform">OTP</abbr>.

## Our first GenServer

A GenServer is implemented in two parts: the client API and the server callbacks. You can either combine both parts into a single module or you can separate them into a client module and a server module. The client and server run in separate processes, with the client passing messages back and forth to the server as its functions are called. Here we'll use a single module for both the server callbacks and the client API.

Create a new file at `lib/kv/registry.ex` with the following contents:

```elixir
defmodule KV.Registry do
  use GenServer

  ## Client API

  @doc """
  Starts the registry.
  """
  def start_link(opts) do
    GenServer.start_link(__MODULE__, :ok, opts)
  end

  @doc """
  Looks up the bucket pid for `name` stored in `server`.

  Returns `{:ok, pid}` if the bucket exists, `:error` otherwise.
  """
  def lookup(server, name) do
    GenServer.call(server, {:lookup, name})
  end

  @doc """
  Ensures there is a bucket associated with the given `name` in `server`.
  """
  def create(server, name) do
    GenServer.cast(server, {:create, name})
  end

  ## Server Callbacks

  def init(:ok) do
    {:ok, %{}}
  end

  def handle_call({:lookup, name}, _from, names) do
    {:reply, Map.fetch(names, name), names}
  end

  def handle_cast({:create, name}, names) do
    if Map.has_key?(names, name) do
      {:noreply, names}
    else
      {:ok, bucket} = KV.Bucket.start_link([])
      {:noreply, Map.put(names, name, bucket)}
    end
  end
end
```

The first function is `start_link/3`, which starts a new GenServer passing three arguments:

1. The module where the server callbacks are implemented, in this case `__MODULE__`, meaning the current module

2. The initialization arguments, in this case, the atom `:ok`

3. A list of options which can be used to specify things like the name of the server. For now, we forward the list of options that we receive on `start_link/3`, which defaults to an empty list. We will customize it later on

There are two types of requests you can send to a GenServer: calls and casts. Calls are synchronous and the server **must** send a response back to such requests. Casts are asynchronous and the server won't send a response back.

The next two functions, `lookup/2` and `create/2` are responsible for sending these requests to the server.  In this case, we have used `{:lookup, name}` and `{:create, name}` respectively.  Requests are often specified as tuples, like this, in order to provide more than one "argument" in that first argument slot. It's common to specify the action being requested as the first element of a tuple, and arguments for that action in the remaining elements. Note that the requests must match the first argument to `handle_call/3` or `handle_cast/2`.

That's it for the client API. On the server side, we can implement a variety of callbacks to guarantee the server initialization, termination, and handling of requests. Those callbacks are optional and for now, we have only implemented the ones we care about.

The first is the `init/1` callback, that receives the second argument given to `GenServer.start_link/3` and returns `{:ok, state}`, where state is a new map. We can already notice how the `GenServer` API makes the client/server segregation more apparent. `start_link/3` happens in the client, while `init/1` is the respective callback that runs on the server.

For `call/2` requests, we  implement a `handle_call/3` callback that receives the `request`, the process from which we received the request (`_from`), and the current server state (`names`). The `handle_call/3` callback returns a tuple in the format `{:reply, reply, new_state}`. The first element of the tuple, `:reply`,  indicates that server should send a reply back to the client. The second element, `reply`, is what will be sent to the client while the third, `new_state` is the new server state.

For `cast/2` requests, we implement a `handle_cast/2` callback that receives the `request` and the current server state (`names`). The `handle_cast/2` callback returns a tuple in the format `{:noreply, new_state}`. Note that in a real application we would have probably implemented the callback for `:create` with a synchronous call instead of an asynchronous cast. We are doing it this way to illustrate how to implement a cast callback.

There are other tuple formats both `handle_call/3` and `handle_cast/2` callbacks may return. There are also other callbacks like `terminate/2` and `code_change/3` that we could implement. You are welcome to explore the [full GenServer documentation](https://hexdocs.pm/elixir/GenServer.html) to learn more about those.

For now, let's write some tests to guarantee our GenServer works as expected.

## Testing a GenServer

Testing a GenServer is not much different from testing an agent. We will spawn the server on a setup callback and use it throughout our tests. Create a file at `test/kv/registry_test.exs` with the following:

```elixir
defmodule KV.RegistryTest do
  use ExUnit.Case, async: true

  setup do
    registry = start_supervised!(KV.Registry)
    %{registry: registry}
  end

  test "spawns buckets", %{registry: registry} do
    assert KV.Registry.lookup(registry, "shopping") == :error

    KV.Registry.create(registry, "shopping")
    assert {:ok, bucket} = KV.Registry.lookup(registry, "shopping")

    KV.Bucket.put(bucket, "milk", 1)
    assert KV.Bucket.get(bucket, "milk") == 1
  end
end
```

Our test should pass right out of the box!

There is one important difference between the `setup` block we wrote for `KV.Registry` and the one we wrote for `KV.Bucket`. Instead of starting the registry by hand by calling `KV.Registry.start_link/1`, we instead called [the `start_supervised!/1` function](https://hexdocs.pm/ex_unit/ExUnit.Callbacks.html#start_supervised/2), passing the `KV.Registry` module.

The `start_supervised!` function will do the job of starting the `KV.Registry` process by calling `start_link/1`. The advantage of using `start_supervised!` is that ExUnit will guarantee that the registry process will be shutdown before the next test starts. In other words, it helps guarantee the state of one test is not going to interfere with the next one in case they depend on shared resources.

When starting processes during your tests, we should always prefer to use `start_supervised!`. We recommend you to change the previous setup block in `bucket_test.exs` to use `start_supervised!` too.

If there is a need to stop a `GenServer` as part of the application logic, one can use the `GenServer.stop/1` function:

```elixir
## Client API

@doc """
Stops the registry.
"""
def stop(server) do
  GenServer.stop(server)
end
```

## The need for monitoring

Our registry is almost complete. The only remaining issue is that the registry may become stale if a bucket stops or crashes. Let's add a test to `KV.RegistryTest` that exposes this bug:

```elixir
test "removes buckets on exit", %{registry: registry} do
  KV.Registry.create(registry, "shopping")
  {:ok, bucket} = KV.Registry.lookup(registry, "shopping")
  Agent.stop(bucket)
  assert KV.Registry.lookup(registry, "shopping") == :error
end
```

The test above will fail on the last assertion as the bucket name remains in the registry even after we stop the bucket process.

In order to fix this bug, we need the registry to monitor every bucket it spawns. Once we set up a monitor, the registry will receive a notification every time a bucket process exits, allowing us to clean the registry up.

Let's first play with monitors by starting a new console with `iex -S mix`:

```iex
iex> {:ok, pid} = KV.Bucket.start_link([])
{:ok, #PID<0.66.0>}
iex> Process.monitor(pid)
#Reference<0.0.0.551>
iex> Agent.stop(pid)
:ok
iex> flush()
{:DOWN, #Reference<0.0.0.551>, :process, #PID<0.66.0>, :normal}
```

Note `Process.monitor(pid)` returns a unique reference that allows us to match upcoming messages to that monitoring reference. After we stop the agent, we can `flush/0` all messages and notice a `:DOWN` message arrived, with the exact reference returned by `monitor`, notifying that the bucket process exited with reason `:normal`.

Let's reimplement the server callbacks to fix the bug and make the test pass. First, we will modify the GenServer state to two dictionaries: one that contains `name -> pid` and another that holds `ref -> name`. Then we need to monitor the buckets on `handle_cast/2` as well as implement a `handle_info/2` callback to handle the monitoring messages. The full server callbacks implementation is shown below:

```elixir
## Server callbacks

def init(:ok) do
  names = %{}
  refs = %{}
  {:ok, {names, refs}}
end

def handle_call({:lookup, name}, _from, state) do
  {names, _} = state
  {:reply, Map.fetch(names, name), state}
end

def handle_cast({:create, name}, {names, refs}) do
  if Map.has_key?(names, name) do
    {:noreply, {names, refs}}
  else
    {:ok, pid} = KV.Bucket.start_link([])
    ref = Process.monitor(pid)
    refs = Map.put(refs, ref, name)
    names = Map.put(names, name, pid)
    {:noreply, {names, refs}}
  end
end

def handle_info({:DOWN, ref, :process, _pid, _reason}, {names, refs}) do
  {name, refs} = Map.pop(refs, ref)
  names = Map.delete(names, name)
  {:noreply, {names, refs}}
end

def handle_info(_msg, state) do
  {:noreply, state}
end
```

Observe that we were able to considerably change the server implementation without changing any of the client API. That's one of the benefits of explicitly segregating the server and the client.

Finally, different from the other callbacks, we have defined a "catch-all" clause for `handle_info/2` that discards any unknown message. To understand why, let's move on to the next section.

## `call`, `cast` or `info`?

So far we have used three callbacks: `handle_call/3`, `handle_cast/2` and `handle_info/2`. Here is what we should consider when deciding when to use each:

1. `handle_call/3` must be used for synchronous requests. This should be the default choice as waiting for the server reply is a useful backpressure mechanism.

2. `handle_cast/2` must be used for asynchronous requests, when you don't care about a reply. A cast does not even guarantee the server has received the message and, for this reason, should be used sparingly. For example, the `create/2` function we have defined in this chapter should have used `call/2`. We have used `cast/2` for didactic purposes.

3. `handle_info/2` must be used for all other messages a server may receive that are not sent via `GenServer.call/2` or `GenServer.cast/2`, including regular messages sent with `send/2`. The monitoring `:DOWN` messages are such an example of this.

Since any message, including the ones sent via `send/2`, go to `handle_info/2`, there is a chance unexpected messages will arrive to the server. Therefore, if we don't define the catch-all clause, those messages could cause our registry to crash, because no clause would match. We don't need to worry about such cases for `handle_call/3` and `handle_cast/2` though. Calls and casts are only done via the `GenServer` API, so an unknown message is quite likely a developer mistake.

To help developers remember the differences between call, cast and info, the supported return values and more, [Benjamin Tan Wei Hao](http://benjamintan.io) has created an excellent [GenServer cheat sheet](https://raw.githubusercontent.com/benjamintanweihao/elixir-cheatsheets/master/GenServer_CheatSheet.pdf).

## Monitors or links?

We have previously learned about links in the [Process chapter](/getting-started/processes.html). Now, with the registry complete, you may be wondering: when should we use monitors and when should we use links?

Links are bi-directional. If you link two processes and one of them crashes, the other side will crash too (unless it is trapping exits). A monitor is uni-directional: only the monitoring process will receive notifications about the monitored one. In other words: use links when you want linked crashes, and monitors when you just want to be informed of crashes, exits, and so on.

Returning to our `handle_cast/2` implementation, you can see the registry is both linking and monitoring the buckets:

```elixir
{:ok, pid} = KV.Bucket.start_link([])
ref = Process.monitor(pid)
```

This is a bad idea, as we don't want the registry to crash when a bucket crashes! We typically avoid creating new processes directly, instead, we delegate this responsibility to supervisors. As we'll see in the next chapter, supervisors rely on links and that explains why link-based APIs (`spawn_link`, `start_link`, etc) are so prevalent in Elixir and <abbr title="Open Telecom Platform">OTP</abbr>.
