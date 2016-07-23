---
layout: getting-started
title: GenServer
---

# {{ page.title }}

{% include toc.html %}

In the [previous chapter](/getting-started/mix-otp/agent.html) we used agents to represent our buckets. In the first chapter, we specified we would like to name each bucket so we can do the following:

```elixir
CREATE shopping
OK

PUT shopping milk 1
OK

GET shopping milk
1
OK
```

Since agents are processes, each bucket has a process identifier (pid) but it doesn't have a name. We have learned about the name registry [in the Process chapter](/getting-started/processes.html) and you could be inclined to solve this problem by using such registry. For example, we could create a bucket as:

```iex
iex> Agent.start_link(fn -> %{} end, name: :shopping)
{:ok, #PID<0.43.0>}
iex> KV.Bucket.put(:shopping, "milk", 1)
:ok
iex> KV.Bucket.get(:shopping, "milk")
1
```

However, this is a terrible idea! Process names in Elixir must be atoms, which means we would need to convert the bucket name (often received from an external client) to atoms, and **we should never convert user input to atoms**. This is because atoms are not garbage collected. Once an atom is created, it is never reclaimed. Generating atoms from user input would mean the user can inject enough different names to exhaust our system memory!

In practice it is more likely you will reach the Erlang <abbr title="Virtual Machine">VM</abbr> limit for the maximum number of atoms before you run out of memory, which will bring your system down regardless.

Instead of abusing the name registry facility, we will create our own *registry process* that holds a map that associates the bucket name to the bucket process.

The registry needs to guarantee the dictionary is always up to date. For example, if one of the bucket processes crashes due to a bug, the registry must clean up the dictionary in order to avoid serving stale entries. In Elixir, we describe this by saying that the registry needs to *monitor* each bucket.

We will use a [GenServer](/docs/stable/elixir/GenServer.html) to create a registry process that can monitor the bucket processes. GenServers are the go-to abstraction for building generic servers in both Elixir and  <abbr title="Open Telecom Platform">OTP</abbr>.

## Our first GenServer

A GenServer is implemented in two parts: the client API and the server callbacks, either in a single module or in two different modules implementing client API in one and server callbacks in the other. The client and server run in separate processes, with the client passing messages back and forth to the server as its functions are called. Here we use a single module for both the server callbacks and client API. Create a new file at `lib/kv/registry.ex` with the following contents:

```elixir
defmodule KV.Registry do
  use GenServer

  ## Client API

  @doc """
  Starts the registry.
  """
  def start_link do
    GenServer.start_link(__MODULE__, :ok, [])
  end

  @doc """
  Looks up the bucket pid for `name` stored in `server`.

  Returns `{:ok, pid}` if the bucket exists, `:error` otherwise.
  """
  def lookup(server, name) do
    GenServer.call(server, {:lookup, name})
  end

  @doc """
  Ensures there is a bucket associated to the given `name` in `server`.
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
      {:ok, bucket} = KV.Bucket.start_link
      {:noreply, Map.put(names, name, bucket)}
    end
  end
end
```

The first function is `start_link/3`, which starts a new GenServer passing three arguments:

1. The module where the server callbacks are implemented, in this case `__MODULE__`, meaning the current module

2. The initialization arguments, in this case the atom `:ok`

3. A list of options which can, for example, hold the name of the server. For now, we pass an empty list

There are two types of requests you can send to a GenServer: calls and casts. Calls are synchronous and the server **must** send a response back to such requests. Casts are asynchronous and the server won't send a response back.

The next two functions, `lookup/2` and `create/2` are responsible for sending these requests to the server. The requests are represented by the first argument to `handle_call/3` or `handle_cast/2`. In this case, we have used `{:lookup, name}` and `{:create, name}` respectively. Requests are often specified as tuples, like this, in order to provide more than one "argument" in that first argument slot. It's common to specify the action being requested as the first element of a tuple, and arguments for that action in the remaining elements.

On the server side, we can implement a variety of callbacks to guarantee the server initialization, termination and handling of requests. Those callbacks are optional and for now we have only implemented the ones we care about.

The first is the `init/1` callback, that receives the argument given to `GenServer.start_link/3` and returns `{:ok, state}`, where state is a new map. We can already notice how the `GenServer` API makes the client/server segregation more apparent. `start_link/3` happens in the client, while `init/1` is the respective callback that runs on the server.

For `call/2` requests, we must implement a `handle_call/3` callback that receives the `request`, the process from which we received the request (`_from`), and the current server state (`names`). The `handle_call/3` callback returns a tuple in the format `{:reply, reply, new_state}`, where `reply` is what will be sent to the client and the `new_state` is the new server state.

For `cast/2` requests, we must implement a `handle_cast/2` callback that receives the `request` and the current server state (`names`). The `handle_cast/2` callback returns a tuple in the format `{:noreply, new_state}`.

There are other tuple formats both `handle_call/3` and `handle_cast/2` callbacks may return. There are also other callbacks like `terminate/2` and `code_change/3` that we could implement. You are welcome to explore the [full GenServer documentation](/docs/stable/elixir/GenServer.html) to learn more about those.

For now, let's write some tests to guarantee our GenServer works as expected.

## Testing a GenServer

Testing a GenServer is not much different from testing an agent. We will spawn the server on a setup callback and use it throughout our tests. Create a file at `test/kv/registry_test.exs` with the following:

```elixir
defmodule KV.RegistryTest do
  use ExUnit.Case, async: true

  setup do
    {:ok, registry} = KV.Registry.start_link
    {:ok, registry: registry}
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

We don't need to explicitly shut down the registry because it will receive a `:shutdown` signal when our test finishes. While this solution is ok for tests, if there is a need to stop a `GenServer` as part of the application logic, one can use the `GenServer.stop/1` function:

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

In order to fix this bug, we need the registry to monitor every bucket it spawns. Once we set up a monitor, the registry will receive a notification every time a bucket exits, allowing us to clean the dictionary up.

Let's first play with monitors by starting a new console with `iex -S mix`:

```iex
iex> {:ok, pid} = KV.Bucket.start_link
{:ok, #PID<0.66.0>}
iex> Process.monitor(pid)
#Reference<0.0.0.551>
iex> Agent.stop(pid)
:ok
iex> flush
{:DOWN, #Reference<0.0.0.551>, :process, #PID<0.66.0>, :normal}
```

Note `Process.monitor(pid)` returns a unique reference that allows us to match upcoming messages to that monitoring reference. After we stop the agent, we can `flush/0` all messages and notice a `:DOWN` message arrived, with the exact reference returned by monitor, notifying that the bucket process exited with reason `:normal`.

Let's reimplement the server callbacks to fix the bug and make the test pass. First, we will modify the GenServer state to two dictionaries: one that contains `name -> pid` and another that holds `ref -> name`. Then we need to monitor the buckets on `handle_cast/2` as well as implement a `handle_info/2` callback to handle the monitoring messages. The full server callbacks implementation is shown below:

```elixir
## Server callbacks

def init(:ok) do
  names = %{}
  refs  = %{}
  {:ok, {names, refs}}
end

def handle_call({:lookup, name}, _from, {names, _} = state) do
  {:reply, Map.fetch(names, name), state}
end

def handle_cast({:create, name}, {names, refs}) do
  if Map.has_key?(names, name) do
    {:noreply, {names, refs}}
  else
    {:ok, pid} = KV.Bucket.start_link
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

So far we have used three callbacks: `handle_call/3`, `handle_cast/2` and `handle_info/2`. Deciding when to use each is straightforward:

1. `handle_call/3` must be used for synchronous requests. This should be the default choice as waiting for the server reply is a useful backpressure mechanism.

2. `handle_cast/2` must be used for asynchronous requests, when you don't care about a reply. A cast does not even guarantee the server has received the message and, for this reason, must be used sparingly. For example, the `create/2` function we have defined in this chapter should have used `call/2`. We have used `cast/2` for didactic purposes.

3. `handle_info/2` must be used for all other messages a server may receive that are not sent via `GenServer.call/2` or `GenServer.cast/2`, including regular messages sent with `send/2`. The monitoring `:DOWN` messages are a perfect example of this.

Since any message, including the ones sent via `send/2`, go to `handle_info/2`, there is a chance unexpected messages will arrive to the server. Therefore, if we don't define the catch-all clause, those messages could lead our registry to crash, because no clause would match.

We don't need to worry about this for `handle_call/3` and `handle_cast/2` because these requests are only done via the `GenServer` API, so an unknown message is quite likely to be due to a developer mistake.

## Monitors or links?

We have previously learned about links in the [Process chapter](/getting-started/processes.html). Now, with the registry complete, you may be wondering: when should we use monitors and when should we use links?

Links are bi-directional. If you link two processes and one of them crashes, the other side will crash too (unless it is trapping exits). A monitor is uni-directional: only the monitoring process will receive notifications about the monitored one. Simply put, use links when you want linked crashes, and monitors when you just want to be informed of crashes, exits, and so on.

Returning to our `handle_cast/2` implementation, you can see the registry is both linking and monitoring the buckets:

```elixir
{:ok, pid} = KV.Bucket.start_link
ref = Process.monitor(pid)
```

This is a bad idea, as we don't want the registry to crash when a bucket crashes! We typically avoid creating new processes directly, instead we delegate this responsibility to supervisors. As we'll see in the next chapter, supervisors rely on links and that explains why link-based APIs (`spawn_link`, `start_link`, etc) are so prevalent in Elixir and <abbr title="Open Telecom Platform">OTP</abbr>.
