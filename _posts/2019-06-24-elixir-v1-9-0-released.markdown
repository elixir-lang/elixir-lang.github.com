---
layout: post
title: Elixir v1.9 released
author: José Valim
category: Releases
excerpt: Elixir v1.9 is out with releases support, improved configuration and more.
---

Elixir v1.9 is out with releases support, improved configuration, and more.

We are also glad to announce [Fernando Tapia Rico](https://github.com/fertapric) has joined the Elixir Core Team. Fernando has been extremely helpful in keeping the issues tracker tidy, by fixing bugs and improving Elixir in many different areas, such as the code formatter, IEx, the compiler, and others.

Now let's take a look at what's new in this new version.

## Releases

The main feature in Elixir v1.9 is the addition of releases. A release is a self-contained directory that consists of your application code, all of its dependencies, plus the whole Erlang Virtual Machine (VM) and runtime. Once a release is assembled, it can be packaged and deployed to a target as long as the target runs on the same operating system (OS) distribution and version as the machine running the [`mix release`](https://hexdocs.pm/mix/Mix.Tasks.Release.html) command.

Releases have always been part of the Elixir community thanks to Paul Schoenfelder's work on [Distillery](https://github.com/bitwalker/distillery) (and EXRM before that). Distillery was announced in July 2016. Then in 2017, [DockYard](https://dockyard.com/) hired Paul to work on improving deployments, an effort that would lead to [Distillery 2.0](https://dockyard.com/blog/2018/08/23/announcing-distillery-2-0). Distillery 2.0 provided important answers in areas where the community was struggling to establish conventions and best practices, such as configuration.

At the beginning of this year, thanks to [Plataformatec](http://plataformatec.com.br/), I was able to prioritize the work on bringing releases directly into Elixir. Paul was aware that we wanted to have releases in Elixir itself and during [ElixirConf 2018](https://elixirconf.com) I announced that releases was the last planned feature for Elixir.

The goal of Elixir releases was to double down on the most important concepts provided by Distillery and provide extensions points for the other bits the community may find important. [Paul](http://github.com/bitwalker/) and [Tristan](https://github.com/tsloughter) (who maintains [Erlang's relx](https://github.com/erlware/relx)) provided excellent feedback on Elixir's implementation, which we are very thankful for. [The Hex package manager is already using releases in production](https://dashbit.co/blog/updating-hex-pm-to-use-elixir-releases) and we also got feedback from other companies doing the same.

Enough background, let's see why you would want to use releases and how to assemble one.

### Why releases?

Releases allow developers to precompile and package all of their code and the runtime into a single unit. The benefits of releases are:

  * Code preloading. The VM has two mechanisms for loading code: interactive and embedded. By default, it runs in the interactive mode which dynamically loads modules when they are used for the first time. The first time your application calls `Enum.map/2`, the VM will find the `Enum` module and load it. There's a downside. When you start a new server in production, it may need to load many other modules, causing the first requests to have an unusual spike in response time. Releases run in embedded mode, which loads all available modules upfront, guaranteeing your system is ready to handle requests after booting.

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

## Configuration

We also use the work on releases to streamline Elixir's configuration API. A new `Config` module has been added to Elixir. The previous configuration API, `Mix.Config`, was part of the Mix build tool. However, since releases provide runtime configuration and Mix is not included in releases, we ported the `Mix.Config` API to Elixir. In other words, `use Mix.Config` has been soft-deprecated in favor of `import Config`.

Another important change related to configuration is that `mix new` will no longer generate a `config/config.exs` file. [Relying on configuration is undesired for most libraries](https://hexdocs.pm/elixir/library-guidelines.html#avoid-application-configuration) and the generated config files pushed library authors in the wrong direction. Furthermore, `mix new --umbrella` will no longer generate a configuration for each child app, instead all configuration should be declared in the umbrella root. That's how it has always behaved, we are now making it explicit.

## Other improvements

There are many other enhancements in Elixir v1.9. The Elixir CLI got a handful of new options in order to best support releases. `Logger` now computes its sync/async/discard thresholds in a decentralized fashion, reducing contention. `EEx` (Embedded Elixir) templates support more complex expressions than before. Finally, there is a new `~U` sigil for working with UTC DateTimes as well as new functions in the `File`, `Registry`, and `System` modules.

## What's next?

As mentioned earlier, releases was the last planned feature for Elixir. We don't have any major user-facing feature in the works nor planned. I know for certain some will consider this fact the most excing part of this announcement!

Of course, it does not mean that v1.9 is the last Elixir version. We will continue shipping new releases every 6 months with enhancements, bug fixes and improvements. You can see the [Issues Tracker](http://github.com/elixir-lang/elixir/issues) for more details.

We also are working on some structural changes. One of them is move the `mix xref` pass straight into the compiler, which would allow us to emit undefined function and deprecation warnings in more places. We are also considering a move to [Cirrus-CI](https://cirrus-ci.org/), so we can test Elixir on Windows, Unix, and FreeBSD through a single service.

It is also important to highlight that there are two main reasons why we can afford to have an empty backlog.

First of all, Elixir is built on top of Erlang/OTP and we simply leverage all of the work done by Ericsson and the OTP team on the runtime and Virtual Machine. The Elixir team has always aimed to contribute back as much as possible and those contributions have increased in the last years.

Second, Elixir was designed to be an extensible language. The same tools and abstractions we used to create and enhance the language are also available to libraries and frameworks. This means the community can continue to improve the ecosystem without a need to change the language itself, which would effectively become a bottleneck for progress.

Check [the Install section](/install.html) to get Elixir installed and read our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) to learn more. We have also updated our [advanced Mix & OTP](https://hexdocs.pm/elixir/introduction-to-mix.html) to talk about releases. If you are looking for a more fast paced introduction to the language, see the [How I Start: Elixir](http://howistart.org/posts/elixir/1/index.html) tutorial, which has also been brought to the latest and greatest.

Have fun!
