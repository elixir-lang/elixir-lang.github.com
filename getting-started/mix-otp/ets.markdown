---
layout: getting-started
title: ETS
redirect_from: /getting_started/mix_otp/6.html
---

# {{ page.title }}

{% include toc.html %}

Every time we need to look up a bucket, we need to send a message to the registry. In some applications, this means the registry may become a bottleneck!

In this chapter we will learn about ETS (Erlang Term Storage), and how to use it as a cache mechanism. Later we will expand its usage to persist data from the supervisor to its children, allowing data to persist even on crashes.

> Warning! Don't use ETS as a cache prematurely! Log and analyze your application performance and identify which parts are bottlenecks, so you know *whether* you should cache, and *what* you should cache. This chapter is merely an example of how ETS can be used, once you've determined the need.

## ETS as a cache

ETS allows us to store any Erlang/Elixir term in an in-memory table. Working with ETS tables is done via [erlang's `:ets` module](http://www.erlang.org/doc/man/ets.html):

```iex
iex> table = :ets.new(:buckets_registry, [:set, :protected])
8207
iex> :ets.insert(table, {"foo", self})
true
iex> :ets.lookup(table, "foo")
[{"foo", #PID<0.41.0>}]
```

When creating an ETS table, two arguments are required: the table name and a set of options. From the available options, we passed the table type and its access rules. We have chosen the `:set` type, which means that keys cannot be duplicated. We've also set the table's access to `:protected`, which means that only the process that created the table can write to it, but all processes can read it from it. Those are actually the default values, so we will skip them from now on.

ETS tables can also be named, allowing us to access them by a given name:

```iex
iex> :ets.new(:buckets_registry, [:named_table])
:buckets_registry
iex> :ets.insert(:buckets_registry, {"foo", self})
true
iex> :ets.lookup(:buckets_registry, "foo")
[{"foo", #PID<0.41.0>}]
```

Let's change the `KV.Registry` to use ETS tables. We will use the same technique as we did for the event manager and buckets supervisor, and pass the ETS table name explicitly on `start_link`. Remember that, as with server names, any local process that knows an ETS table name will be able to access that table.

Open up `lib/kv/registry.ex`, and let's change its implementation. We've added comments to the source code to highlight the changes we've made:

```elixir
defmodule KV.Registry do
  use GenServer

  ## Client API

  @doc """
  Starts the registry.
  """
  def start_link(table, event_manager, buckets, opts \\ []) do
    # 1. We now expect the table as argument and pass it to the server
    GenServer.start_link(__MODULE__, {table, event_manager, buckets}, opts)
  end

  @doc """
  Looks up the bucket pid for `name` stored in `table`.

  Returns `{:ok, pid}` if a bucket exists, `:error` otherwise.
  """
  def lookup(table, name) do
    # 2. lookup now expects a table and looks directly into ETS.
    #    No request is sent to the server.
    case :ets.lookup(table, name) do
      [{^name, bucket}] -> {:ok, bucket}
      [] -> :error
    end
  end

  @doc """
  Ensures there is a bucket associated with the given `name` in `server`.
  """
  def create(server, name) do
    GenServer.cast(server, {:create, name})
  end

  ## Server callbacks

  def init({table, events, buckets}) do
    # 3. We have replaced the names HashDict by the ETS table
    ets  = :ets.new(table, [:named_table, read_concurrency: true])
    refs = HashDict.new
    {:ok, %{names: ets, refs: refs, events: events, buckets: buckets}}
  end

  # 4. The previous handle_call callback for lookup was removed

  def handle_cast({:create, name}, state) do
    # 5. Read and write to the ETS table instead of the HashDict
    case lookup(state.names, name) do
      {:ok, _pid} ->
        {:noreply, state}
      :error ->
        {:ok, pid} = KV.Bucket.Supervisor.start_bucket(state.buckets)
        ref = Process.monitor(pid)
        refs = HashDict.put(state.refs, ref, name)
        :ets.insert(state.names, {name, pid})
        GenEvent.sync_notify(state.events, {:create, name, pid})
        {:noreply, %{state | refs: refs}}
    end
  end

  def handle_info({:DOWN, ref, :process, pid, _reason}, state) do
    # 6. Delete from the ETS table instead of the HashDict
    {name, refs} = HashDict.pop(state.refs, ref)
    :ets.delete(state.names, name)
    GenEvent.sync_notify(state.events, {:exit, name, pid})
    {:noreply, %{state | refs: refs}}
  end

  def handle_info(_msg, state) do
    {:noreply, state}
  end
end
```

Notice that before our changes `KV.Registry.lookup/2` sent requests to the server, but now it reads directly from the ETS table, which is shared across all processes. That's the main idea behind the cache mechanism we are implementing.

In order for the cache mechanism to work, the created ETS table needs to have access `:protected` (the default), so all clients can read from it, while only the `KV.Registry` process writes to it. We have also set `read_concurrency: true` when starting the table, optimizing the table for the common scenario of concurrent read operations.

The changes we have performed above have definitely broken our tests. For starters, there is a new argument we need to pass to `KV.Registry.start_link/3`. Let's start amending our tests in `test/kv/registry_test.exs` by rewriting the `setup` callback:

```elixir
setup do
  {:ok, sup} = KV.Bucket.Supervisor.start_link
  {:ok, manager} = GenEvent.start_link
  {:ok, registry} = KV.Registry.start_link(:registry_table, manager, sup)

  GenEvent.add_mon_handler(manager, Forwarder, self())
  {:ok, registry: registry, ets: :registry_table}
end
```

Notice we are passing the table name of `:registry_table` to `KV.Registry.start_link/3` as well as returning `ets: :registry_table` as part of the test context.

After changing the callback above, we will still have failures in our test suite. All in the format of:

```
1) test spawns buckets (KV.RegistryTest)
   test/kv/registry_test.exs:38
   ** (ArgumentError) argument error
   stacktrace:
     (stdlib) :ets.lookup(#PID<0.99.0>, "shopping")
     (kv) lib/kv/registry.ex:22: KV.Registry.lookup/2
     test/kv/registry_test.exs:39
```

This is happening because we are passing the registry pid to `KV.Registry.lookup/2` while now it expects the ETS table. We can fix this by changing all occurrences of:

```elixir
KV.Registry.lookup(registry, ...)
```

to:

```elixir
KV.Registry.lookup(ets, ...)
```

Where `ets` will be retrieved in the same way we retrieve the registry:

```elixir
test "spawns buckets", %{registry: registry, ets: ets} do
```

Let's change our tests to pass `ets` to `lookup/2`. Once we finish these changes, some tests will continue to fail. You may even notice tests pass and fail inconsistently between runs. For example, the "spawns buckets" test:

```elixir
test "spawns buckets", %{registry: registry, ets: ets} do
  assert KV.Registry.lookup(ets, "shopping") == :error

  KV.Registry.create(registry, "shopping")
  assert {:ok, bucket} = KV.Registry.lookup(ets, "shopping")

  KV.Bucket.put(bucket, "milk", 1)
  assert KV.Bucket.get(bucket, "milk") == 1
end
```

may be failing on this line:

```elixir
assert {:ok, bucket} = KV.Registry.lookup(ets, "shopping")
```

However how can this line fail if we just created the bucket in the previous line?

The reason those failures are happening is because, for didactic purposes, we have made two mistakes:

1. We are prematurely optimizing (by adding this cache layer)
2. We are using `cast/2` (while we should be using `call/2`)

## Race conditions?

Developing in Elixir does not make your code free of race conditions. However, Elixir's simple abstractions where nothing is shared by default make it easier to spot a race condition's root cause.

What is happening in our test is that there is a delay in between an operation and the time we can observe this change in the ETS table. Here is what we were expecting to happen:

1. We invoke `KV.Registry.create(registry, "shopping")`
2. The registry creates the bucket and updates the cache table
3. We access the information from the table with `KV.Registry.lookup(ets, "shopping")`
4. The command above returns `{:ok, bucket}`

However, since `KV.Registry.create/2` is a cast operation, the command will return before we actually write to the table! In other words, this is happening:

1. We invoke `KV.Registry.create(registry, "shopping")`
2. We access the information from the table with `KV.Registry.lookup(ets, "shopping")`
3. The command above returns `:error`
4. The registry creates the bucket and updates the cache table

To fix the failure we just need to make `KV.Registry.create/2` synchronous by using `call/2` rather than `cast/2`. This will guarantee that the client will only continue after changes have been made to the table. Let's change the function and its callback as follows:

```elixir
def create(server, name) do
  GenServer.call(server, {:create, name})
end

def handle_call({:create, name}, _from, state) do
  case lookup(state.names, name) do
    {:ok, pid} ->
      {:reply, pid, state} # Reply with pid
    :error ->
      {:ok, pid} = KV.Bucket.Supervisor.start_bucket(state.buckets)
      ref = Process.monitor(pid)
      refs = HashDict.put(state.refs, ref, name)
      :ets.insert(state.names, {name, pid})
      GenEvent.sync_notify(state.events, {:create, name, pid})
      {:reply, pid, %{state | refs: refs}} # Reply with pid
  end
end
```

We simply changed the callback from `handle_cast/2` to `handle_call/3` and changed it to reply with the pid of the created bucket.

Let's run the tests once again. This time though, we will pass the `--trace` option:

```bash
$ mix test --trace
```

The `--trace` option is useful when your tests are deadlocking or there are race conditions, as it runs all tests synchronously (`async: true` has no effect) and shows detailed information about each test. This time we should be down to one failure (that may be intermittent):

```
1) test removes buckets on exit (KV.RegistryTest)
   test/kv/registry_test.exs:48
   Assertion with == failed
   code: KV.Registry.lookup(ets, "shopping") == :error
   lhs:  {:ok, #PID<0.103.0>}
   rhs:  :error
   stacktrace:
     test/kv/registry_test.exs:52
```

According to the failure message, we are expecting that the bucket no longer exists on the table, but it still does! This problem is the opposite of the one we have just solved: while previously there was a delay between the command to create a bucket and updating the table, now there is a delay between the bucket process dying and its entry being removed from the table.

Unfortunately this time we cannot simply change `handle_info/2` to a synchronous operation. We can, however, fix our tests by using event manager notifications. Let's take another look at our `handle_info/2` implementation:

```elixir
def handle_info({:DOWN, ref, :process, pid, _reason}, state) do
  # 5. Delete from the ETS table instead of the HashDict
  {name, refs} = HashDict.pop(state.refs, ref)
  :ets.delete(state.names, name)
  GenEvent.sync_notify(state.event, {:exit, name, pid})
  {:noreply, %{state | refs: refs}}
end
```

Notice that we are deleting from the ETS table **before** we send the notification. This is by design! This means that when we receive the `{:exit, name, pid}` notification, the table will already be up to date. Let's update the remaining failing test as follows:

```elixir
test "removes buckets on exit", %{registry: registry, ets: ets} do
  KV.Registry.create(registry, "shopping")
  {:ok, bucket} = KV.Registry.lookup(ets, "shopping")
  Agent.stop(bucket)
  assert_receive {:exit, "shopping", ^bucket} # Wait for event
  assert KV.Registry.lookup(ets, "shopping") == :error
end
```

We have simply amended the test to guarantee we first receive the `{:exit, name, pid}` message before invoking `KV.Registry.lookup/2`.

It is important to observe that we were able to keep our suite passing without a need to use `:timer.sleep/1` or other tricks. Most of the time, we can rely on events, monitoring and messages to assert the system is in an expected state before performing assertions.

For your convenience, here is the fully passing test case:

```elixir
defmodule KV.RegistryTest do
  use ExUnit.Case, async: true

  defmodule Forwarder do
    use GenEvent

    def handle_event(event, parent) do
      send parent, event
      {:ok, parent}
    end
  end

  setup do
    {:ok, sup} = KV.Bucket.Supervisor.start_link
    {:ok, manager} = GenEvent.start_link
    {:ok, registry} = KV.Registry.start_link(:registry_table, manager, sup)

    GenEvent.add_mon_handler(manager, Forwarder, self())
    {:ok, registry: registry, ets: :registry_table}
  end

  test "sends events on create and crash", %{registry: registry, ets: ets} do
    KV.Registry.create(registry, "shopping")
    {:ok, bucket} = KV.Registry.lookup(ets, "shopping")
    assert_receive {:create, "shopping", ^bucket}

    Agent.stop(bucket)
    assert_receive {:exit, "shopping", ^bucket}
  end

  test "spawns buckets", %{registry: registry, ets: ets} do
    assert KV.Registry.lookup(ets, "shopping") == :error

    KV.Registry.create(registry, "shopping")
    assert {:ok, bucket} = KV.Registry.lookup(ets, "shopping")

    KV.Bucket.put(bucket, "milk", 1)
    assert KV.Bucket.get(bucket, "milk") == 1
  end

  test "removes buckets on exit", %{registry: registry, ets: ets} do
    KV.Registry.create(registry, "shopping")
    {:ok, bucket} = KV.Registry.lookup(ets, "shopping")
    Agent.stop(bucket)
    assert_receive {:exit, "shopping", ^bucket} # Wait for event
    assert KV.Registry.lookup(ets, "shopping") == :error
  end

  test "removes bucket on crash", %{registry: registry, ets: ets} do
    KV.Registry.create(registry, "shopping")
    {:ok, bucket} = KV.Registry.lookup(ets, "shopping")

    # Kill the bucket and wait for the notification
    Process.exit(bucket, :shutdown)
    assert_receive {:exit, "shopping", ^bucket}
    assert KV.Registry.lookup(ets, "shopping") == :error
  end
end
```

With tests passing, we just need to update the supervisor `init/1` callback at `lib/kv/supervisor.ex` to pass the ETS table name as an argument to the registry worker:

```elixir
@manager_name KV.EventManager
@registry_name KV.Registry
@ets_registry_name KV.Registry
@bucket_sup_name KV.Bucket.Supervisor

def init(:ok) do
  children = [
    worker(GenEvent, [[name: @manager_name]]),
    supervisor(KV.Bucket.Supervisor, [[name: @bucket_sup_name]]),
    worker(KV.Registry, [@ets_registry_name, @manager_name,
                         @bucket_sup_name, [name: @registry_name]])
  ]

  supervise(children, strategy: :one_for_one)
end
```

Note that we are using `KV.Registry` as name for the ETS table as well, which makes it convenient to debug, as it points to the module using it. ETS names and process names are stored in different registries, so there is no chance of conflicts.

## ETS as persistent storage

So far we have created an ETS table during the registry initialization but we haven't bothered to close the table on registry termination. That's because the ETS table is "linked" (in a figure of speech) to the process that creates it. If that process dies, the table is automatically closed.

This is extremely convenient as a default behaviour, and we can use it even more to our advantage. Remember that there is a dependency between the registry and the buckets supervisor. If the registry dies, we want the buckets supervisor to die too, because once the registry dies all information linking the bucket name to the bucket process is lost. However, what if we could keep the registry data even if the registry process crashes? If we are able to do so, we remove the dependency between the registry and the buckets supervisor, making the `:one_for_one` strategy the perfect strategy for our supervisor.

A couple of changes will be required in order to make this happen. First, we'll need to start the ETS table inside the supervisor. Second, we'll need to change the table's access type from `:protected` to `:public`, because the owner is the supervisor, but the process doing the writes is still the manager.

Let's get started by first changing `KV.Supervisor`'s `init/1` callback:

```elixir
def init(:ok) do
  ets = :ets.new(@ets_registry_name,
                 [:set, :public, :named_table, {:read_concurrency, true}])

  children = [
    worker(GenEvent, [[name: @manager_name]]),
    supervisor(KV.Bucket.Supervisor, [[name: @bucket_sup_name]]),
    worker(KV.Registry, [ets, @manager_name,
                         @bucket_sup_name, [name: @registry_name]])
  ]

  supervise(children, strategy: :one_for_one)
end
```

Next, we change `KV.Registry`'s `init/1` callback, as it no longer needs to create a table. It should instead just use the one given as an argument:

```elixir
def init({table, events, buckets}) do
  refs = HashDict.new
  {:ok, %{names: table, refs: refs, events: events, buckets: buckets}}
end
```

Finally, we just need to change the `setup` callback in `test/kv/registry_test.exs` to explicitly create the ETS table. We will use this opportunity to also split the `setup` functionality into a private function that will be handy soon:

```elixir
setup do
  ets = :ets.new(:registry_table, [:set, :public])
  registry = start_registry(ets)
  {:ok, registry: registry, ets: ets}
end

defp start_registry(ets) do
  {:ok, sup} = KV.Bucket.Supervisor.start_link
  {:ok, manager} = GenEvent.start_link
  {:ok, registry} = KV.Registry.start_link(ets, manager, sup)

  GenEvent.add_mon_handler(manager, Forwarder, self())
  registry
end
```

After those changes, our test suite should continue to be green!

There is just one last scenario to consider: once we receive the ETS table, there may be existing bucket pids on the table. After all, that's the whole purpose of this change! However, the newly started registry is not monitoring those buckets, as they were created as part of previous, now defunct, registry. This means that the table may go stale, because we won't remove those buckets if they die.

Let's add a test to `test/kv/registry_test.exs` that shows this bug:

```elixir
test "monitors existing entries", %{registry: registry, ets: ets} do
  bucket = KV.Registry.create(registry, "shopping")

  # Kill the registry. We unlink first, otherwise it will kill the test
  Process.unlink(registry)
  Process.exit(registry, :shutdown)

  # Start a new registry with the existing table and access the bucket
  start_registry(ets)
  assert KV.Registry.lookup(ets, "shopping") == {:ok, bucket}

  # Once the bucket dies, we should receive notifications
  Process.exit(bucket, :shutdown)
  assert_receive {:exit, "shopping", ^bucket}
  assert KV.Registry.lookup(ets, "shopping") == :error
end
```

Run the new test and it will fail with:

```
1) test monitors existing entries (KV.RegistryTest)
   test/kv/registry_test.exs:72
   No message matching {:exit, "shopping", ^bucket}
   stacktrace:
     test/kv/registry_test.exs:85
```

That's what we expected. If the bucket is not being monitored, the registry is not notified when it dies and therefore no event is sent. We can fix this by changing `KV.Registry`'s `init/1` callback one last time to setup monitors for all existing entries in the table:

```elixir
def init({table, events, buckets}) do
  refs = :ets.foldl(fn {name, pid}, acc ->
    HashDict.put(acc, Process.monitor(pid), name)
  end, HashDict.new, table)

  {:ok, %{names: table, refs: refs, events: events, buckets: buckets}}
end
```

We use `:ets.foldl/3` to go through all entries in the table, similar to `Enum.reduce/3`, invoking the given function for each element in the table with the given accumulator. In the function callback, we monitor each pid in the table and update the refs dictionary accordingly. If any of the entries is already dead, we will still receive the `:DOWN` message, causing them to be purged later.

In this chapter we were able to make our application more robust by using an ETS table that is owned by the supervisor and passed to the registry. We have also explored how to use ETS as a cache and discussed some of the race conditions we may run into as data becomes shared between the server and all clients.
