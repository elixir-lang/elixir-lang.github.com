---
layout: post
title: Elixir v0.15.0 released
author: José Valim
category: Releases
excerpt: "Elixir v0.15.0 introduces Elixir's Logger, Mix aliases and is the last stop before Elixir v1.0. We are also glad to welcome Alexei into our team!"
---

Hello everyone!

We are glad to announce v0.15.0 has been released. We have spent the last 2 months tidying up the existing APIs, ensuring consistency, improving performance and more. As a result, v0.15.0 is the last minor branch before Elixir v1.0!

There are also no more planned deprecations nor backward incompatible changes which means it is extremely likely that code that runs on v0.15.0 will run exactly the same on Elixir v1.0.

If you are interested in the specific details for this release, [please check our CHANGELOG](https://github.com/elixir-lang/elixir/blob/v0.15.0/CHANGELOG.md). In this post, we will focus on three new features in this release: Logger, Mix aliases, the fresh Elixir Web Installer for Windows, and share some exciting news at the end!

## Logger

Elixir now ships with a new application called logger. This application provides [the Logger module](https://hexdocs.pm/logger/Logger.html), which is the main API developers will use for logging:

```elixir
require Logger
Logger.debug "hello"
```

By default, the code above will log the following message to your console:

```
10:27:39.083 [debug] hello
```

Logger provides multiple backends to where messages are logged. For now Elixir ships only with a console backend but there are developers already working on file (with support to external log rotation) and [syslog](https://en.wikipedia.org/wiki/Syslog) backends.

When we started Logger, the main objective was to translate Erlang messages into Elixir, so terms are formatted in Elixir syntax. Before this release, the following code

```elixir
Task.async fn -> raise "oops" end
```

logged the following report:

```
=ERROR REPORT==== 7-Aug-2014::10:35:59 ===
** Task <0.59.0> terminating
** Started from <0.53.0>
** When function  == #Fun<erl_eval.20.90072148>
**      arguments == []
** Reason for termination ==
** {#{'__exception__' => true,'__struct__' => 'Elixir.RuntimeError',message => <<"oops">>},
    [{'Elixir.Task.Supervised',do_apply,2,
                               [{file,"lib/task/supervised.ex"},{line,70}]},
     {'Elixir.Task.Supervised',async,3,
                               [{file,"lib/task/supervised.ex"},{line,15}]},
     {proc_lib,init_p_do_apply,3,[{file,"proc_lib.erl"},{line,239}]}]}
```

Now, with Logger, we get this report:

```
10:37:22.457 [error] Task #PID<0.72.0> started from #PID<0.60.0> terminating
Function: #Function<20.90072148/0 in :erl_eval.expr/5>
    Args: []
** (exit) an exception was raised:
    ** (RuntimeError) oops
        (elixir) lib/task/supervised.ex:70: Task.Supervised.do_apply/2
        (elixir) lib/task/supervised.ex:15: Task.Supervised.async/3
        (stdlib) proc_lib.erl:239: :proc_lib.init_p_do_apply/3
```

As soon as we started working on Logger, we realized we could go further than simply translating Erlang messages and provide a fully featured logger library. At this moment, Logger also supports:

  * 4 log levels: debug, info, warn and error
  * Custom formatting: you can specify a format string that tells exactly how messages should be logged. The default string is: "$time $metadata[$level] $message\n" but [many attributes are supported](https://hexdocs.pm/logger/Logger.Formatter.html)
  * Custom translators: so you can translate log messages coming from any Erlang application into Elixir syntax
  * Metadata: metadata allows developers to store information in the current process that will be available to all logged messages. For example, a web application can generate a `request_id`, store it as metadata, and all messages logged during that request will be properly identified with `request_id=...` in the log

We have also relied a lot on the [research and work done by Andrew Thompson and the folks at Basho behind Lager](https://www.youtube.com/watch?v=8BNpOHFvg_Q) to ensure our logger is performant and robust. On this front, Logger

  * alternates between sync and async modes when logging messages to keep it performant when required but also apply back-pressure when under stress
  * formats and truncates messages on the client to avoid clogging the backends
  * provide a highwater mark around Erlang's error_logger to avoid it from overflowing

We are looking forward to everyone's feedback on using Logger more and more in production.

## Mix aliases

Mix is Elixir's build tool. Mix knows how to manage your dependencies, compile & test your projects and much more. We have designed Mix, since day one, to be extensible. Developers were always able to define new tasks by simply defining a module:

```elixir
defmodule Mix.Tasks.Hello do
  use Mix.Task

  def run(_) do
    IO.puts "Hello world"
  end
end
```

The task above can now be invoked as `mix hello`.

Defining custom Mix tasks is useful for projects and libraries that want to better integrate with the standard development workflow for Elixir. However, it is a bit verbose for creating one-off tasks or tasks to be used only locally in a given project.

Furthermore, so far Mix did not allow developers to extend existing tasks. For example, imagine you want to perform some extra work when `mix clean` is invoked. Up to this release, it was not possible.

Mix aliases solve both problems by providing a simple API for defining and overriding aliases. All projects that use Mix contain a `mix.exs` file with the project configuration. In order to define an alias, you just need to add a new key to your project configuration:

```elixir
defmodule MyProject do
  use Mix.Project

  def project do
    [app: :my_project,
     aliases: aliases]
  end

  defp aliases do
    [c: "compile",
     hello: &print_hello/1,
     clean: ["clean", &clean_vendor/1]]
  end

  defp print_hello(_),  do: IO.puts "Hello world"
  defp clean_vendor(_), do: File.rm_rf!("vendor")
end
```

In the project above, we have defined three aliases:

  1. `mix c` - is now a shortcut to `mix compile`
  2. `mix hello` - is equivalent to the `Mix.Tasks.Hello` we have defined earlier, although now it is more easily defined as an alias
  3. `mix clean` - extends the existing `clean` task to ensure we invoke `clean_vendor/1` afterwards

In other words, aliases can be three different structures:

  1. A string containing the task and arguments to be invoked
  2. An anonymous function (that is invoked passing the task arguments)
  3. A list containing strings or anonymous functions

You can find more information about aliases by reading the [Mix documentation](https://hexdocs.pm/mix/) (there is a section about Aliases around the middle).

We also would like to thank [Anthony Grimes](https://github.com/raynes) for the support and [Phil Halgelberg](https://github.com/technomancy) for [the work on Lein](https://github.com/technomancy/leiningen) which Mix borrows a lot from.

## Elixir Web Installer for Windows

At the beginning of this summer, [Chris Hyndman](https://github.com/chyndman) joined us as a Google Summer of Code student to help us improve the Elixir story on Windows. Chris has been essential in:

  * Guaranteeing our test suite is green on Windows, fixing many bugs in the process;
  * [Documenting how to compile Elixir from source on Windows](https://github.com/elixir-lang/elixir/wiki/Windows)
  * Ensuring important projects like our [C markdown processor](https://github.com/devinus/markdown/pull/7) compiles on Windows

Chris has also built an [Elixir Web Installer for Windows](https://github.com/elixir-lang/elixir-windows-setup). The web installer checks all available Elixir versions and allows you to pick which one to install. It will also fetch and install Erlang in your machine in case it has not been installed yet.

If you want to give Elixir and the Web Installer a try, you can [download the current version here](https://repo.hex.pm/elixir-websetup.exe). And, if [Chocolatey](https://chocolatey.org/) is your thing, remember you can also install Elixir on Windows by running `cinst elixir`.

## Welcome Alexei!

With v0.15.0, we also would like to welcome [Alexei](https://github.com/alco) to the team of Elixir Maintainers! Alexei was one of the first to actively participate in the Elixir community and he has done an excellent job in guaranteeing quality throughout it, be it in the code, documentation, wiki or website.

Alexei is also interested in how we can extend our tooling to the Erlang ecosystem as a whole, bringing Mix and Hex (our package manager) to more developers as well as adding tasks that are specific to Erlang projects.

## What's next?

We are very close to launch Elixir v1.0! All planned features are already in Elixir's codebase and at the moment there are only [four open issues in our tracker tagged with the v1.0 milestone](https://github.com/elixir-lang/elixir/issues?q=is%3Aopen+is%3Aissue+milestone%3Av1.0).

Our estimated date for the first release candidate for Elixir v1.0 is August 30th. This means there is no better time to learn Elixir than now! If you haven't started yet, you can get started with Elixir by reading [our Getting Started guide](https://hexdocs.pm/elixir/introduction.html) or by checking one of the many "Learning Resources" on the sidebar.
