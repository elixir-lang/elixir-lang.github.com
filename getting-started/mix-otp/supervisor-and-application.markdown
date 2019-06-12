---
layout: getting-started
title: Supervisor and Application
---

# {{ page.title }}

{% include toc.html %}

{% include mix-otp-preface.html %}

In the previous chapter about `GenServer`, we implemented `KV.Registry` to manage buckets. At some point, we started monitoring buckets so we were able to take action whenever a `KV.Bucket` crashed. Although the change was relatively small, it introduced a question which is frequently asked by Elixir developers: what happens when something fail?

Before we added monitoring, if a bucket crashed, the registry would forever point to a bucket that no longer exists. If a user tried to read or write to the crahed bucket, it would fail. Any attempt at creating a new bucket with the same name would just return the PID of the crashed bucket. In other words, that registry entry for that bucket would forever be in a bad state. Once we added monitoring, the registry automatically removes the entry for the crashed bucket. Trying to lookup the crashed bucket now (correctly) says a bucket does not exist and a user of the system can successfully create a new one if desired.

In practice, we are not expecting the processes working as buckets to fail. But, if it does happen, for whatever reason, we can rest assured that our system will continue to work as intended.

If you have prior programming experience, you may be wondering: "could we just guarantee the bucket does not crash in the first place?". As we will see, Elixir developers tend to refer to those practices as "defensive programming". That's because a live production system has dozens of different reasons why something can wrong. The disk can fail, memory can be corrupted, bugs, the network may stop working for a second, etc. If we were to write a software that attempted to protect or circumvent all of those errors, we would spend more time handling failures than writing our own software!

Therefore, an Elixir developer prefers to "let it crash" or "fail fast". And one of the most common ways we can recover from a failure is by restarting whatever part of the system that crashed.

For example, when your computer, router, printer, or whatever device is not working properly. How do you often fix it? By restarting it. Once we restart the device, we reset the device back to its initial state, which is well-tested aand guaranteed to work. In Elixir, we apply this same approach to software: whenever a process crashes, we start a new process to perform the same job as the crashed process.

In Elixir, this is done by a Supervisor. A Supervisor is a process that supervises other processes and restarts them whenever they crash. To do so, Supervisors manage the whole life-cycle of any supervised processes, including startup and shutdown.

In this chapter, we will learn how to put those concepts into practice by supervising the `KV.Registry` process. After all, if something goes wrong with the registry, the whole registry is lost and no bucket could ever be found! To address this, we will define a `KV.Supervisor` module that guarantees that our `KV.Registry` is up and running at any given moment.

At the end of the chapter, we will also talk about Applications. As we will see, Mix has been packaging all of our code into an application, and we will learn how to customize our application to guarantee our Supervisor and the Registry are up and running whenever our system starts.

## Our first supervisor

A supervisor is a process which supervises other processes, which we refer to as child processes. The act of supervising a process includes three distinct responsibilities. The first one is to start child processes. Once a child process is running, the supervisor may restart a child process, either because it terminated abnormally or because a certain condition has reached. For example, a supervisor may restart all children if any child dies. Finally, a supervisor is also responsible for shutting down the child processes on the system is shutting down. Please see the [Supervisor](https://hexdocs.pm/elixir/Supervisor.html) module for a more in-depth discussion.

Creating a supervisor is not much different from creating a GenServer. We are going to define a module named `KV.Supervisor`, which will use the Supervisor behaviour, inside the `lib/kv/supervisor.ex` file:

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

Once the supervisor starts, it will traverse the list of children and it will invoke the `child_spec/1` function on each module.

The `child_spec/1` function returns the child specification which describes how to start the process, if the process is a worker or a supervisor, if the process is temporary, transient or permanent and so on. The `child_spec/1` function is automatically defined when we `use Agent`, `use GenServer`, `use Supervisor`, etc. Let's give it a try in the terminal with `iex -S mix`:

```iex
iex(1)> KV.Registry.child_spec([])
%{id: KV.Registry, start: {KV.Registry, :start_link, [[]]}}
```

We will learn those details as we move forward on this guide. If you would rather peek ahead, check the [Supervisor](https://hexdocs.pm/elixir/Supervisor.html) docs.

After the supervisor retrieves all child specifications, it proceeds to start its children one by one, in the order they were defined, using the information in the `:start` key in the child specification. For our current specification, it will call `KV.Registry.start_link([])`.

Let's take the supervior for a spin:

```iex
iex(1)> {:ok, sup} = KV.Supervisor.start_link([])
{:ok, #PID<0.148.0>}
iex(2)> Supervisor.which_children(sup)
[{KV.Registry, #PID<0.150.0>, :worker, [KV.Registry]}]
```

So far we have started the supervisor and listed its children. Once the supervisor started, it also started all of its children.

What happens if we intentionally crash the registry started by the supervisor? Let's do so by sending it a bad input on `call`:

```iex
iex(3)> [{_, registry, _, _}] = Supervisor.which_children(sup)
[{KV.Registry, #PID<0.150.0>, :worker, [KV.Registry]}]
iex(4) GenServer.call(registry, :bad_input)
08:52:57.311 [error] GenServer KV.Registry terminating
** (FunctionClauseError) no function clause matching in KV.Registry.handle_call/3
iex(5) Supervisor.which_children(sup)
[{KV.Registry, #PID<0.157.0>, :worker, [KV.Registry]}]
```

Notice how the supervisor automatically started a new registry, with a new PID, in place of the first one once we caused it to crash due to a bad input.

In the previous chapters, we have always started processes directly. For example, we would call `KV.Registry.start_link([])`, which would return `{:ok, pid}`, and that would allow us to interact with the registry via its `pid`. Now that processes are started by the supervisor, we had to directly ask the supervisor who are its children and fetch the pid from the returned list of children. In practice, doing so every time would be very expensive. To address this, we often given name to processes, allowing them to be uniquely identified in a single machine from anywhere in our code.

Let's learn how to do that.

## Naming processes

While our application will have many buckets, it will only have a single registry. Therefore, whenever we start the registry, we want to give it a unique name so we can reach out to it from anywhere. We do so by passing a `:name` option to `KV.Registry.start_link/1`.

Let's slightly change our children definition (in `KV.Supervisor.init/1`) to be a list of tuples instead of a list of atoms:

```elixir
  def init(:ok) do
    children = [
      {KV.Registry, name: KV.Registry}
    ]
```

With this in place, the supervisor will now start `KV.Registry` by calling `KV.Registry.start_link(name: KV.Registry)`.

If you revisit the `KV.Registry.start_link/1` implementation, you will remember it simply passes the options to GenServer:

```elixir
  def start_link(opts) do
    GenServer.start_link(__MODULE__, :ok, opts)
  end
```

which in turn will register the process with the given name. The `:name` option expects an atom for locally named processes (locally named means it is available to this machine - there are other options, which we won't discuss here). Since module identifiers are atoms (try `i(KV.Registry)` in IEx), we can name a process after the module that implements it, provided there is only one process for that name. This helps when debugging and introspecting the system.

Let's give the updated supervisor a try inside `iex -S mix`:

```iex
iex> KV.Supervisor.start_link([])
{:ok, #PID<0.66.0>}
iex> KV.Registry.create(KV.Registry, "shopping")
:ok
iex> KV.Registry.lookup(KV.Registry, "shopping")
{:ok, #PID<0.70.0>}
```

This time the supervisor started a named registry, allowing us to create buckets without having to explicitly fetch the PID from the supervisor. You should also know how to make the registry crash again, without looking up its PID: give it a try.

> At this point, you may be wondering: should you also locally name bucket processes? Remember buckets are started dynamically based on user input. Since local names MUST be atoms, we would have to dynamically create atoms, which is a bad idea since once an atom is defined, it is never erased nor garbage collected. This means that, if we create atoms dynamically based on user input, we will eventually run out of memory (or to be more precise, the VM will crash because it imposes a hard limit on the number of atoms). This limitation is precisely why we created our own registry (or why one would use the `Registry` as part of Elixir).

We are getting closer and closer to a fully working system. The supervisor automatically starts the registry. But how we can automatically start the supervisor whenever our system starts? To answer this question, let's talk about applications.

## Understanding applications

We have been working inside an application this entire time. Every time we changed a file and ran `mix compile`, we could see a `Generated kv app` message in the compilation output.

We can find the generated `.app` file at `_build/dev/lib/kv/ebin/kv.app`. Let's have a look at its contents:

```erlang
{application,kv,
             [{applications,[kernel,stdlib,elixir,logger]},
              {description,"kv"},
              {modules,['Elixir.KV','Elixir.KV.Bucket','Elixir.KV.Registry',
                        'Elixir.KV.Supervisor']},
              {registered,[]},
              {vsn,"0.1.0"},
              {extra_applications,[logger]}]}.
```

This file contains Erlang terms (written using Erlang syntax). Even though we are not familiar with Erlang, it is easy to guess this file holds our application definition. It contains our application `version`, all the modules defined by it, as well as a list of applications we depend on, like Erlang's `kernel`, `elixir` itself, and `logger` which is specified in the `:extra_applications` list in `mix.exs`.

It would be pretty boring to update this file manually every time we add a new module to our application. That's why Mix generates and maintains it for us.

We can also configure the generated `.app` file by customizing the values returned by the `application/0` inside our `mix.exs` project file. We are going to do our first customization soon.

### Starting applications

Each application in our system can be started and stopped. The rules for starting and stopping an application are defined precisely in the `.app` file. We haven't done this so far for two reasons:

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

## The application callback

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

> Please note that by doing this, we are breaking the boilerplate test case which tested the `hello` function in `KV`. You can simply remove that test case.

When we `use Application`, we need to define a couple functions, similar to when we used `Supervisor` or `GenServer`. This time we only need to define a `start/2` function. The `start/2` function starts the supervisor, also giving it a name. We don't plan to use said name, but we name the process anyway to help when debugging or introspecting the system. There is also a `stop/1` callback which we could implement to provide custom behavour when the application shuts down, but we don't have a use for it right now (and we rarely do in practice).

Let's start our project console once again with `iex -S mix` and check that `KV.Registry` is already up and running:

```iex
iex(1)> KV.Registry.create(KV.Registry, "shopping")
:ok
iex(2)> KV.Registry.lookup(KV.Registry, "shopping")
{:ok, #PID<0.88.0>}
```

Here is what is happening. Whenever we start our application by invoking Mix, it invokes the application callback. The application callback job is to start a **supervision tree**. Right now, we only have a single supervisor, but sometimes a supervisor is also supervised, giving it a shape of a tree. So far, our supervisor has a single child, a `KV.Registry`, which is started with name `KV.Registry`.

## Projects or applications?

Mix makes a distinction between projects and applications. Based on the contents of our `mix.exs` file, we would say we have a Mix project that defines the `:kv` application. As we will see in later chapters, there are projects that don't define any application.

When we say "project" you should think about Mix. Mix is the tool that manages your project. It knows how to compile your project, test your project and more. It also knows how to compile and start the application relevant to your project.

When we talk about applications, we talk about <abbr title="Open Telecom Platform">OTP</abbr>. Applications are the entities that are started and stopped as a whole by the runtime. You can learn more about applications and how they relate to booting and shutting down of your system as a whole in the [docs for the Application module](https://hexdocs.pm/elixir/Application.html).

## Next steps

Although this chapter was the first time we implemented a supervisor, it was not the first time we used one! In the previous chapter, when we used `start_supervised!` to start the registry during our tests, `ExUnit` started the registry under a supervisor managed by the ExUnit framework itself. By defining our own supervisor, we provide more structure on how we initialize, shutdown and supervise processes in our applications, aligning our production code and tests best practices.

But we are not done yet. So far we are supervising the registry but our application is also starting buckets. Since buckets are started dynamically, they have to be supervised by a special type of supervisor, called `DynamicSupervisor`, which we will explore next.
