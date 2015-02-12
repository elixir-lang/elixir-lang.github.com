---
layout: getting-started
title: GenEvent
redirect_from: /getting_started/mix_otp/4.html
---

# {{ page.title }}

{% include toc.html %}

In this chapter, we will explore GenEvent, another behaviour provided by Elixir and  <abbr title="Open Telecom Platform">OTP</abbr> that allows us to spawn an event manager that is able to publish events to many handlers.

There are two events we are going to emit: one for every time a bucket is added to the registry and another when it is removed from it.

## Event managers

Let's start a new `iex -S mix` session and explore the GenEvent API a bit:

```elixir
iex> {:ok, manager} = GenEvent.start_link
{:ok, #PID<0.83.0>}
iex> GenEvent.sync_notify(manager, :hello)
:ok
iex> GenEvent.notify(manager, :world)
:ok
```

`GenEvent.start_link/0` starts a new event manager. That is literally all that is required to start a manager. After the manager is created, we can call `GenEvent.notify/2` and `GenEvent.sync_notify/2` to send notifications.

However, since there are no event handlers tied to the manager, not much happens on every notification.

Let's create our first handler, still on IEx, that sends all events to a given process:

```iex
iex> defmodule Forwarder do
...>   use GenEvent
...>   def handle_event(event, parent) do
...>     send parent, event
...>     {:ok, parent}
...>   end
...> end
iex> GenEvent.add_handler(manager, Forwarder, self())
:ok
iex> GenEvent.sync_notify(manager, {:hello, :world})
:ok
iex> flush
{:hello, :world}
:ok
```

We created our handler and added it to the manager by calling `GenEvent.add_handler/3` passing:

1. The manager we previously started and linked
2. The event handler module (named `Forwarder`) we just defined
3. The event handler state: in this case, the current process pid

After adding the handler, we can see that by calling `sync_notify/2`, the `Forwarder` handler successfully forwards events to our inbox.

There are a couple things that are important to highlight at this point:

1. The event handler runs in the same process as the event manager
2. `sync_notify/2` runs event handlers synchronously to the request
3. `notify/2` runs event handlers asynchronously

Therefore, `sync_notify/2` and `notify/2` are analogous to `call/2` and `cast/2` in GenServer and using `sync_notify/2` is generally recommended. It works as a backpressure mechanism in the calling process, to reduce the likelihood of messages being sent more quickly than they can be dispatched to handlers.

Be sure to check other functionality provided by GenEvent in its [module documentation](/docs/stable/elixir/GenEvent.html). For now we have enough knowledge to add an event manager to our application.

## Registry events

In order to emit events, we need to change the registry to work with an event manager. While we could automatically start the event manager when the registry is started, for example in the `init/1` callback, it is preferrable to pass the event manager pid/name to `start_link`, decoupling the start of the event manager from the registry.

Let's first change our tests to showcase the behaviour we want the registry to exhibit. Open up `test/kv/registry_test.exs` and change the existing `setup` callback to the one below, then add the new test:

```elixir
  defmodule Forwarder do
    use GenEvent

    def handle_event(event, parent) do
      send parent, event
      {:ok, parent}
    end
  end

  setup do
    {:ok, manager} = GenEvent.start_link
    {:ok, registry} = KV.Registry.start_link(manager)

    GenEvent.add_mon_handler(manager, Forwarder, self())
    {:ok, registry: registry}
  end

  test "sends events on create and crash", %{registry: registry} do
    KV.Registry.create(registry, "shopping")
    {:ok, bucket} = KV.Registry.lookup(registry, "shopping")
    assert_receive {:create, "shopping", ^bucket}

    Agent.stop(bucket)
    assert_receive {:exit, "shopping", ^bucket}
  end
```

In order to test the functionality we want to add, we first define a `Forwarder` (the same one we typed in IEx previously). On `setup`, we start the event manager, pass it as an argument to the registry and add our `Forwarder` handler to the manager so events can be sent to the test process.

In the test, we create and stop a bucket process and use `assert_receive` to assert we will receive both `:create` and `:exit` messages. `assert_receive` has a default timeout of 500ms which should be more than enough for our tests. Also note that `assert_receive` expects a pattern, rather than a value, that's why we have used `^bucket` to match on the bucket pid.

Finally, notice we called `GenEvent.add_mon_handler/3` instead of `GenEvent.add_handler/3`. This function adds a handler, as we know, and also tells the event manager to monitor the current process. If the current process dies, the event handler is automatically removed. This makes sense because, in the `Forwarder` case, we should stop forwarding messages if the recipient of those messages (`self()`/the test process) is no longer alive.

Let's now change the registry to make the tests pass. Open up `lib/kv/registry.ex` and paste the new registry implementation below (comments inlined):

```elixir
defmodule KV.Registry do
  use GenServer

  ## Client API

  @doc """
  Starts the registry.
  """
  def start_link(event_manager, opts \\ []) do
    # 1. start_link now expects the event manager as argument
    GenServer.start_link(__MODULE__, event_manager, opts)
  end

  @doc """
  Looks up the bucket pid for `name` stored in `server`.

  Returns `{:ok, pid}` in case a bucket exists, `:error` otherwise.
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

  ## Server callbacks

  def init(events) do
    # 2. The init callback now receives the event manager.
    #    We have also changed the manager state from a tuple
    #    to a map, allowing us to add new fields in the future
    #    without needing to rewrite all callbacks.
    names = HashDict.new
    refs  = HashDict.new
    {:ok, %{names: names, refs: refs, events: events}}
  end

  def handle_call({:lookup, name}, _from, state) do
    {:reply, HashDict.fetch(state.names, name), state}
  end

  def handle_cast({:create, name}, state) do
    if HashDict.get(state.names, name) do
      {:noreply, state}
    else
      {:ok, pid} = KV.Bucket.start_link()
      ref = Process.monitor(pid)
      refs = HashDict.put(state.refs, ref, name)
      names = HashDict.put(state.names, name, pid)
      # 3. Push a notification to the event manager on create
      GenEvent.sync_notify(state.events, {:create, name, pid})
      {:noreply, %{state | names: names, refs: refs}}
    end
  end

  def handle_info({:DOWN, ref, :process, pid, _reason}, state) do
    {name, refs} = HashDict.pop(state.refs, ref)
    names = HashDict.delete(state.names, name)
    # 4. Push a notification to the event manager on exit
    GenEvent.sync_notify(state.events, {:exit, name, pid})
    {:noreply, %{state | names: names, refs: refs}}
  end

  def handle_info(_msg, state) do
    {:noreply, state}
  end
end
```

The changes are straightforward. We now pass the event manager we received as an argument to `start_link` on to `GenServer` initialization. We also change both cast and info callbacks to call `GenEvent.sync_notify/2`. Lastly, we have taken the opportunity to change the server state to a map, making it easier to improve the registry in the future.

Run the test suite, and all tests should be green again.

## Event streams

One last functionality worth exploring from `GenEvent` is the ability to consume its events as a stream:

```elixir
iex> {:ok, manager} = GenEvent.start_link
{:ok, #PID<0.83.0>}
iex> spawn_link fn ->
...>   for x <- GenEvent.stream(manager), do: IO.inspect(x)
...> end
:ok
iex> GenEvent.notify(manager, {:hello, :world})
{:hello, :world}
:ok
```

In the example above, we have created a `GenEvent.stream(manager)` that returns a stream (an enumerable) of events that are consumed as they come. Since consuming those events is a blocking action, we spawn a new process that will consume the events and print them to the terminal, and that is exactly the behaviour we see. Every time we call `sync_notify/2` or `notify/2`, the event is printed to the terminal followed by `:ok` (which is just IEx printing the result returned by notify functions).

Often event streams provide enough functionality for consuming events that we don't need to register our own handlers. However, when custom functionality is required, or during testing, defining our own event handler callbacks is the best way to go.

At this point, we have an event manager, a registry and potentially many buckets running at the same time. It is about time to start worrying what would happen if any of those processes crash.
