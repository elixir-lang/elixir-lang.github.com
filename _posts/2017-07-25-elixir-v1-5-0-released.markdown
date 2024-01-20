---
layout: post
title: Elixir v1.5 released
author: José Valim
category: Releases
excerpt: Elixir v1.5 integrates with Erlang/OTP 20 and bring changes that improves the language reach and the developer experience
---

Elixir v1.5 includes new features, enhancements, and bug fixes. While [Elixir v1.4](/blog/2017/01/05/elixir-v1-4-0-released/) focused on tools for concurrency and scalability, Elixir v1.5 brings many improvements to the developer experience and quality of life. As we will see, many of those are powered by the latest Erlang/OTP 20. This is also the last Elixir release that supports Erlang/OTP 18.

Note: this announcement contains [asciinema](https://asciinema.org) snippets. You may need to enable 3rd-party JavaScript on this site in order to see them. If JavaScript is disabled, noscript tags with the proper links will be shown.

## UTF-8 atoms, function names and variables

Elixir v1.5 supports non-quoted atoms and variables to be in UTF-8 when using Erlang/OTP 20. For example:

```elixir
test "こんにちは世界" do
  assert :こんにちは世界
end
```

Or:

```elixir
saudação = "Bom dia!"
```

Elixir follows the recommendations in [Unicode Annex #31](http://unicode.org/reports/tr31/) to make Elixir more accessible to other languages and communities. Identifiers must still be a sequence of letters, followed by digits and combining marks. This means symbols, such as mathematical notations and emoji, are not allowed in identifiers.

For a complete reference on Elixir syntax, see the [Syntax Reference](https://hexdocs.pm/elixir/1.5/syntax-reference.html). For technical details on Unicode support, see [Unicode Syntax](https://hexdocs.pm/elixir/1.5/unicode-syntax.html).

## IEx helpers and breakpoints

IEx got many enhancements to the developer experience.

First of all, the autocompletion system is now capable of autocompleting variables and user imports:

<script type="text/javascript" src="https://asciinema.org/a/iAOk0yaZtQDsuJqn2sXa1FRQW.js" id="asciicast-iAOk0yaZtQDsuJqn2sXa1FRQW" async></script><noscript><p><a href="https://asciinema.org/a/iAOk0yaZtQDsuJqn2sXa1FRQW">See the example in asciinema</a></p></noscript>

IEx also got new functions, such as `exports/1`, for listing all functions and macros in a module, and the new `runtime_info/0`:

<script type="text/javascript" src="https://asciinema.org/a/NT3xvSaB8f1vv7yaTvzaoJxBD.js" id="asciicast-NT3xvSaB8f1vv7yaTvzaoJxBD" async></script><noscript><p><a href="https://asciinema.org/a/NT3xvSaB8f1vv7yaTvzaoJxBD">See the example in asciinema</a></p></noscript>

Finally, IEx also features a breakpoint system for code debugging when running on Erlang/OTP 20. The following functions have been added to aid debugging:

  * `break!/2` - sets up a breakpoint for a given `Mod.fun/arity`
  * `break!/4` - sets up a breakpoint for the given module, function, arity
  * `breaks/0` - prints all breakpoints and their ids
  * `continue/0` - continues until the next breakpoint in the same process
  * `open/0` - opens editor on the current breakpoint
  * `remove_breaks/0` - removes all breakpoints in all modules
  * `remove_breaks/1` - removes all breakpoints in a given module
  * `reset_break/1` - sets the number of stops on the given id to zero
  * `reset_break/3` - sets the number of stops on the given module, function, arity to zero
  * `respawn/0` - starts a new shell (breakpoints will ask for permission once more)
  * `whereami/1` - shows the current location

Let's see an example:

<script type="text/javascript" src="https://asciinema.org/a/0h3po0AmTcBAorc5GBNU97nrs.js" id="asciicast-0h3po0AmTcBAorc5GBNU97nrs" async></script><noscript><p><a href="https://asciinema.org/a/0h3po0AmTcBAorc5GBNU97nrs">See the example in asciinema</a></p></noscript>

In the snippet above we set a breakpoint in the `URI.decode_query/2` function, which is then triggered when invoked the function. We used `whereami/1` to get more information about the surrounded code and we were also able to access the variables at place of debugging. From there, we can either set more breakpoints, remove existing breakpoints and continue execution. The session ended by calling `open`, which will open your editor at the file and line under debugging. `open/1` can also be invoked by passing any module or function, and IEx will open your editor at that place.

The debugging functions improve the experience both within IEx and during testing. For example, if you are debugging a Phoenix application, you can start `IEx` while running your test suite with `iex -S mix test --trace` and then call `IEx.break!(MyAppWeb.UserController.index/2)` to debug the `index` action of the `UserController`. Note we gave the `--trace` flag to `mix test`, which ensures only one test runs at a time and removes any timeouts from the suite.

## Exception.blame

`Exception.blame/3` is a new function in Elixir that is capable of attaching debug information to certain exceptions. Currently this is used to augment `FunctionClauseError`s with a summary of all clauses and which parts of clause match and which ones didn't. Let's try it out:

<script type="text/javascript" src="https://asciinema.org/a/EgQUdDe1CIz90EYYeipiS8jo8.js" id="asciicast-EgQUdDe1CIz90EYYeipiS8jo8" async></script><noscript><p><a href="https://asciinema.org/a/EgQUdDe1CIz90EYYeipiS8jo8">See the example in asciinema</a></p></noscript>

In the example above, an argument that did not match or guard that did not evaluate to true are shown between in red. If the terminal does not support ANSI coloring, they are wrapped in `-` instead of shown in red.

Since blaming an exception can be expensive, `Exception.blame/3` must be used exclusively in debugging situations. It is not advised to apply it to production components such as a Logger. This feature has been integrated into the compiler, the command line, ExUnit and IEx.

This feature also requires Erlang/OTP 20.

## Streamlined child specs

Elixir v1.5 streamlines how supervisors are defined and used in Elixir. Elixir now allows child specifications, which specify how a child process is supervised, to be defined in modules. In previous versions, a project using Phoenix would write:

```elixir
import Supervisor.Spec

children = [
  supervisor(MyApp.Repo, []),
  supervisor(MyApp.Endpoint, [])
]

Supervisor.start_link(children, strategy: :one_for_one)
```

In Elixir v1.5, one might do:

```elixir
children = [
  MyApp.Repo,
  MyApp.Endpoint
]

Supervisor.start_link(children, strategy: :one_for_one)
```

The above works by calling the `child_spec/1` function on the given modules.

This new approach allows `MyApp.Repo` and `MyApp.Endpoint` to control how they run under a supervisor. This reduces the chances of mistakes being made, such as starting an Ecto repository as a worker or forgetting to declare that tasks are temporary in a supervision tree.

If it is necessary to configure any of the children, such can be done by passing a tuple instead of an atom:

```elixir
children = [
  {MyApp.Repo, url: "ecto://localhost:4567/my_dev"},
  MyApp.Endpoint
]
```

The modules `Agent`, `Registry`, `Task`, and `Task.Supervisor` have been updated to include a `child_spec/1` function, allowing them to be used directly in a supervision tree similar to the examples above. `use Agent`, `use GenServer`, `use Supervisor`, and `use Task` have also been updated to automatically define an overridable `child_spec/1` function.

Finally, child specifications are now provided as maps (data-structures) instead of the previous `Supervisor.Spec.worker/3` and `Supervisor.Spec.supervisor/3` APIs. This behaviour also aligns with how supervisors are configured in Erlang/OTP 18+. See the updated [`Supervisor`](https://hexdocs.pm/elixir/1.5/Supervisor.html) docs for more information, as well as the new `Supervisor.init/2` and `Supervisor.child_spec/2` functions.

## @impl

This release also allows developers to mark which functions in a given module are an implementation of a callback. For example, when using the [Plug](https://github.com/elixir-lang/plug) project, one needs to implement both `init/1` and `call/2` when writing a Plug:

```elixir
defmodule MyApp do
  @behaviour Plug

  def init(_opts) do
    opts
  end

  def call(conn, _opts) do
    Plug.Conn.send_resp(conn, 200, "hello world")
  end
end
```

The problem with the approach above is that, once more and more functions are added to the `MyApp` module, it becomes increasingly harder to know the purposes of the `init/1` and `call/2` functions. For example, for a developer unfamiliar with Plug, are those functions part of the `MyApp` API or are they implementations of a given callback?

Elixir v1.5 introduces the `@impl` attribute, which allows us to mark that certain functions are implementation of callbacks:

```elixir
defmodule MyApp do
  @behaviour Plug

  @impl true
  def init(_opts) do
    opts
  end

  @impl true
  def call(conn, _opts) do
    Plug.Conn.send_resp(conn, 200, "hello world")
  end
end
```

You may even use `@impl Plug` if you want to explicitly document which behaviour defines the callback you are implementing.

Overall, using `@impl` has the following advantages:

  * Readability of the code is increased, as it is now clear which functions are part of your API and which ones are callback implementations. To reinforce this idea, `@impl true` automatically marks the function as `@doc false`, disabling documentation unless `@doc` is explicitly set

  * If you define `@impl` before a function that is not a callback, Elixir will error. This is useful in case of typos or in case the behaviour definition changes (such as a new major version of a library you depend on is released)

  * If you use `@impl` in one implementation, Elixir will force you to declare `@impl` for all other implementations in the same module, keeping your modules consistent

## Calendar improvements

[Elixir v1.3](https://elixir-lang.org/blog/2016/06/21/elixir-v1-3-0-released/) introduced the Calendar module with the underlying  `Time`, `Date`, `NaiveDateTime` and `Datetime` data types. We are glad to announce we consider the base Calendar API to be finished in Elixir v1.5. This release includes many enhancements, such as `Date.range/2` and the ability to convert between different calendars.

## Summing up

The full list of changes is available in our [release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.5.0). There are many other exciting changes, such as compiler enhancements that reduces compilation times by 10%-15% on averages. When taken into account with the compiler improvements in Erlang/OTP 20 itself, some applications have seen gains up to 30% in compilation times.

Don't forget to check [the Install section](/install.html) to get Elixir installed and our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) to learn more.
