---
layout: post
title: Elixir v1.3 released
author: José Valim
category: Releases
excerpt: Elixir v1.3 brings many improvements to the language, the compiler and its tooling, specially Mix (Elixir's build tool) and ExUnit (Elixir's test framework).
---

Elixir v1.3 brings many improvements to the language, the compiler and its tooling, specially Mix (Elixir's build tool) and ExUnit (Elixir's test framework). The most notable additions are the new Calendar types, the new cross-reference checker in Mix, and the assertion diffing in ExUnit. We will explore all of them and a couple more enhancements below.

With this release, we also welcome [Andrea Leopardi](http://github.com/whatyouhide) to Elixir Core Team. He has contributed greatly to this release and maintains important packages in the community, like [Gettext](https://github.com/elixir-lang/gettext) and [Redix](https://github.com/whatyouhide/redix).

## Language improvements

The language has been improved semantically and includes new types and APIs. Let's see the three major features.

### Deprecation of imperative assignment

Elixir will now warn if constructs like `if`, `case` and friends assign to a variable that is accessed in an outer scope. As an example, imagine a function called `format` that receives a message and some options and it must return a path alongside the message:

```elixir
def format(message, opts) do
  path =
    if (file = opts[:file]) && (line = opts[:line]) do
      relative = Path.relative_to_cwd(file)
      message  = Exception.format_file_line(relative, line) <> " " <> message
      relative
    end

  {path, message}
end
```

The `if` block above is implicitly changing the value in `message`. Now imagine we want to move the `if` block to its own function to clean up the implementation:

```elixir
def format(message, opts) do
  path = with_file_and_line(message, opts)
  {path, message}
end

defp with_file_and_line(message, opts) do
  if (file = opts[:file]) && (line = opts[:line]) do
    relative = Path.relative_to_cwd(file)
    message  = Exception.format_file_line(relative, line) <> " " <> message
    relative
  end
end
```

The refactored version is broken because the `if` block was actually returning two values, the relative path *and* the new message. Elixir v1.3 will warn on such cases, forcing both variables to be explicitly returned from `if`, `case` and other constructs. Furthermore, this change gives us the opportunity to unify the language scoping rules in future releases.

### Calendar types and sigils

Elixir v1.3 introduces the `Calendar` module as well as 4 new calendar types:

  * `Date` - used to store dates (year, month, day) in a given calendar
  * `Time` - used to store time (hour, minute, second, microseconds)
  * `NaiveDateTime` - used to store datetimes without a timezone (year, month, day, hour, minute, second, microseconds) in a given calendar. It is called naïve because without a timezone, the datetime may not actually exist. For example, when there are daylight savings changes, a whole hour may not exist (when the clock moves forward) or a particular instant may happen twice (when the clock moves backwards)
  * `DateTime` - used to store datetimes with timezone (year, month, day, hour, minute, second, microsecond and time zone, with abbreviation, UTC and standard offset)

The aim of the current implementation of the Calendar modules and its types is to provide a base for interoperatibility in the ecosystem instead of full-featured datetime API. This release includes basic functionality for building new types and converting them from and back strings.

Elixir v1.3 also introduces 3 new sigils related to the types above:

  * `~D[2016-05-29]` - builds a new date
  * `~T[08:00:00]` and `~T[08:00:00.285]` - builds a new time (with different precisions)
  * `~N[2016-05-29 08:00:00]` - builds a naive date time

### Access selectors

This release introduces new accessors to make it simpler for developers to traverse nested data structures, traversing and updating data in different ways.  For instance, given a user with a list of languages, here is how to deeply traverse the map and convert all language names to uppercase:

```elixir
iex> user = %{name: "john",
...>          languages: [%{name: "elixir", type: :functional},
...>                      %{name: "c", type: :procedural}]}
iex> update_in user, [:languages, Access.all(), :name], &String.upcase/1
%{name: "john",
  languages: [%{name: "ELIXIR", type: :functional},
              %{name: "C", type: :procedural}]}
```

You can see the new accessors in the `Access` module.

## Mix

Mix includes new tasks to improve your everyday workflow. Some of those tasks relies on many compiler improvements to know more about your code, providing static analysis to find possible bugs in your code and faster compilation cycles.

### Compiling n files

Mix no longer announces every file it compiles. Instead it outputs how many files there is to compile per compilers. Here is the output for a project like [`gettext`](https://github.com/elixir-lang/gettext):

```
Compiling 1 file (.yrl)
Compiling 1 file (.erl)
Compiling 19 files (.ex)
Generated gettext app
```

In case a file is taking too long to compile, Mix will announce such, for example:

```
Compiling lib/gettext.ex (it's taking more than 10s)
```

The goal of these changes is to put an increased focus on the "warnings" emitted by the compiler.

In any case, the previous behaviour can be brought back with the `--verbose` flag and the compilation threshold for files that are taking long can be set via the `--long-compilation-threshold` option.

### mix xref

Speaking about warnings, Mix v1.3 includes a new task called `xref` that performs cross reference checks in your code. One of such checks is the ability to find calls to modules and functions that do not exist. For example, if in your library code you call `ThisModuleDoesNotExist.foo(1, 2, 3)`, `mix xref unreachable` will be able to find such code and let you know about it.

Since such checks can discover possible bugs in your codebase, a new compiler called `xref` has been added to `Mix.compilers/0`, so it runs by default every time you compile your code. [PragTob has written an article exploring how this new compiler has found bugs in existing projects](https://pragtob.wordpress.com/2016/06/02/elixir-1-3s-mix-xref-working-its-magic-in-a-real-world-example/).

We have included other modes in `xref`, such as:

  * `mix xref callers Foo` - used to find all places in your code that calls a function from the module `Foo`

  * `mix xref graph` - generates a graph with dependencies between source files

You can find documentation for all modes by running `mix help xref`. We hope tools and text editors can leverage such features to provide useful functionality for their users, helping developers understand code complexity and finding bugs early on.

### Better dependency tracking

Besides `xref`, Elixir v1.3 provides better module tracking generally. For example, in previous versions, if you changed a `:path` dependency, Elixir would always fully recompile the current project. In this release, we have improved the tracking algorithms such that, if you change a `:path` dependency, only the files that depend on such dependency are recompiled.

Such improvements do not only make compilation faster but they also make working with umbrella applications much more productive. Previously, changing a sibling application triggered a full project recompilation, now Elixir can track between sibling applications and recompile only what is needed.

### mix app.tree and deps.tree

Mix also includes both `mix app.tree` and `mix deps.tree`. The first will list all applications your current project needs to start in order to boot (i.e. the ones listed in `application/0` in your `mix.exs`) while the second will lists all of your dependencies and so on recursively.

Here is a quick example from [Plug](https://github.com/elixir-lang/plug):

```elixir
$ mix app.tree
plug
├── elixir
├── crypto
├── logger
│   └── elixir
└── mime
    └── elixir
```

The `--format dot` option can also be given to generate graph files to be opened by [GraphViz](http://www.graphviz.org). For example, here is the output of running `mix deps.tree --format dot --only prod` in the [Phoenix web framework](http://phoenixframework.org):

<p style="text-align: center">
  <img src="/images/contents/deps-tree-phoenix.svg" alt="mix deps.tree for Phoenix in production">
</p>

### mix escript.install

Mix also includes `mix escript.install` and `mix escript.uninstall` tasks for managing escripts. The tasks was designed in a way to mimic the existing `mix archive` functionality except that:

  * Archives must be used sparingly because every new archive installed affects Mix performance, as every new archive is loaded when Mix boots. Escripts solve this by being managed apart from your Elixir/Mix installed
  * Archives depends on the current Elixir version. Therefore, updating your Elixir version may break an archive. Fortunately, escripts include Elixir inside themselves, and therefore do not depend on your Elixir system version

Escripts will be installed at `~/.mix/escripts` which must be added to your [`PATH` environment variable](https://en.wikipedia.org/wiki/PATH_(variable)).

### Option parser integration

Elixir v1.3 includes improvements to the option parser, including `OptionParser.parse!/2` and `OptionParser.parse_head!/2` functions that will raise in case of invalid or unknown switches. Mix builds on top of this functionality to provide automatic error reporting solving a common complaint where invalid options were not reported by Mix tasks.

For example, invoking `mix test --unknown` in earlier Elixir versions would silently discard the `--unknown` option. Now `mix test` correctly reports such errors:

```
$ mix test --unknown
** (Mix) Could not invoke task "test": 1 error found!
--unknown : Unknown option
```

Note not all tasks have been updated to use strict option parsing. Some tasks, like `mix compile`, are actually a front-end to many other tasks, and as such, it cannot effectively assert which options are valid.

## ExUnit

ExUnit packs many improvements on the tooling side, better integration with external tools, as well as mechanisms to improve the readability of your tests.

### mix test \-\-stale

ExUnit builds on top of `mix xref` to provide the `mix test --stale` functionality. When the `--stale` flag is given, `mix` will only run the tests that may have changed since the last time you ran `mix test --stale`. For example:

  * If you saved a test file on disk, Mix will run that file and ignore the ones that have not changed
  * If you changed a library file, for example, `lib/foo.ex` that defines `Foo`, any test that invokes a function in `Foo` directly or indirectly will also run
  * If you modify your `mix.exs` or your `test/test_helper.exs`, Mix will run the whole test suite

This feature provides a great workflow for developers, allowing them to effortlessly focus on parts of the codebase when developing new features.

### Diffing

ExUnit will now include diff-ing output every time a developer asserts `assert left == right` in their tests. For example, the assertion:

```elixir
assert "fox jumps over the lazy dog" ==
       "brown fox jumps over the dog"
```

will fail with

![ExUnit diff](/images/contents/exunit-diff.png)

such that "lazy" in "lhs" will be shown in red to denote it has been removed from "rhs" while "brown" in "rhs" will be shown in green to denote it has been added to the "rhs".

When working with large or nested data structures, the diffing algorithm makes it fast and convenient to spot the actual differences in the asserted values.

### Test types

ExUnit v1.3 includes the ability to register different test types. This means libraries like QuickCheck can now provide functionality such as:

```elixir
defmodule StringTest do
  use ExUnit.Case, async: true
  use PropertyTestingLibrary

  property "starts_with?" do
    forall({s1, s2} <- {utf8, utf8}) do
      String.starts_with?(s1 <> s2, s1)
    end
  end
end
```

At the end of the run, ExUnit will also report it as a property, including both the amount of tests and properties:

```
1 property, 10 tests, 0 failures
```

### Named setups and describes

Finally, ExUnit v1.3 includes the ability to organize tests together in describe blocks:

```elixir
defmodule StringTest do
  use ExUnit.Case, async: true

  describe "String.capitalize/2" do
    test "uppercases the first grapheme" do
      assert "T" <> _ = String.capitalize("test")
    end

    test "lowercases the remaining graphemes" do
      assert "Test" = String.capitalize("TEST")
    end
  end
end
```

Every test inside a describe block will be tagged with the describe block name. This allows developers to run tests that belong to particular blocks, be them in the same file or across many files:

```
$ mix test --only describe:"String.capitalize/2"
```

Note describe blocks cannot be nested. Instead of relying on hierarchy for composition, we want developers to build on top of named setups. For example:

```elixir
defmodule UserManagementTest do
  use ExUnit.Case, async: true

  describe "when user is logged in and is an admin" do
    setup [:log_user_in, :set_type_to_admin]

    test ...
  end

  describe "when user is logged in and is a manager" do
    setup [:log_user_in, :set_type_to_manager]

    test ...
  end

  defp log_user_in(context) do
    # ...
  end
end
```

By restricting hierarchies in favor of named setups, it is straight-forward for the developer to glance at each describe block and know exactly the setup steps involved.

## Summing up

The full list of changes is available in our [release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.3.0). Don't forget to check [the Install section](/install.html) to get Elixir installed and our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) to learn more.

Happy coding!
