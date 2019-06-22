---
layout: post
title: Elixir v1.9 released
author: José Valim
category: Releases
excerpt: Elixir v1.9 comes built-in releases support and we look at important actions within the community.
---

Hi everyone,

Elixir v1.9 is out and I would like to discuss the general context of this release and important actions that are happening within the community. For this reason, this announcement will be a bit more personal than our previous releases announcements. I hope you will enjoy it and, if not, we should go back to our regular schedule in the next Elixir release: v1.10.

Let's do this.

## Goals for 2019

At some point last year, I have set my personal goals for 2019 was to streamline the production experience of Elixir applications, especially in terms of deployment and metrics. Don't get me wrong, companies have been running Elixir in production for years and most of the features we will see in this announcement were possible all along, thanks to the effort of many community members and companies. My personal goal was to make **the whole process as frictionless as possible**.

## Deploying with releases

The main feature in Elixir v1.9 is the addition of releases. A release is a self-contained directory that consists of your application code, all of its dependencies, plus the whole Erlang Virtual Machine (VM) and runtime. Once a release is assembled, it can be packaged and deployed to a target as long as the target runs on the same operating system (OS) distribution and version as the machine running the [`mix release`](https://hexdocs.pm/mix/Mix.Tasks.Release.html) command.

Releases have always been part of the Elixir community thanks to Paul Schoenfelder's work on [Distillery](https://github.com/bitwalker/distillery). Distillery was announced in July 2016. Then in 2017, [DockYard](https://dockyard.com/) hired Paul to work on improving deployments, an effort that would lead to [Distillery 2.0](https://dockyard.com/blog/2018/08/23/announcing-distillery-2-0). Distillery 2.0 provided important answers in areas the community was struggling to establish conventions and best practices, such as configuration.

At the beginning of this year, thanks to [Plataformatec](http://plataformatec.com.br/), I was able to prioritize the work on bringing releases directly into Elixir. Paul was aware that we wanted to have releases in Elixir itself and during [ElixirConf 2018](https://elixirconf.com) I announced that releases was the last planned feature for Elixir.

The goal of Elixir releases was to double down on the most important concepts provided by Distillery and provide extensions points for the other bits the community may find important. [Paul](http://github.com/bitwalker/) and [Tristan](https://github.com/tsloughter) (who maintains Erlang's relx) provided important feedback on Elixir's implementation. [The Hex package manager is already using releases in production](http://blog.plataformatec.com.br/2019/05/updating-hex-pm-to-use-elixir-releases/) and we also got feedback from other companies already doing the same.

Enough background, let's see why you would want to use releases and how to assemble one.

### Why releases?

Releases allow developers to precompile and package all of their code and the runtime into a single unit. The benefits of releases are:

  * Code preloading. The VM has two mechanisms for loading code: interactive and embedded. By default, it runs in the interactive mode which dynamically loads modules when they are used for the first time. The first time your application calls `Enum.map/2`, the VM will find the `Enum` module and load it. There’s a downside. When you start a new server in production, it may need to load many other modules, causing the first requests to have an unusual spike in response time. Releases run in embedded mode, which loads all available modules upfront, guaranteeing your system is ready to handle requests after booting.

  * Configuration and customization. Releases give developers fine grained control over system configuration and the VM flags used to start the system.

  * Self-contained. A release does not require the source code to be included in your production artifacts. All of the code is precompiled and packaged. Releases do not even require Erlang or Elixir in your servers, as they include the Erlang VM and its runtime by default. Furthermore, both Erlang and Elixir standard libraries are stripped to bring only the parts you are actually using.

  * Multiple releases. You can assemble different releases with different configuration per application or even with different applications altogether.

  * Management scripts. Releases come with scripts to start, restart, connect to the running system remotely, execute RPC calls, run as daemon, run as a Windows service, and more.

### 1, 2, 3: released assembled!

You can start a new project and assemble a release for it in three easy steps:

    $ mix new my_app
    $ cd my_app
    $ MIX_ENV=prod mix release

A release will be assembled in `_build/prod/rel/my_app`. Inside the release, there will be a `bin/my_app` file which is the entry point to your system. It supports multiple commands, such as:

  * `bin/my_app start`, `bin/my_app start_iex`, `bin/my_app restart`, and `bin/my_app stop` - for general management of the release

  * `bin/my_app rpc COMMAND` and `bin/my_app remote` - for running commands on the running system or to connect to the running system

  * `bin/my_app eval COMMAND` - to start a fresh system that runs a single command and then shuts down

  * `bin/my_app daemon` and `bin/my_app daemon_iex` - to start the system as a daemon on Unix-like systems

  * `bin/my_app install` - to install the system as a service on Windows machines

### Hooks and Configuration

Releases also provide built-in hooks for configuring almost every need of the production system:

  * `config/config.exs` (and `config/prod.exs`) - provides build-time application configuration, which is executed when the release is assembled

  * `config/releases.exs` - provides runtime application configuration. It is executed every time the release boots and is further extensible via config providers

  * `rel/vm.args.eex` - a template file that is copied into every release and provides static configuration of the Erlang Virtual Machine and other runtime flags

  * `rel/env.sh.eex` and `rel/env.bat.eex` - template files that are copied into every release and executed on every command to set up environment variables, including ones specific to the VM, and the general environment

We have written [extensive documentation on releases](https://hexdocs.pm/mix/Mix.Tasks.Release.html), so we recommend checking it out for more information.

We also use the work on releases to streamline Elixir's configuration API. A new `Config` module has been added to Elixir. The previous configuration API, `Mix.Config`, was part of the Mix build tool. But since releases provide runtime configuration and Mix is not included in releases, we ported the `Mix.Config` API to Elixir. In other words, `use Mix.Config` has been soft-deprecated in favor of `import Config`.

Another important change related to configuration is that `mix new` will no longer generate a `config/config.exs` file. [Relying on configuration is undesired for most libraries](https://hexdocs.pm/elixir/library-guidelines.html#avoid-application-configuration) and the generated config files pushed library authors in the wrong direction. Furthermore, `mix new --umbrella` will no longer generate a configuration for each child app, instead all configuration should be declared in the umbrella root. That's how it has always behaved, we are now making it explicit.

Now it is time to move to the next topic: monitoring and metrics!

## Monitoring and metrics with Telemetry

One of the things I always appreciated about the Erlang VM is the amount of information we can retrieve from running systems. Besides all of the metrics provided by the VM, we also model our software using introspectable processes, which are lightweight thread of executions within the VM. Each process has a mailbox, a heap and a reduction count, which are respectively the messages it has to process, its memory, and the number of operations it has executed. This means we can retrieve detailed information about each component of our application and all of this comes for free as we design our software.

A great example of using this for introspecting and debugging a live system is Phoenix' journey to achieve 2 million connections on a single node. You can [read the story here](https://phoenixframework.readme.io/v1.2.0/blog/the-road-to-2-million-websocket-connections). You can also read about the Observer in our official guides, [here](https://elixir-lang.org/getting-started/debugging.html#observer) and [here](https://elixir-lang.org/getting-started/mix-otp/dynamic-supervisor.html#observer), which is one of many tools to visualize all of the available information in our systems. Of course, all of this information can also be used plugged into dashboards, metrics, and what not for monitoring.

However, even with this abundance of data, we would hear from companies they were having a hard time to see what was happening in their systems. After the initial puzzling, it became clear that the struggle was in actually getting all of this information and pushing it to an external system of choice.

Based on this feedback, Chris and I announced a plan at [ElixirConf 2018](https://elixirconf.com) to provide actionable metrics out of the box. Shortly after, [Erlang Solutions](https://www.erlang-solutions.com/) reached out to us interested in putting this plan in action. After some initial prototypes and a good name in hands, [the Telemetry package was born](https://github.com/beam-telemetry/telemetry).

### Telemetry's Core

The idea behind the core Telemetry package is very simple: it is a small and performant dynamic event dispatching library. The goal is that library authors will add it as a dependency and emit events with measurements and metadata. Now any other library or application can subscribe to the relevant events and do something with them.

After Telemetry was released, we focused on auxialiary libraries, such as [`telemetry_poller`](http://github.com/beam-telemetry/telemetry_poller/) to extract important data from the VM and running processes, and [`telemetry_metrics`](https://hexdocs.pm/telemetry_metrics), which describes how to consume and report those events. You can also learn more about those packages and their roles in [this presentation from Arkadiusz](https://www.youtube.com/watch?v=cOuyOmcDV1U), who is [the author of these tools](https://github.com/arkgil).

Of course, none of this would matter if projects and libraries did not start publishing events with `telemetry`. And that also would not matter if we do not have tools that consume those events and publish them elsewhere. Luckily, an important actor appeared in the community to help us with this task: the [Erlang Ecosystem Foundation](https://erlef.org/).

### The Observability Working Group

Within the Erlang Ecosystem Foundation, there are many working groups, and one of the working groups existing today is the [Observability Working Group](https://erlef.org/observability-wg/). The mission of the workinig group is to evolve the tools in the ecosystem related to observability, such as metrics, distributed tracing and logging, with a strong focus on interoperability between languages.

The working group was quick to put the `telemetry` packages under its wing, porting both `telemetry` and `telemetry_poller` to Erlang, to ensure the whole ecosystem can use it. The working group started to work with library authors and tools maintainers so they emit and consume telemetry events. Ecto and Phoenix are two important projects that are now "telemetry ready". You can also find integrations for tools such as Prometheus, OpenCensus, StatsD, and others.

If you wish to become a member of the Erlang Ecosystem Foundation to help sponsor projects and iniciatives like this one, you can learn more about it in the [foundation website](https://erlef.org/).

### Going full circle

While a lot of progress has happened within the last year, our initial vision is not fully realized yet. After all, our goal was to provide actionable metrics out of the box on every new Phoenix application. There are only two actions remaining and they are all pending within the context of Phoenix.

The first one is to provide Telemetry built-in integration. You can imagine that, by Phoenix v1.5, every new Phoenix application will include a new file with contents similar to this:

```elixir
defmodule MyAppWeb.Telemetry do
  use Supervisor
  import Telemetry.Metrics

  def start_link(arg) do
    Supervisor.start_link(__MODULE__, arg, name: __MODULE__)
  end

  def init(_arg) do
    children = [
      {:telemetry_poller, 
       measurements: periodic_measurements(), 
       period: 10_000},
      {Telemetry.StatsD, metrics: metrics()} # <label id="code.telemetry_statsd"/>
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end

  defp metrics do 
    [
      # VM Metrics
      last_value("vm.memory.total", unit: :byte),
      last_value("vm.total_run_queue_lengths.total"),
      last_value("vm.total_run_queue_lengths.cpu"),
      last_value("vm.total_run_queue_lengths.io"),

      last_value("my_app.worker.memory", unit: :byte),
      last_value("my_app.worker.message_queue_len"),

      # Database Time Metrics
      summary("my_app.repo.query.total_time", unit: {:native, :millisecond}),
      summary("my_app.repo.query.decode_time", unit: {:native, :millisecond}),
      summary("my_app.repo.query.query_time", unit: {:native, :millisecond}),
      summary("my_app.repo.query.queue_time", unit: {:native, :millisecond}),

      # Phoenix Time Metrics
      summary("phoenix.endpoint.stop.duration", 
              unit: {:native, :millisecond}),
      summary(
        "phoenix.route_dispatch.stop.duration",
        unit: {:native, :millisecond},
        tags: [:plug]
      )
    ]
  end

  defp periodic_measurements do 
    [
      {:process_info,
       event: [:my_app, :worker],  
       name: MyApp.Worker,
       keys: [:message_queue_len, :memory]}
    ]
  end
end
```

In a nutshell, the file above starts a tree of processes to collect measurements and publish metrics to an external source of choice. You can tweak, add new metrics and measurements, 
at any time by changing it.

With this file in place, we only need to provide a built-in reporter from Phoenix, that consumes those metrics and publish them to a dashboard. This may atually be a great fit for [Phoenix LiveView](https://github.com/phoenixframework/phoenix_live_view) for those willing to give it a try!

## What's next?

As mentioned earlier, releases was the last planned feature for Elixir. We don't have any major user-facing feature in the works nor planned. I know for certain some will consider this fact the most excing part of this announcement!

Of course, it does not mean that v1.9 is the last Elixir version. We will continue releasing shipping new releases every 6 months with enhancements, bug fixes and improvements. You can see the [Issues Tracker](http://github.com/elixir-lang/elixir/issues) for more details.

We also are working on some structural changes. One of them is move the `mix xref` pass straight into the compiler, which would allow us to emit undefined function and deprecation warnings in more places. We are also planning to move into [Cirrus-CI](https://cirrus-ci.org/), so we can test Elixir on Windows, Unix, and FreeBSD in a single service. 

It is also important to highlight that there are two main reasons why we can afford to have an empty backlog.

First of all, Elixir is built on top of Erlang/OTP and we simply leverage all of the work done by Ericsson and the OTP team on the runtime and Virtual Machine. The Elixir team has always aimed to contribute back as much as possible and those contributions have increased in the last years.

Second, Elixir was designed to be an extensible language. The same tools and abstractions we used to create and enhance the language are also available to libraries and frameworks. This means the community can continue to improve the ecosystem without a need to change the language itself, which would effectively become a bottleneck for progress.

And this announcement is a great example on how individuals and companies are evolving the ecosystem. While releases were made part of Elixir, it was thanks to the work of many. The Telemetry tooling was done completely outside of the Elixir language and is now being led by [the Erlang Ecosystem Foundation](https://erlef.org/). I personally believe the foundation will help improve many other areas beyond observability, such as packaging, documentation, security, and others.

Check [the Install section](/install.html) to get Elixir installed and read our [Getting Started guide](http://elixir-lang.org/getting-started/introduction.html) to learn more. We have also updated our [advanced Mix & OTP](https://elixir-lang.org/getting-started/mix-otp/introduction-to-mix.html) to talk about releases. If you are looking for a more fast paced introduction to the language, see the [How I Start: Elixir](http://howistart.org/posts/elixir/1/index.html) tutorial, which has also been brought to the latest and greatest.

Have fun!
