---
layout: getting-started
title: ETS
---

# {{ page.title }}

{% include toc.html %}

Every time we need to look up a bucket, we need to send a message to the registry. In case our registry is being accessed concurrently by multiple processes, the registry may become a bottleneck!

In this chapter we will learn about ETS (Erlang Term Storage) and how to use it as a cache mechanism.

> Warning! Don't use ETS as a cache prematurely! Log and analyze your application performance and identify which parts are bottlenecks, so you know *whether* you should cache, and *what* you should cache. This chapter is merely an example of how ETS can be used, once you've determined the need.

## ETS as a cache

ETS allows us to store any Elixir term in an in-memory table. Working with ETS tables is done via [Erlang's `:ets` module](http://www.erlang.org/doc/man/ets.html):

```iex
iex> table = :ets.new(:buckets_registry, [:set, :protected])
8207
iex> :ets.insert(table, {"foo", self})
true
iex> :ets.lookup(table, "foo")
[{"foo", #PID<0.41.0>}]
```

When creating an ETS table, two arguments are required: the table name and a set of options. From the available options, we passed the table type and its access rules. We have chosen the `:set` type, which means that keys cannot be duplicated. We've also set the table's access to `:protected`, meaning only the process that created the table can write to it, but all processes can read from it. Those are actually the default values, so we will skip them from now on.

ETS tables can also be named, allowing us to access them by a given name:

```iex
iex> :ets.new(:buckets_registry, [:named_table])
:buckets_registry
iex> :ets.insert(:buckets_registry, {"foo", self})
true
iex> :ets.lookup(:buckets_registry, "foo")
[{"foo", #PID<0.41.0>}]
```

Let's change the `KV.Registry` to use ETS tables. Since our registry requires a name as argument, we are going to name the ETS table with the same name as the registry. ETS names and process names are stored in different locations, so there is no chance of conflicts.

Open up `lib/kv/registry.ex`, and let's change its implementation. We've added comments to the source code to highlight the changes we've made:

```elixir
defmodule KV.Registry do
  use GenServer

  ## Client API

  @doc """
  Starts the registry with the given `name`.
  """
  def start_link(name) do
    # 1. Pass the name to GenServer's init
    GenServer.start_link(__MODULE__, name, name: name)
  end

  @doc """
  Looks up the bucket pid for `name` stored in `server`.

  Returns `{:ok, pid}` if the bucket exists, `:error` otherwise.
  """
  def lookup(server, name) when is_atom(server) do
    # 2. Lookup is now done directly in ETS, without accessing the server
    case :ets.lookup(server, name) do
      [{^name, bucket}] -> {:ok, bucket}
      [] -> :error
    end
  end

  @doc """
  Ensures there is a bucket associated to the given `name` in `server`.
  """
  def create(server, name) do
    GenServer.cast(server, {:create, name})
  end

  @doc """
  Stops the registry.
  """
  def stop(server) do
    GenServer.stop(server)
  end

  ## Server callbacks

  def init(table) do
    # 3. We have replaced the names map by the ETS table
    names = :ets.new(table, [:named_table, read_concurrency: true])
    refs  = %{}
    {:ok, {names, refs}}
  end

  # 4. The previous handle_call callback for lookup was removed

  def handle_cast({:create, name}, {names, refs}) do
    # 5. Read and write to the ETS table instead of the map
    case lookup(names, name) do
      {:ok, _pid} ->
        {:noreply, {names, refs}}
      :error ->
        {:ok, pid} = KV.Bucket.Supervisor.start_bucket
        ref = Process.monitor(pid)
        refs = Map.put(refs, ref, name)
        :ets.insert(names, {name, pid})
        {:noreply, {names, refs}}
    end
  end

  def handle_info({:DOWN, ref, :process, _pid, _reason}, {names, refs}) do
    # 6. Delete from the ETS table instead of the map
    {name, refs} = Map.pop(refs, ref)
    :ets.delete(names, name)
    {:noreply, {names, refs}}
  end

  def handle_info(_msg, state) do
    {:noreply, state}
  end
end
```

Notice that before our changes `KV.Registry.lookup/2` sent requests to the server, but now it reads directly from the ETS table, which is shared across all processes. That's the main idea behind the cache mechanism we are implementing.

In order for the cache mechanism to work, the created ETS table needs to have access `:protected` (the default), so all clients can read from it, while only the `KV.Registry` process writes to it. We have also set `read_concurrency: true` when starting the table, optimizing the table for the common scenario of concurrent read operations.

The changes we have performed above have broken our tests because they were using the pid of the registry process for all operations and now the registry lookup requires the ETS table name. However, since the ETS table has the same name as the registry process, it is an easy fix. Change the setup function in `test/kv/registry_test.exs` to the following:

```elixir
  setup context do
    {:ok, _} = KV.Registry.start_link(context.test)
    {:ok, registry: context.test}
  end
```

Once we change `setup`, some tests will continue to fail. You may even notice tests pass and fail inconsistently between runs. For example, the "spawns buckets" test:

```elixir
  test "spawns buckets", %{registry: registry} do
    assert KV.Registry.lookup(registry, "shopping") == :error

    KV.Registry.create(registry, "shopping")
    assert {:ok, bucket} = KV.Registry.lookup(registry, "shopping")

    KV.Bucket.put(bucket, "milk", 1)
    assert KV.Bucket.get(bucket, "milk") == 1
  end
```

may be failing on this line:

```elixir
{:ok, bucket} = KV.Registry.lookup(registry, "shopping")
```

How can this line fail if we just created the bucket in the previous line?

The reason those failures are happening is because, for didactic purposes, we have made two mistakes:

  1. We are prematurely optimizing (by adding this cache layer)
  2. We are using `cast/2` (while we should be using `call/2`)

## Race conditions?

Developing in Elixir does not make your code free of race conditions. However, Elixir's simple abstractions where nothing is shared by default make it easier to spot a race condition's root cause.

What is happening in our tests is that there is a delay in between an operation and the time we can observe this change in the ETS table. Here is what we were expecting to happen:

1. We invoke `KV.Registry.create(registry, "shopping")`
2. The registry creates the bucket and updates the cache table
3. We access the information from the table with `KV.Registry.lookup(registry, "shopping")`
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

  def handle_call({:create, name}, _from, {names, refs}) do
    case lookup(names, name) do
      {:ok, pid} ->
        {:reply, pid, {names, refs}}
      :error ->
        {:ok, pid} = KV.Bucket.Supervisor.start_bucket
        ref = Process.monitor(pid)
        refs = Map.put(refs, ref, name)
        :ets.insert(names, {name, pid})
        {:reply, pid, {names, refs}}
    end
  end
```

We simply changed the callback from `handle_cast/2` to `handle_call/3` and changed it to reply with the pid of the created bucket. Generally speaking, Elixir developers prefer to use `call/2` instead of `cast/2` as it also provides back-pressure (you block until you get a reply). Using `cast/2` when not necessary can also be considered a premature optimization.

Let's run the tests once again. This time though, we will pass the `--trace` option:

```bash
$ mix test --trace
```

The `--trace` option is useful when your tests are deadlocking or there are race conditions, as it runs all tests synchronously (`async: true` has no effect) and shows detailed information about each test. This time we should be down to one or two intermittent failures:

```
  1) test removes buckets on exit (KV.RegistryTest)
     test/kv/registry_test.exs:19
     Assertion with == failed
     code: KV.Registry.lookup(registry, "shopping") == :error
     lhs:  {:ok, #PID<0.109.0>}
     rhs:  :error
     stacktrace:
       test/kv/registry_test.exs:23
```

According to the failure message, we are expecting that the bucket no longer exists on the table, but it still does! This problem is the opposite of the one we have just solved: while previously there was a delay between the command to create a bucket and updating the table, now there is a delay between the bucket process dying and its entry being removed from the table.

Unfortunately this time we cannot simply change `handle_info/2`, the operation responsible for cleaning the ETS table, to a synchronous operation. Instead we need to find a way to guarantee the registry has processed the `:DOWN` notification sent when the bucket crashed.

An easy way to do so is by sending a synchronous request to the registry: because messages are processed in order, if the registry replies to a request sent after the `Agent.stop` call, it means that the `:DOWN` message has been processed. Let's do so by creating a "bogus" bucket, which is a synchronous request, after `Agent.stop` in both tests:


```elixir
  test "removes buckets on exit", %{registry: registry} do
    KV.Registry.create(registry, "shopping")
    {:ok, bucket} = KV.Registry.lookup(registry, "shopping")
    Agent.stop(bucket)

    # Do a call to ensure the registry processed the down message
    _ = KV.Registry.create(registry, "bogus")
    assert KV.Registry.lookup(registry, "shopping") == :error
  end

  test "removes bucket on crash", %{registry: registry} do
    KV.Registry.create(registry, "shopping")
    {:ok, bucket} = KV.Registry.lookup(registry, "shopping")

    # Kill the bucket and wait for the notification
    Process.exit(bucket, :shutdown)

    # Wait until the bucket is dead
    ref = Process.monitor(bucket)
    assert_receive {:DOWN, ^ref, _, _, _}

    # Do a call to ensure the registry processed the DOWN message
    _ = KV.Registry.create(registry, "bogus")
    assert KV.Registry.lookup(registry, "shopping") == :error
  end
```

Our tests should now (always) pass!

This concludes our optimization chapter. We have used ETS as a cache mechanism where reads can happen from any processes but writes are still serialized through a single process. More importantly, we have also learned that once data can be read asynchronously, we need to be aware of the race conditions it might introduce.

Next let's discuss external and internal dependencies and how Mix helps us manage large codebases.
