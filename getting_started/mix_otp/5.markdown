---
layout: getting_started
title: 5 Supervisor and Application
guide: 5
---

# {{ page.title }}

{% include toc.html %}

So far our application requires an event manager and a registry. It may potentially use dozens, if not hundreds, of buckets. While we may think our implementation so far is quite good, no software is bug free, and failures are definitely going to happen.

When things fail, your first reaction may be: "let's rescue those errors". But, as we have learned in the Getting Started guide, in Elixir we don't have the defensive programming habit of rescuing exceptions, as commonly seen in other languages. Instead, we say "fail fast" or "let it crash". If there is a bug that leads our registry to crash, we have nothing to worry about because we are going to setup a supervisor that will start a fresh copy of the registry.

In this chapter, we are going to learn about supervisors and also about applications. We are going to create not one, but two supervisors, and use them to supervise our processes.

## 5.1 Our first Supervisor

Creating a supervisor is not much different from creating a GenServer. We are going to define a module named `KV.Supervisor`, which will use the [Supervisor](/docs/stable/elixir/Supervisor.html) behaviour, inside the `lib/kv/supervisor.ex` file:

```elixir
defmodule KV.Supervisor do
  use Supervisor

  def start_link do
    Supervisor.start_link(__MODULE__, :ok)
  end

  @manager_name KV.EventManager
  @registry_name KV.Registry

  def init(:ok) do
    children = [
      worker(GenEvent, [[name: @manager_name]]),
      worker(KV.Registry, [@manager_name, [name: @registry_name]])
    ]

    supervise(children, strategy: :one_for_one)
  end
end
```

Our supervisor has two children: the event manager and the registry. It's common to give names to processes under supervision so that other processes can access them by name without needing to know their pid. This is useful because a supervised process might crash, in which case its pid will change when the supervisor restarts it. We declare the names of our supervisor's children by using the module attributes `@manager_name` and `@registry_name`, then reference those attributes in the worker definitions. While it's not required that we declare the names of our child processes in module attributes, it's helpful, because doing so helps make them stand out to the reader of our code.

For example, the `KV.Registry` worker receives two arguments, the first is the name of the event manager and the second is a keyword list of options. In this case, we set the name option to `[name: KV.Registry]` (using our previously-defined module attribute, `@registry_name`), guaranteeing we can access the registry by the name `KV.Registry` throughout the application. It is very common to name the children of a supervisor after the module that defines them, as this association becomes very handy when debugging a live system.

The order children are declared in the supervisor also matters. Since the registry depends on the event manager, we must start the latter before the former. That's why the `GenEvent` worker must come before the `KV.Registry` worker in the children list.

Finally, we call `supervise/2`, passing the list of children and the strategy of `:one_for_one`.

The supervision strategy dictates what happens when one of the children crashes. `:one_for_one` means that if a child dies only one is restarted to replace it. This strategy makes sense for now. If the event manager crashes, there is no reason to restart the registry and vice-versa. However, those dynamics may change once we add more children to supervisor. The `Supervisor` behaviour supports many different strategies and we will discuss three of them in this chapter.

If we start a console inside our project using `iex -S mix`, we can manually start the supervisor:

```iex
iex> KV.Supervisor.start_link
{:ok, #PID<0.66.0>}
iex> KV.Registry.create(KV.Registry, "shopping")
:ok
iex> KV.Registry.lookup(KV.Registry, "shopping")
{:ok, #PID<0.70.0>}
```

When we started the supervisor tree, both the event manager and registry worker were automatically started, allowing us to create buckets without the need to manually start these processes.

In practice though, we rarely start the application supervisor manually. Instead it is started as part of the application callback.

## 5.2 Understanding applications

We have been working inside an application this entire time. Every time we changed a file and ran `mix compile`, we could see `Generated kv.app` message in the compilation output.

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

This file contains Erlang terms (written using Erlang syntax). Even though we are not familiar with Erlang, it is easy to guess this file holds our application definition. It contains our application `version`, all the modules defined by it, as well as a list of applications we depend on, like Erlang's `kernel` and `elixir` itself, and `logger` which is specified in the application list in `mix.exs`.

It would be pretty boring to update this file manually every time we add a new module to our application. That's why mix generates and maintains it automatically for us.

We can also configure the generated `.app` file by customizing the values returned by the `application/0` inside our `mix.exs` project file. We will get to that in upcoming chapters.

### 5.2.1 Starting applications

When we define an `.app` file, which is the application definition, we are able to start and stop the application as a whole. We haven't worried about this so far for two reasons:

1. Mix automatically starts our current application for us

2. Even if Mix didn't start our application for us, our application does not yet need to do anything when it starts

In any case, let's see how Mix starts the application for us. Let's start a project console with `iex -S mix` and try:

```iex
iex> Application.start(:kv)
{:error, {:already_started, :kv}}
```

Oops, it's already started.

We can pass an option to mix to ask it to not start our application. Let's give it a try by running `iex -S mix run --no-start`:

```elixir
iex> Application.start(:kv)
{:error, {:not_started, :logger}}
```

Now we get an error because an application that `:kv` depends on (`:logger` in this case) hasn't been started. Mix normally starts the whole hierarchy of applications defined in our project's `mix.exs` file and it does the same for all dependencies if they depend on other applications. But since we passed the `--no-start` flag, we need to either start each application manually in the correct order or call `Application.ensure_all_started` as follows:

```elixir
iex> Application.ensure_all_started(:kv)
{:ok, [:logger, :kv]}
iex> Application.stop(:kv)
18:12:10.698 [info] Application kv exited :stopped
:ok
```

Nothing really exciting happens but it shows how we can control our application.

> When you run `iex -S mix`, it is equivalent to running `iex -S mix run`. So whenever you need to pass more options to mix when starting iex, it's just a matter of typing `mix run` and then passing any options the `run` command accepts. You can find more information about `run` by running `mix help run` in your shell.

### 5.2.2 The application callback

Since we spent all this time talking about how applications are started and stopped, there must be a way to do something useful when the application starts. And indeed, there is!

We can specify an application callback function. This is a function that will be invoked when the application starts. The function must return a result of `{:ok, pid}`, where `pid` is the process identifier of a supervisor process.

We can configure the application callback in two steps. First, open up the `mix.exs` file and change `def application` to the following:

```elixir
def application do
  [applications: [],
   mod: {KV, []}]
end
```

The `:mod` option specifies the "application callback module", followed by the arguments to be passed on application start. The application callback module can be any module that implements the [Application](/docs/stable/elixir/Application.html) behaviour.

Now that we have specified `KV` as the module callback, we need to change the `KV` module, defined in `lib/kv.ex`:

```elixir
defmodule KV do
  use Application

  def start(_type, _args) do
    KV.Supervisor.start_link
  end
end
```

When we `use Application`, we only need to define a `start/2` function. If we wanted to specify custom behaviour on application stop, we could define a `stop/1` function, as well. In this case, the one automatically defined by `use Application` is fine.

Let's start our project console once again with `iex -S mix`. We will see a process named `KV.Registry` is already running:

```iex
iex> KV.Registry.create(KV.Registry, "shopping")
:ok
iex> KV.Registry.lookup(KV.Registry, "shopping")
{:ok, #PID<0.88.0>}
```

Excellent!

### 5.2.3 Projects or applications?

Mix makes a distinction between projects and applications. Based on the current contents of our `mix.exs` file, we would say we have a Mix project that defines the `:kv` application. As we will see in later chapters, there are projects that don't define any application.

When we say "project," you should think about Mix. Mix is the tool that manages your project. It knows how to compile your project, test your project and more. It also knows how to compile and start the application relevant to your project.

When we talk about applications, we talk about  <abbr title="Open Telecom Platform">OTP</abbr>. Applications are the entities that are started and stopped as a whole by the runtime. You can learn more about applications in the [docs for the Application module](/docs/stable/elixir/Application.html), as well as by running `mix help compile.app` to learn more about the supported options in `def application`.

## 5.3 Simple one for one supervisors

We have now successfully defined our supervisor which is automatically started (and stopped) as part of our application lifecycle.

Remember however that our `KV.Registry` is both linking and monitoring bucket processes in the `handle_cast/2` callback:

```elixir
{:ok, pid} = KV.Bucket.start_link()
ref = Process.monitor(pid)
```

Links are bi-directional, which implies that a crash in a bucket will crash the registry. Although we now have the supervisor, which guarantees the registry will be back up and running, crashing the registry still means we lose all data associating bucket names to their respective processes.

In other words, we want the registry to keep on running even if a bucket crashes. Let's write a test:

```elixir
test "removes bucket on crash", %{registry: registry} do
  KV.Registry.create(registry, "shopping")
  {:ok, bucket} = KV.Registry.lookup(registry, "shopping")

  # Kill the bucket and wait for the notification
  Process.exit(bucket, :shutdown)
  assert_receive {:exit, "shopping", ^bucket}
  assert KV.Registry.lookup(registry, "shopping") == :error
end
```

The test is similar to "removes bucket on exit" except that we are being a bit more harsh. Instead of using `Agent.stop/1`, we are sending an exit signal to shutdown the bucket. Since the bucket is linked to the registry, which is then linked to the test process, killing the bucket causes the registry to crash which then causes the test process to crash too:

```
1) test removes bucket on crash (KV.RegistryTest)
   test/kv/registry_test.exs:52
   ** (EXIT from #PID<0.94.0>) shutdown
```

One possible solution to this issue would be to provide a `KV.Bucket.start/0`, that invokes `Agent.start/1`, and use it from the registry, removing the link between registry and buckets. However, this would be a bad idea, because buckets would not be linked to any process after this change. This means that if someone stops the `kv` application, all buckets would remain alive as they are unreachable.

We are going to solve this issue by defining a new supervisor that will spawn and supervise all buckets. There is one supervisor strategy, called `:simple_one_for_one`, that is the perfect fit for such situations: it allows us to specify a worker template and supervise many children based on this template.

Let's define our `KV.Bucket.Supervisor` as follows:

```elixir
defmodule KV.Bucket.Supervisor do
  use Supervisor

  def start_link(opts \\ []) do
    Supervisor.start_link(__MODULE__, :ok, opts)
  end

  def start_bucket(supervisor) do
    Supervisor.start_child(supervisor, [])
  end

  def init(:ok) do
    children = [
      worker(KV.Bucket, [], restart: :temporary)
    ]

    supervise(children, strategy: :simple_one_for_one)
  end
end
```

There are two changes in this supervisor compared to the first one.

First, we define a `start_bucket/1` function that will receive a supervisor and start a bucket process as a child of that supervisor. `start_bucket/1` is the function we are going to invoke instead of calling `KV.Bucket.start_link` directly in the registry.

Second, in the `init/1` callback, we are marking the worker as `:temporary`. This means that if the bucket dies, it won't be restarted! That's because we only want to use the supervisor as a mechanism to group the buckets. The creation of buckets should always pass through the registry.

Run `iex -S mix` so we can give our new supervisor a try:

```iex
iex> {:ok, sup} = KV.Bucket.Supervisor.start_link
{:ok, #PID<0.70.0>}
iex> {:ok, bucket} = KV.Bucket.Supervisor.start_bucket(sup)
{:ok, #PID<0.72.0>}
iex> KV.Bucket.put(bucket, "eggs", 3)
:ok
iex> KV.Bucket.get(bucket, "eggs")
3
```

Let's change the registry to work with the buckets supervisor. We are going to follow the same strategy we did with the events manager, where we will explicitly pass the buckets supervisor pid to `KV.Registry.start_link/3`. Let's start by changing the setup callback in `test/kv/registry_test.exs` to do so:

```elixir
setup do
  {:ok, sup} = KV.Bucket.Supervisor.start_link
  {:ok, manager} = GenEvent.start_link
  {:ok, registry} = KV.Registry.start_link(manager, sup)

  GenEvent.add_mon_handler(manager, Forwarder, self())
  {:ok, registry: registry}
end
```

Now let's change the appropriate functions in `KV.Registry` to take the new supervisor into account:

```elixir
## Client API

@doc """
Starts the registry.
"""
def start_link(event_manager, buckets, opts \\ []) do
  # 1. Pass the buckets supervisor as argument
  GenServer.start_link(__MODULE__, {event_manager, buckets}, opts)
end

## Server callbacks

def init({events, buckets}) do
  names = HashDict.new
  refs  = HashDict.new
  # 2. Store the buckets supervisor in the state
  {:ok, %{names: names, refs: refs, events: events, buckets: buckets}}
end

def handle_cast({:create, name}, state) do
  if HashDict.get(state.names, name) do
    {:noreply, state}
  else
    # 3. Use the buckets supervisor instead of starting buckets directly
    {:ok, pid} = KV.Bucket.Supervisor.start_bucket(state.buckets)
    ref = Process.monitor(pid)
    refs = HashDict.put(state.refs, ref, name)
    names = HashDict.put(state.names, name, pid)
    GenEvent.sync_notify(state.events, {:create, name, pid})
    {:noreply, %{state | names: names, refs: refs}}
  end
end
```

Those changes should be enough to make our tests pass! To complete our task, we just need to update our supervisor to also take the buckets supervisor as child.

## 5.4 Supervision trees

In order to use the buckets supervisor in our application, we need to add it as a child of `KV.Supervisor`. Notice we are beginning to have supervisors that supervise other supervisors, forming so-called "supervision trees."

Open up `lib/kv/supervisor.ex`, add an additional module attribute for the buckets supervisor name, and change `init/1` to match the following:

```elixir
@manager_name KV.EventManager
@registry_name KV.Registry
@bucket_sup_name KV.Bucket.Supervisor

def init(:ok) do
  children = [
    worker(GenEvent, [[name: @manager_name]]),
    supervisor(KV.Bucket.Supervisor, [[name: @bucket_sup_name]]),
    worker(KV.Registry, [@manager_name, @bucket_sup_name, [name: @registry_name]])
  ]

  supervise(children, strategy: :one_for_one)
end
```

This time we have added a supervisor as child and given it the name of `KV.Bucket.Supervisor` (again, the same name as the module). We have also updated the `KV.Registry` worker to receive the bucket supervisor name as argument.

Also remember that the order in which children are declared is important. Since the registry depends on the buckets supervisor, the buckets supervisor must be listed before it in the children list.

Since we have added more children to the supervisor, it is important to evaluate if the `:one_for_one` strategy is still correct. One flaw that shows up right away is the relationship between registry and buckets supervisor. If the registry dies, the buckets supervisor must die too, because once the registry dies all information linking the bucket name to the bucket process is lost. If the buckets supervisor is kept alive, it would be impossible to reach those buckets.

We could consider moving to another strategy like `:one_for_all`. The `:one_for_all` strategy kills and restarts all children whenever one of the children die. This change is not ideal either, because a crash in the registry should not crash the event manager. In fact, doing so would be harmful, as crashing the event manager would cause all installed event handlers to be removed.

One possible solution to this problem is to create another supervisor that will supervise the registry and buckets supervisor with `:one_for_all` strategy, and have the root supervisor supervise both the event manager and the new supervisor with `:one_for_one` strategy. The proposed tree would have the following format:

```
* root supervisor [one_for_one]
  * event manager
  * supervisor [one_for_all]
    * buckets supervisor [simple_one_for_one]
      * buckets
    * registry
```

You can take a shot at building this new supervision tree, but we will stop here. This is because in the next chapter we will make changes to the registry that will allow the registry data to be persisted, making the `:one_for_one` strategy a perfect fit.

Remember, there are other strategies and other options that could be given to `worker/2`, `supervisor/2` and `supervise/2` functions, so don't forget to check out [the Supervisor module documentation](/docs/stable/elixir/Supervisor.html).
