---
layout: getting-started
title: Simple one for one supervisors
---

# {{ page.title }}

{% include toc.html %}

{% include mix-otp-preface.html %}

We have now successfully defined our supervisor which is automatically started (and stopped) as part of our application lifecycle.

Remember however that our `KV.Registry` is both linking (via `start_link`) and monitoring (via `monitor`) bucket processes in the `handle_cast/2` callback:

```elixir
{:ok, pid} = KV.Bucket.start_link([])
ref = Process.monitor(pid)
```

Links are bi-directional, which implies that a crash in a bucket will crash the registry. Although we now have the supervisor, which guarantees the registry will be back up and running, crashing the registry still means we lose all data associating bucket names to their respective processes.

In other words, we want the registry to keep on running even if a bucket crashes. Let's write a new registry test:

```elixir
test "removes bucket on crash", %{registry: registry} do
  KV.Registry.create(registry, "shopping")
  {:ok, bucket} = KV.Registry.lookup(registry, "shopping")

  # Stop the bucket with non-normal reason
  Agent.stop(bucket, :shutdown)
  assert KV.Registry.lookup(registry, "shopping") == :error
end
```

The test is similar to "removes bucket on exit" except that we are being a bit more harsh by sending `:shutdown` as the exit reason instead of `:normal`. If a process terminates with a reason different than `:normal`, all linked processes receive an EXIT signal, causing the linked process to also terminate unless they are trapping exits.

Since the bucket terminated, the registry went away with it, and our test fails when trying to `GenServer.call/3` it:

```
  1) test removes bucket on crash (KV.RegistryTest)
     test/kv/registry_test.exs:26
     ** (exit) exited in: GenServer.call(#PID<0.148.0>, {:lookup, "shopping"}, 5000)
         ** (EXIT) no process: the process is not alive or there's no process currently associated with the given name, possibly because its application isn't started
     code: assert KV.Registry.lookup(registry, "shopping") == :error
     stacktrace:
       (elixir) lib/gen_server.ex:770: GenServer.call/3
       test/kv/registry_test.exs:33: (test)
```

We are going to solve this issue by defining a new supervisor that will spawn and supervise all buckets. There is one supervisor strategy, called `:simple_one_for_one`, that is the perfect fit for such situations: it allows us to specify a worker template and supervise many children based on this template. With this strategy, no workers are started during the supervisor initialization. Instead, a worker is started manually via the `Supervisor.start_child/2` function.

## The bucket supervisor

Let's define our `KV.BucketSupervisor` in `lib/kv/bucket_supervisor.ex` as follows:

```elixir
defmodule KV.BucketSupervisor do
  use Supervisor

  # A simple module attribute that stores the supervisor name
  @name KV.BucketSupervisor

  def start_link(_opts) do
    Supervisor.start_link(__MODULE__, :ok, name: @name)
  end

  def start_bucket do
    Supervisor.start_child(@name, [])
  end

  def init(:ok) do
    Supervisor.init([KV.Bucket], strategy: :simple_one_for_one)
  end
end
```

There are two changes in this supervisor compared to the first one.

First of all, we have decided to give the supervisor a local name of `KV.BucketSupervisor`. While we could have passed the `opts` received on `start_link/1` to the supervisor, we chose to hard code the name for simplicity. Note this approach has downsides. For example, you wouldn't be able to start multiple instances of the `KV.BucketSupervisor` during tests, as they would conflict on the name. In this case, we will just allow all registries to use the same bucket supervisor at once, that won't be a problem since children of a simple one for one supervisor don't interfere with one another.

We have also defined a `start_bucket/0` function that will start a bucket as a child of our supervisor named `KV.BucketSupervisor`. `start_bucket/0` is the function we are going to invoke instead of calling `KV.Bucket.start_link/1` directly in the registry.

Run `iex -S mix` so we can give our new supervisor a try:

```iex
iex> {:ok, _} = KV.BucketSupervisor.start_link([])
{:ok, #PID<0.70.0>}
iex> {:ok, bucket} = KV.BucketSupervisor.start_bucket
{:ok, #PID<0.72.0>}
iex> KV.Bucket.put(bucket, "eggs", 3)
:ok
iex> KV.Bucket.get(bucket, "eggs")
3
```

We are almost ready to use the simple one for one supervisor in our application. The first step is to change the registry to invoke `start_bucket`:

```elixir
  def handle_cast({:create, name}, {names, refs}) do
    if Map.has_key?(names, name) do
      {:noreply, {names, refs}}
    else
      {:ok, pid} = KV.BucketSupervisor.start_bucket()
      ref = Process.monitor(pid)
      refs = Map.put(refs, ref, name)
      names = Map.put(names, name, pid)
      {:noreply, {names, refs}}
    end
  end
```

The second step is to make sure `KV.BucketSupervisor` is started when our application boots. We can do this by opening `lib/kv/supervisor.ex` and changing `init/1` to the following:

```elixir
  def init(:ok) do
    children = [
      {KV.Registry, name: KV.Registry},
      KV.BucketSupervisor
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
```

That's enough for our tests to pass but there is a resource leakage in our application. When a bucket terminates, the supervisor will start a new bucket in its place. After all, that's the role of the supervisor!

However, when the supervisor restarts the new bucket, the registry does not know about it. So we will have an empty bucket in the supervisor that nobody can access! To solve this, we want to say that buckets are actually temporary. If they crash, regardless of the reason, they should not be restarted.

We can do this by passing the `restart: :temporary` option to `use Agent` in `KV.Bucket`:

```elixir
defmodule KV.Bucket do
  use Agent, restart: :temporary
```

Let's also add a test to `test/kv/bucket_test.exs` that guarantees the bucket is temporary:

```elixir
  test "are temporary workers" do
    assert Supervisor.child_spec(KV.Bucket, []).restart == :temporary
  end
```

Our test uses the `Supervisor.child_spec/2` function to retrieve the child specification out of a module and then assert its restart value is `:temporary`. At this point, you may be wondering why use a supervisor if it never restarts its children. It happens that supervisors provide more than restarts, they are also responsible to guarantee proper startup and shutdown, especially in case of crashes in a supervision tree.

## Supervision trees

When we added `KV.BucketSupervisor` as a child of `KV.Supervisor`, we began to have supervisors that supervise other supervisors, forming so-called "supervision trees".

Every time you add a new child to a supervisor, it is important to evaluate if the supervisor strategy is correct as well as the order of child processes. In this case, we are using `:one_for_one` and the `KV.Registry` is started before `KV.BucketSupervisor`.

One flaw that shows up right away is the ordering issue. Since `KV.Registry` invokes `KV.BucketSupervisor`, then the `KV.BucketSupervisor` must be started before `KV.Registry`. Otherwise it may happen that the registry attempts to reach the bucket supervisor before it has started.

The second flaw is related to the supervision strategy. If `KV.Registry` dies, all information linking `KV.Bucket` names to bucket processes is lost. Therefore the `KV.BucketSupervisor` and all children must terminate too - otherwise we will have orphan processes.

In light of this observation, we should consider moving to another supervision strategy. The two other candidates are `:one_for_all` and `:rest_for_one`. A supervisor using the `:rest_for_one` will kill and restart child processes which were started *after* the crashed child. In this case, we would want `KV.BucketSupervisor` to terminate if `KV.Bucket` terminates. This would require the bucket supervisor to be placed after the registry. Which violates the ordering constraints we have established two paragraphs above.

So our last option is to go all in and pick the `:one_for_all` strategy: the supervisor will kill and restart all of its children processes whenever any one of them dies. This is a complete reasonable approach for our application, since the registry can't work without the bucket supervisor, and the bucket supervisor should terminate without the registry. Let's reimplement `init/1` in `KV.Supervisor` to encode those properties:

```elixir
  def init(:ok) do
    children = [
      KV.BucketSupervisor,
      {KV.Registry, name: KV.Registry}
    ]

    Supervisor.init(children, strategy: :one_for_all)
  end
```

To help developers remember how to work with Supervisors and its convenience functions, [Benjamin Tan Wei Hao](http://benjamintan.io/) has created a [Supervisor cheat sheet](https://raw.githubusercontent.com/benjamintanweihao/elixir-cheatsheets/master/Supervisor_CheatSheet.pdf).

There are two topics left before we move on to the next chapter.

## Shared state in tests

So far we have been starting one registry per test to ensure they are isolated:

```elixir
setup do
  {:ok, registry} = start_supervised(KV.Registry)
  %{registry: registry}
end
```

Since we have now changed our registry to use `KV.BucketSupervisor`, which is registered globally, our tests are now relying on this shared supervisor even though each test has its own registry. The question is: should we?

It depends. It is ok to rely on shared state as long as we depend only on a non-shared partition of this state. Although multiple registries may start buckets on the shared bucket supervisor, those buckets and registries are isolated from each other. We would only run into concurrency issues if we used a function like `Supervisor.count_children(KV.Bucket.Supervisor)` which would count all buckets from all registries, potentially giving different results when tests run concurrently.

Since we have relied only on a non-shared partition of the bucket supervisor so far, we don't need to worry about concurrency issues in our test suite. In case it ever becomes a problem, we can start a supervisor per test and pass it as an argument to the registry `start_link` function.

## Observer

Now that we have defined our supervision tree, it is a great opportunity to introduce the Observer tool that ships with Erlang. Start your application with `iex -S mix` and key this in:

```iex
iex> :observer.start
```

A GUI should pop-up containing all sorts of information about our system, from general statistics to load charts as well as a list of all running processes and applications.

In the Applications tab, you will see all applications currently running in your system along side their supervision tree. You can select the `kv` application to explore it further:

<img src="/images/contents/kv-observer.png" width="640" alt="Observer GUI screenshot" />

Not only that, as you create new buckets on the terminal, you should see new processes spawned in the supervision tree shown in Observer:

```iex
iex> KV.Registry.create KV.Registry, "shopping"
:ok
```

We will leave it up to you to further explore what Observer provides. Note you can double click any process in the supervision tree to retrieve more information about it, as well as right-click a process to send "a kill signal", a perfect way to emulate failures and see if your supervisor reacts as expected.

At the end of the day, tools like Observer is one of the reasons you want to always start processes inside supervision trees, even if they are temporary, to ensure they are always reachable and introspectable.

Now that our buckets are properly linked and supervised, let's see how we can speed things up.
