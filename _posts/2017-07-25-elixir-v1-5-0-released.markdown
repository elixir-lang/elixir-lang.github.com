---
layout: post
title: Elixir v1.5 released
author: José Valim
category: Releases
excerpt: Elixir v1.5 integrates with Erlang/OTP 20 and bring changes that improves the language reach and the developer experience
---

Elixir v1.5 includes new features, enhancements and bug fixes. While [Elixir v1.4](/blog/2017/01/05/elixir-v1-4-0-released/) focused on tools for concurrency and scalability, Elixir v1.5 brings many improvements to the developer experience and quality of life. As we will see, many of those are powered by the latest Erlang/OTP 20. This is also the last Elixir release that supports Erlang/OTP 18.

## UTF-8 atoms, function names and variables

Elixir v1.5 supports non-quoted atoms and variables to be in UTF-8 when using Erlang/OTP 20+. For example:

    test "こんにちは世界" do
      assert :こんにちは世界
    end

Or:

    saudação = "Bom dia!"

Elixir follows the recommendations in [Unicode Annex #31](http://unicode.org/reports/tr31/) to make the language more accessible to other languages and communities. Identifiers must still be a sequence of letters, followed by digits and combining marks. This means symbols, such as mathematical notations and emoji, are not allowed identifiers.

For a complete reference on Elixir syntax, see the [Syntax Reference](https://hexdocs.pm/elixir/syntax-reference.html). For technical details on Unicode support, see [Unicode Syntax](https://hexdocs.pm/elixir/unicode-syntax.html).

## IEx improvements

IEx got many improvements. The autocompletion system is now capable of autocompleting variables and user imports. New helpers have also been added:

  * `exports/1` lists all exports (functions and macros) in a given module
  * `open/1` opens up the source of a module or function directly in your editor. For example, `open MyApp.Module`
  * `runtime_info/0` prints general information about the running system, such as number of cores, runtime version, allocation of memory in the VM and more

IEx also features a breakpoint system for code debugging. The following functions have been added to aid debugging:

  * `break!/2` - sets up a breakpoint for a given `Mod.fun/arity`
  * `break!/4` - sets up a breakpoint for the given module, function, arity
  * `breaks/0` - prints all breakpoints and their ids
  * `continue/0` - continues until the next breakpoint in the same process
  * `open/0` - opens editor on the current breakpoint
  * `remove_breaks/0` - removes all breakpoints in all modules
  * `remove_breaks/1` - removes all breakpoints in a given module
  * `reset_break/1` - sets the number of stops on the given id to zero
  * `reset_break/3` - sets the number of stops on the given module, function, arity to zer
  * `respawn/0` - starts a new shell (breakpoints will ask for permission once more)
  * `whereami/1` - shows the current location

## Exception.blame

`Exception.blame/3` is a new function in Elixir that is capable of attaching debug information to certain exceptions. Currently this is used to augment `FunctionClauseError`s with a summary of all clauses and which parts of clause match and which ones didn't. For example:

    iex> Access.fetch(:foo, :bar)
    ** (FunctionClauseError) no function clause matching in Access.fetch/2

    The following arguments were given to Access.fetch/2:

        # 1
        :foo

        # 2
        :bar

    Attempted function clauses (showing 5 out of 5):

        def fetch(-%struct{} = container-, key)
        def fetch(map, key) when -is_map(map)-
        def fetch(list, key) when -is_list(list)- and is_atom(key)
        def fetch(list, key) when -is_list(list)-
        def fetch(-nil-, _key)

    (elixir) lib/access.ex:261: Access.fetch/2

In the example above, an argument that did not match or guard that did not evaluate to true are shown between `-`. If the terminal supports ANSI coloring, they are wrapped in red instead of the `-` character.

Since blaming an exception can be expensive, `Exception.blame/3` must be used exclusively in debugging situations. It is not advised to apply it to production components such as a Logger. This feature has been integrated into the compiler, the command line, ExUnit and IEx.

This feature also requires Erlang/OTP 20+.

## Streamlined child specs

Elixir v1.5 streamlines how supervisors are defined and used in Elixir. Elixir now allows child specifications, which specify how a child process is supervised, to be defined in modules. In previous versions, a project using Phoenix would write:

    import Supervisor.Spec

    children = [
      supervisor(MyApp.Repo, []),
      supervisor(MyApp.Endpoint, [])
    ]

    Supervisor.start_link(children, strategy: :one_for_one)

In Elixir v1.5, one might do:

    children = [
      MyApp.Repo,
      MyApp.Endpoint
    ]

    Supervisor.start_link(children, strategy: :one_for_one)

The above works by calling the `child_spec/1` function on the given modules.

This new approach allows `MyApp.Repo` and `MyApp.Endpoint` to control how they run under a supervisor. This reduces the chances of mistakes being made, such as starting an Ecto repository as a worker or forgetting to declare that tasks are temporary in a supervision tree.

If it is necessary to configure any of the children, such can be done by passing a tuple instead of an atom:

    children = [
      {MyApp.Repo, url: "ecto://localhost:4567/my_dev"},
      MyApp.Endpoint
    ]

The modules `Agent`, `Registry`, `Task`, and `Task.Supervisor` have been updated to include a `child_spec/1` function, allowing them to be used directly in a supervision tree similar to the examples above. `use Agent`, `use GenServer`, `use Supervisor`, and `use Task` have also been updated to automatically define an overridable `child_spec/1` function.

Finally, child specifications are now provided as maps (data-structures) instead of the previous `Supervisor.Spec.worker/3` and `Supervisor.Spec.supervisor/3` APIs. This behaviour also aligns with how supervisors are configured in Erlang/OTP 18+. See the updated `Supervisor` docs for more information, as well as the new `Supervisor.init/2` and `Supervisor.child_spec/2` functions.

## @impl

This release also allows developers to mark which functions in a given module are an implementation of a callback. For example, when using the [Plug](https://github.com/elixir-lang/plug) project, one needs to implement both `init/1` and `call/2` when writing a Plug:

    defmodule MyApp do
      @behaviour Plug

      def init(_opts) do
        opts
      end

      def call(conn, _opts) do
        Plug.Conn.send_resp(conn, 200, "hello world")
      end
    end

The problem with the approach above is that, once more and more functions are added to the `MyApp` module, it becomes increasingly harder to know the purposes of the `init/1` and `call/2` functions. For example, for a developer unfamiliar with Plug, are those functions part of the `MyApp` API or are they implementations of a given callback?

Elixir v1.5 introduces the `@impl` attribute, which allows us to mark that certain functions are implementation of callbacks:

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

You may even use `@impl Plug` if you want to explicitly document which behaviour defines the callback you are implementing.

Overall, using `@impl` has the following advantages:

  * Readability of the code is increased, as it is now clear which functions are part of your API and which ones are callback implementations. To reinforce this idea, `@impl true` automatically marks the function as `@doc false`, disabling documentation unless `@doc` is explicitly set

  * If you define `@impl` before a function that is not a callback, Elixir will error. This is useful in case of typos or in case the behaviour definition changes (such as a new major version of a library you depend on is released)

  * If you use `@impl` in one implementation, Elixir will force you to declare `@impl` for all other implementations in the same module, keeping your modules consistent

## Calendar improvements

This release brings further improvements to Calendar types. It adds arithmetic and others functions to `Time`, `Date`, `NaiveDateTime` and `Datetime` as well as conversion between different calendars.

## Summing up

The full list of changes is available in our [release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.5.0). Don't forget to check [the Install section](/install.html) to get Elixir installed and our [Getting Started guide](http://elixir-lang.org/getting-started/introduction.html) to learn more.

**Note**: this post is currently in draft but it has been published since folks were linking to the release notes instead of the proper announcement. Screenshots and videos of some the features above will be added throughout the day.
