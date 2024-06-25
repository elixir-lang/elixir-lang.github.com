---
layout: post
title: Elixir v1.7 released
author: José Valim
category: Releases
excerpt: Elixir v1.7 includes many quality of life improvements, focusing on documentation, Logger and ExUnit, as well as a new Elixir Core team member!
---

A new semester has started, which means it is time for a new Elixir release! This release brings quality of life improvements to the documentation, to error handling, to logger reporting, and to ExUnit, Elixir's testing library.

We are also glad to welcome Michał Muskała to the Elixir Core team. Prior to joining the team, he was [a member of the Ecto team](https://github.com/elixir-ecto/ecto), he has made [plenty of contributions to Elixir](https://github.com/elixir-lang/elixir/pulls?utf8=%E2%9C%93&q=is%3Apr+author%3Amichalmuskala), often to improve performance, and [is a frequent to contribute to Erlang/OTP too](https://github.com/erlang/otp/pulls?utf8=%E2%9C%93&q=is%3Apr+author%3Amichalmuskala)!

## Documentation metadata

Elixir v1.7 implements [EEP 48](http://www.erlang.org/eep/eeps/eep-0048.html). EEP 48 aims to bring documentation interoperability across all languages running on the Erlang VM.

Furthermore, EEP 48 introduces the ability to annotate documentation with metadata, which we have made possible to leverage from Elixir:

```elixir
@moduledoc "A brand new module"
@moduledoc authors: ["Jane", "Mary"], since: "1.4.0"
```

Metadata can be given to `@moduledoc`, `@typedoc` and `@doc`.

We have updated [the ExDoc tool](https://github.com/elixir-lang/ex_doc) to start leveraging metadata in order to provide better documentation for developers. Some of the improvements include:

  * Deprecated modules, functions, callbacks and types have a warning automatically attached to them. [See the deprecated `Behaviour` module as an example](https://hexdocs.pm/elixir/Behaviour.html)

  * Functions, macros, callbacks and types now include the version in which they were added. For example, [see the top right corner of the `defguard` docs](https://hexdocs.pm/elixir/Kernel.html#defguard/1)

  * Future Elixir versions will [include its own section for guards in the documentation and in the sidebar](https://hexdocs.pm/elixir/main/Kernel.html#guards). We are currently exploring ways to [generalize this feature in ExDoc itself](https://github.com/elixir-lang/ex_doc/issues/876)

Elixir's interactive shell, IEx, has also been updated to print metadata:

![IEx metadata](/images/contents/iex-metadata.png)

While Elixir allows any metadata to be given, those tools currently exhibit only `:deprecated` and `:since`. Other keys may be shown in the future.

Those improvements are not exclusive to the standard library, they are available to every Elixir library and application. We hope one day they will be available to all applications running on the Erlang VM too.

To access the new documentation format, developers should use [`Code.fetch_docs/1`](https://hexdocs.pm/elixir/Code.html#fetch_docs/1). We have always been proud of treating documentation as a first-class citizen and the ability to add structured information to the documentation is a further step in this direction.

## The `__STACKTRACE__` construct

Erlang/OTP 21.0 introduces a new way to retrieve the stacktrace that is lexically scoped and no longer relies on side-effects like `System.stacktrace/0` does. Before one would write:

```elixir
try do
  ... something that may fail ...
rescue
  exception ->
    log(exception, System.stacktrace())
    reraise(exception, System.stacktrace())
end
```

In Elixir v1.7, this can be written as:

```elixir
try do
  ... something that may fail ...
rescue
  exception ->
    log(exception, __STACKTRACE__)
    reraise(exception, __STACKTRACE__)
end
```

This change may also yield performance improvements in the future, since the lexical scope allows us to track precisely when a stacktrace is used and we no longer need to keep references to stacktrace entries after the `try` construct finishes.

Other parts of the exception system have also been improved. For example, more information is provided in certain occurrences of `ArgumentError`, `ArithmeticError` and `KeyError` messages.

## Erlang/OTP logger integration

Erlang/OTP 21 includes a new `:logger` module. Elixir v1.7 fully integrates with the new `:logger` and leverages its metadata system. The `Logger.Translator` mechanism has also been improved to export metadata, allowing custom Logger backends to leverage information such as:

  * `:crash_reason` - a two-element tuple with the throw/error/exit reason as the first argument and the stacktrace as the second

  * `:initial_call` - the initial call that started the process

  * `:registered_name` - the process' registered name as an atom

We recommend Elixir libraries that previously hooked into Erlang's `:error_logger` to hook into `Logger` instead, in order to support all current and future Erlang/OTP versions.

## Logger compile-time purging

Previously, Logger macros such as `debug`, `info`, and so on would always evaluate their arguments, even when nothing would be logged. From Elixir v1.7 the arguments are only evaluated when the message is logged.

The Logger configuration system also accepts a new option called `:compile_time_purge_matching` that allows you to remove log calls with specific compile-time metadata. For example, to remove all logger calls from application `:foo` with level lower than `:info`, as well as remove all logger calls from `Bar.foo/3`, you can use the following configuration:

```elixir
config :logger,
  compile_time_purge_matching: [
    [application: :foo, level_lower_than: :info],
    [module: Bar, function: "foo/3"]
  ]
```

## ExUnit improvements

[ExUnit](https://hexdocs.pm/ex_unit/) is Elixir's unit testing library. ExUnit has always leveraged Elixir macros to provide excellent error reports when a failure happens. For example, the following code:

```elixir
assert "fox jumps over the lazy dog" == "brown fox jumps over the dog"
```

will fail with the following report:

![ExUnit Diff](/images/contents/exunit-diff.png)

The `assert` macro is able to look at the code, extract the current file, the line, extract the operands and show a diff between the data structures alongside the stacktrace when the assertion fails.

However, sometimes we need to write assertions such as `assert some_function(expr1, var2)`. When such assertion fails, we usually have to re-run the tests, now debugging or printing the values of `expr1` and `var2`. In Elixir v1.7, when a "bare" assertion fails, we will print the value of each argument individually. For a simple example such as `assert some_vars(1 + 2, 3 + 4)`, we get this report:

![ExUnit Bare Assertion Diff](/images/contents/exunit-bare-assertion-diff.png)

We have also [added coloring and diffing to doctests](https://hexdocs.pm/ex_unit/ExUnit.DocTest.html#content).

While ExUnit is our test framework, Mix is our build tool. Developers typically run their tests by calling `mix test`.

On the `mix test` side of things, there is a new `--failed` flag that runs all tests that failed the last time they ran. Finally, coverage reports generated with `mix test --cover` include a summary out of the box:

```
Generating cover results ...

Percentage | Module
-----------|--------------------------
   100.00% | Plug.Exception.Any
   100.00% | Plug.Adapters.Cowboy2.Stream
   100.00% | Collectable.Plug.Conn
   100.00% | Plug.Crypto.KeyGenerator
   100.00% | Plug.Parsers
   100.00% | Plug.Head
   100.00% | Plug.Router.Utils
   100.00% | Plug.RequestId
       ... | ...
-----------|--------------------------
    77.19% | Total
```

## Summing up

We are really proud of this release, as it focuses mostly on quality of life improvements, instead of flashy new features. As Elixir continues to mature, expect more releases like this one. The full list of changes is available in our [release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.7.0).

We have also seen important developments in other areas not directly related to the Elixir codebase:

  * We have added [a "Development" section](https://elixir-lang.org/development.html) to the website, that outlines the Elixir team structure and goals

  * [Elixir now has its own mini-documentary](http://doc.honeypot.io/elixir-documentary-2018/), by [Honeypot](https://www.honeypot.io/)

  * We have already highlighted some of the improvements in the ExDoc tool. Another improvement worth mentioning is the syntax highlighting is now done in Elixir itself, via the [Makeup](https://github.com/tmbb/makeup) library. This gives us more control over the grammar, the style, and improves load times. If you would like to add support for other languages, [reach out](https://github.com/tmbb/makeup)!

Finally, don't forget [ElixirConf US](https://elixirconf.com/) is coming soon, in Bellevue, WA, September 4-7. Last year my keynote focused on the last 5 years with Elixir. This year we are ready to look into the 5 years ahead.

Check [the Install section](/install.html) to get Elixir installed and read our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) to learn more.
