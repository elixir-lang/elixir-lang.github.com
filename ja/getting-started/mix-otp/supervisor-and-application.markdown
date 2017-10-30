---
layout: getting-started
title: Supervisor and Application
---

# {{ page.title }}

{% include toc.html %}

{% include mix-otp-preface.html %}

So far our application has a registry that may monitor dozens, if not hundreds, of buckets. While we think our implementation so far is quite good, no software is bug-free, and failures are definitely going to happen.

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

So far `start_link/1` has always received an empty list of options. It is time we change that.

## Naming processes

While our application will have many buckets, it will only have a single registry. So instead of always passing the registry PID around, we can give the registry a name, and always reference it by its name.

Also, remember buckets were started dynamically based on user input, and that meant we should not use atom names for managing our buckets. But the registry is in the opposite situation, we want to start a single registry, preferably under a supervisor, when our application boots.

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

In practice, we rarely start the application supervisor manually. Instead, it is started as part of the application callback.

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

When we `use Application`, we need to define a couple functions, similar to when we used `Supervisor` or `GenServer`. This time we only need to define a `start/2` function. If we wanted to specify custom behaviour on application stop, we could define a `stop/1` function.

Let's start our project console once again with `iex -S mix`. We will see a process named `KV.Registry` is already running:

```iex
iex> KV.Registry.create(KV.Registry, "shopping")
:ok
iex> KV.Registry.lookup(KV.Registry, "shopping")
{:ok, #PID<0.88.0>}
```

How do we know this is working? After all, we are creating the bucket and then looking it up; of course it should work, right? Well, remember that `KV.Registry.create/2` uses `GenServer.cast/2`, and therefore will return `:ok` regardless of whether the message finds its target or not. At that point, we don't know whether the supervisor and the server are up, and if the bucket was created. However, `KV.Registry.lookup/2` uses `GenServer.call/3`, and will block and wait for a response from the server. We do get a positive response, so we know all is up and running.

For an experiment, try reimplementing `KV.Registry.create/2` to use `GenServer.call/3` instead, and momentarily disable the application callback. Run the code above on the console again, and you will see the creation step fails straight away.

Don't forget to bring the code back to normal before resuming this tutorial!

## Projects or applications?

Mix makes a distinction between projects and applications. Based on the contents of our `mix.exs` file, we would say we have a Mix project that defines the `:kv` application. As we will see in later chapters, there are projects that don't define any application.

When we say "project" you should think about Mix. Mix is the tool that manages your project. It knows how to compile your project, test your project and more. It also knows how to compile and start the application relevant to your project.

When we talk about applications, we talk about <abbr title="Open Telecom Platform">OTP</abbr>. Applications are the entities that are started and stopped as a whole by the runtime. You can learn more about applications and how they relate to booting and shutting down of your system as a whole in the [docs for the Application module](https://hexdocs.pm/elixir/Application.html).

Next let's learn about one special type of supervisor that is designed to start and shut down children dynamically, called simple one for one.
