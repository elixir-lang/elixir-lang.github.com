---
layout: getting-started
title: Supervisor and Application
---

# {{ page.title }}

{% include toc.html %}

{% include mix-otp-preface.html %}

So far our application has a registry that may monitor dozens, if not hundreds, of buckets. While we think our implementation so far is quite good, no software is bug free, and failures are definitely going to happen.

When things fail, your first reaction may be: "let's rescue those errors". But in Elixir we avoid the defensive programming habit of rescuing exceptions. Instead, we say "let it crash". If there is a bug that leads our registry to crash, we have nothing to worry about because we are going to set up a supervisor that will start a fresh copy of the registry.

In this chapter, we are going to learn about supervisors and also about applications. We are going to create not one, but two supervisors, and use them to supervise our processes.

## Our first supervisor

Creating a supervisor is not much different from creating a GenServer. We are going to define a module named `KV.Supervisor`, which will use the [Supervisor](https://hexdocs.pm/elixir/Supervisor.html) behaviour, inside the `lib/kv/supervisor.ex` file:

```elixir
defmodule KV.Supervisor do
  use Supervisor

  def start_link(opts) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  def init(:ok) do
    children = [
      KV.Registry
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end
```

Our supervisor has a single child so far: `KV.Registry`. After we define a list of children, we call `Supervisor.init/2`, passing the children and the supervision strategy.

The supervision strategy dictates what happens when one of the children crashes. `:one_for_one` means that if a child dies, it will be the only one restarted. Since we have only one child now, that's all we need. The `Supervisor` behaviour supports many different strategies and we will discuss them in this chapter.

Once the supervisor starts, it will traverse the list of children and it will invoke the `child_spec/1` function on each module. We heard about the `child_spec/1` function in the Agent chapter, when we called `start_supervised(KV.Bucket)` without defining the module.

The `child_spec/1` function returns the child specification which describes how to start the process, if the process is a worker or a supervisor, if the process is temporary, transient or permanent and so on. The `child_spec/1` function is automatically defined when we `use Agent`, `use GenServer`, `use Supervisor`, etc. Let's give it a try in the terminal with `iex -S mix`:

```iex
iex(1)> KV.Registry.child_spec([])
%{
  id: KV.Registry,
  restart: :permanent,
  shutdown: 5000,
  start: {KV.Registry, :start_link, [[]]},
  type: :worker
}
```

We will learn those details as we move forward on this guide. If you would rather peek ahead, check the [Supervisor](https://hexdocs.pm/elixir/Supervisor.html) docs.

After the supervisor retrieves all child specifications, it proceeds to start its children one by one, in the order they were defined, using the information in the `:start` key in the child specification. For our current specification, it will call `KV.Registry.start_link([])`.

So far `start_link/1` has always receive an empty list of options. It is time we change that.

## Naming processes

While our application will have many buckets, it will only have a single registry. So instead of always passing the registry PID around, we can give the registry a name, and always reference it by its name.

Also, remember buckets were started dynamically based on user input, and that meant we should not use atom names for managing our buckets. But the registry is in the opposite situation, we want to start a single registry, preferrably under a supervisor, when our application boots.

So let's do that. Let's slightly change our children definition to be a list of tuples instead of a list of atoms:

```elixir
  def init(:ok) do
    children = [
      {KV.Registry, name: KV.Registry}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
```

The difference now is that, instead of calling `KV.Registry.start_link([])`, the Supervisor will call `KV.Registry.start_link([name: KV.Registry])`. If you revisit `KV.Registry.start_link/1` implementation, you will remember it simply passes the options to GenServer

```elixir
  def start_link(opts) do
    GenServer.start_link(__MODULE__, :ok, opts)
  end
```

which in turn will register the process with the given name.

Let's give this all a try inside `iex -S mix`:

```iex
iex> KV.Supervisor.start_link([])
{:ok, #PID<0.66.0>}
iex> KV.Registry.create(KV.Registry, "shopping")
:ok
iex> KV.Registry.lookup(KV.Registry, "shopping")
{:ok, #PID<0.70.0>}
```

When we started the supervisor, the registry was automatically started with the given name, allowing us to create buckets without the need to manually start it.

In practice we rarely start the application supervisor manually. Instead it is started as part of the application callback.

## Understanding applications

We have been working inside an application this entire time. Every time we changed a file and ran `mix compile`, we could see a `Generated kv app` message in the compilation output.

We can find the generated `.app` file at `_build/dev/lib/kv/ebin/kv.app`. Let's have a look at its contents:

```erlang
{application,kv,
             [{registered,[]},
              {description,"kv"},
              {applications,[kernel,stdlib,elixir,logger]},
              {vsn,"0.0.1"},
              {modules,['Elixir.KV','Elixir.KV.Bucket',
                        'Elixir.KV.Registry','Elixir.KV.Supervisor']}]}.
```

This file contains Erlang terms (written using Erlang syntax). Even though we are not familiar with Erlang, it is easy to guess this file holds our application definition. It contains our application `version`, all the modules defined by it, as well as a list of applications we depend on, like Erlang's `kernel`, `elixir` itself, and `logger` which is specified in the `:extra_applications` list in `mix.exs`.

It would be pretty boring to update this file manually every time we add a new module to our application. That's why Mix generates and maintains it for us.

We can also configure the generated `.app` file by customizing the values returned by the `application/0` inside our `mix.exs` project file. We are going to do our first customization soon.

### Starting applications

When we define a `.app` file, which is the application specification, we are able to start and stop the application as a whole. We haven't worried about this so far for two reasons:

1. Mix automatically starts our current application for us

2. Even if Mix didn't start our application for us, our application does not yet do anything when it starts

In any case, let's see how Mix starts the application for us. Let's start a project console with `iex -S mix` and try:

```iex
iex> Application.start(:kv)
{:error, {:already_started, :kv}}
```

Oops, it's already started. Mix normally starts the whole hierarchy of applications defined in our project's `mix.exs` file and it does the same for all dependencies if they depend on other applications.

We can pass an option to Mix to ask it to not start our application. Let's give it a try by running `iex -S mix run --no-start`:

```iex
iex> Application.start(:kv)
:ok
```

We can stop our `:kv` application as well as the `:logger` application, which is started by default with Elixir:

```iex
iex> Application.stop(:kv)
:ok
iex> Application.stop(:logger)
:ok
```

And let's try to start our application again:

```iex
iex> Application.start(:kv)
{:error, {:not_started, :logger}}
```

Now we get an error because an application that `:kv` depends on (`:logger` in this case) isn't started. We need to either start each application manually in the correct order or call `Application.ensure_all_started` as follows:

```iex
iex> Application.ensure_all_started(:kv)
{:ok, [:logger, :kv]}
```

Nothing really exciting happens but it shows how we can control our application.

> When you run `iex -S mix`, it is equivalent to running `iex -S mix run`. So whenever you need to pass more options to Mix when starting IEx, it's a matter of typing `iex -S mix run` and then passing any options the `run` command accepts. You can find more information about `run` by running `mix help run` in your shell.

### The application callback

Since we spent all this time talking about how applications are started and stopped, there must be a way to do something useful when the application starts. And indeed, there is!

We can specify an application callback function. This is a function that will be invoked when the application starts. The function must return a result of `{:ok, pid}`, where `pid` is the process identifier of a supervisor process.

We can configure the application callback in two steps. First, open up the `mix.exs` file and change `def application` to the following:

```elixir
  def application do
    [
      extra_applications: [:logger],
      mod: {KV, []}
    ]
  end
```

The `:mod` option specifies the "application callback module", followed by the arguments to be passed on application start. The application callback module can be any module that implements the [Application](https://hexdocs.pm/elixir/Application.html) behaviour.

Now that we have specified `KV` as the module callback, we need to change the `KV` module, defined in `lib/kv.ex`:

```elixir
defmodule KV do
  use Application

  def start(_type, _args) do
    KV.Supervisor.start_link(name: KV.Supervisor)
  end
end
```

When we `use Application`, we need to define a couple functions, similar to when we used `Supervisor` or `GenServer`. This time we only need to define a `start/2` function. If we wanted to specify custom behaviour on application stop, we could define a `stop/1` function.

Let's start our project console once again with `iex -S mix`. We will see a process named `KV.Registry` is already running:

```iex
iex> KV.Registry.create(KV.Registry, "shopping")
:ok
iex> KV.Registry.lookup(KV.Registry, "shopping")
{:ok, #PID<0.88.0>}
```

How do we know this is working? After all, we are creating the bucket and then looking it up; of course it should work, right? Well, remember that `KV.Registry.create/2` uses `GenServer.cast/2`, and therefore will return `:ok` regardless of whether the message finds its target or not. At that point, we don't know whether the supervisor and the server are up, and if the bucket was created. However, `KV.Registry.lookup/2` uses `GenServer.call/3`, and will block and wait for a response from the server. We do get a positive response, so we know all is up and running.

For an experiment, try reimplementing `KV.Registry.create/2` to use `GenServer.call/3` instead, and momentarily disable the application callback. Run the code above on the console again, and you will see the creation step fail straightaway.

Don't forget to bring the code back to normal before resuming this tutorial!

### Projects or applications?

Mix makes a distinction between projects and applications. Based on the contents of our `mix.exs` file, we would say we have a Mix project that defines the `:kv` application. As we will see in later chapters, there are projects that don't define any application.

When we say "project" you should think about Mix. Mix is the tool that manages your project. It knows how to compile your project, test your project and more. It also knows how to compile and start the application relevant to your project.

When we talk about applications, we talk about  <abbr title="Open Telecom Platform">OTP</abbr>. Applications are the entities that are started and stopped as a whole by the runtime. You can learn more about applications in the [docs for the Application module](https://hexdocs.pm/elixir/Application.html), as well as by running `mix help compile.app` to learn more about the supported options in `def application`.

## Simple one for one supervisors

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

At the end of the day, tools like Observer is one of the main reasons you want to always start processes inside supervision trees, even if they are temporary, to ensure they are always reachable and introspectable.

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

Now that our application is properly supervised and tested, let's see how we can speed things up.
