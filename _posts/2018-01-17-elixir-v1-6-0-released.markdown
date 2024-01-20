---
layout: post
title: Elixir v1.6 released
author: José Valim
category: Releases
excerpt: Elixir v1.6 includes a code formatter, defguard, dynamic supervision and new module attributes that improves code quality and the developer experience
---

Elixir v1.6 includes new features, enhancements, and bug fixes. The main feature in this release is a code formatter. Important improvements can also be found in the standard library and in the Mix build tool.

## Code formatter

The big feature in Elixir v1.6 is the addition of [a code formatter](https://hexdocs.pm/elixir/Code.html#format_string!/2) and an accompanying `mix format` task that adds automatic formatting to your projects.

The goal of the formatter is to automate the styling of codebases into a unique and consistent layout used across teams and the whole community. Code is now easier to write, as you no longer need to concern yourself with formatting rules. Code is also easier to read, as you no longer need to convert the styles of other developers in your mind.

The formatter also helps new developers to learn the language by giving immediate feedback on code structure, and eases code reviews by allowing teams to focus on business rules and code quality rather than code style.

To automatically format your codebase, you can run the [new `mix format` task](https://hexdocs.pm/mix/Mix.Tasks.Format.html). A `.formatter.exs` file may be added to your project root for rudimentary formatter configuration. The mix task also supports flags for CI integration. For instance, you can make your build or a Pull Request fail if the code is not formatted accordingly by using the `--check-formatted` flag. We also recommend developers to check their favorite editor and see if it already provides key bindings for `mix format`, allowing a file or a code snippet to be formatted without hassle.

The Elixir codebase itself [has already been fully formatted](https://github.com/elixir-lang/elixir/issues/6643) and all further contributions are expected to contain formatted code. We recommend existing codebases to be formatted in steps. While the formatter will correctly handle long lines and complex expressions, refactoring the code by breaking those into variables or smaller functions as you format them will lead to overall cleaner and more readable codebases.

## Dynamic Supervisor

Supervisors in Elixir are responsible for starting, shutting down, and restarting child processes when things go wrong. Most of the interaction with supervisors happens through [the `Supervisor` module](https://hexdocs.pm/elixir/Supervisor.html) and it provides three main strategies: `:one_for_one`, `:rest_for_one` and `:one_for_all`.

However, sometimes the children of a supervisor are not known upfront and are rather started dynamically. For example, if you are building a web server, you have each request being handled by a separate supervised process. Those cases were handled in the Supervisor module under a special strategy called `:simple_one_for_one`.

Unfortunately, this special strategy changed the semantics of the supervisor in regards to initialization and shutdown. Plus some APIs expected different inputs or would be completely unavailable depending on the supervision strategy.

Elixir v1.6 addresses this issue by introducing [a new `DynamicSupervisor` module](https://hexdocs.pm/elixir/DynamicSupervisor.html), which encapsulates the old `:simple_one_for_one` strategy and APIs in a proper module while allowing the documentation and API of the `Supervisor` module to focus on its main use cases. Having a separate `DynamicSupervisor` module also makes it simpler to add new features to the dynamic supervisor, such as the new `:max_children` option that limits the maximum number of children supervised dynamically.

## `@deprecated` and `@since` attributes

This release also introduces two new attributes associated with function definitions: `@deprecated` and `@since`. The former marks if a function or macro is deprecated, the latter annotates the version the API was introduced:

```elixir
@doc "Breaks a collection into chunks"
@since "1.0.0"
@deprecated "Use chunk_every/2 instead"
def chunk(collection, chunk_size) do
  chunk_every(collection, chunk_size)
end
```

The `mix xref` task was also updated to warn if your project calls deprecated code. So if a definition is marked as `@deprecated` and a module invokes it, a warning will be emitted during compilation. This effectively provides libraries and frameworks a mechanism to deprecate code without causing multiple warnings to be printed in runtime and without impacting performance.

Note those attributes are not yet available to tools that generate documentation. Such functionality will be added in Elixir v1.7 once [Elixir adopts EEP-48](https://github.com/elixir-lang/elixir/issues/7198). We still recommend developers to start annotating their APIs so the information is already available when the tooling is updated.

## `defguard` and `defguardp`

Elixir provides the concepts of guards: expressions used alongside pattern matching to select a matching clause. Let's see an example straight from [Elixir's home page](https://elixir-lang.org):

```elixir
def drive(%User{age: age}) when age >= 16 do
  # Code that drives a car
end
```

`%User{age: age}` is matching on a `User` struct with an age field and `when age >= 16` is the guard.

Since only a handful of constructs are [allowed in guards](https://hexdocs.pm/elixir/guards.html#content), if you were in a situation where you had to check the age to be more than or equal to 16 in multiple places, extracting the guard to a separate function would be [less than obvious and error prone](https://github.com/elixir-lang/elixir/issues/2469). To address those issues, [this release introduces `defguard/1` and `defguardp/1`](https://hexdocs.pm/elixir/Kernel.html#defguard/1):

```elixir
defguard is_old_to_drive(age) when age >= 16

def drive(%User{age: age}) when is_old_to_drive(age) do
  # Code that drives a car
end
```

## IEx improvements

IEx also got its share of improvements. The new code formatter allows us to pretty print code snippets, types and specifications, improving the overall experience when exploring code through the terminal.

The autocomplete mechanism also got smarter, being able to provide context autocompletion. For example, typing `t Enum.` and hitting TAB will autocomplete only the types in Enum (in contrast to all functions). Typing `b GenServer.` and hitting TAB will autocomplete only the behaviour callbacks.

Finally, the breakpoint functionality added [in Elixir v1.5](https://elixir-lang.org/blog/2017/07/25/elixir-v1-5-0-released/) has been improved to support pattern matching and guards. For example, to pattern match on a function call when the first argument is the atom `:foo`, you may do:

```
iex> break! SomeFunction.call(:foo, _, _)
```

For more information, see [`IEx.break!/4`](https://hexdocs.pm/iex/IEx.html#break!/4).

## mix xref

[`mix xref`](https://hexdocs.pm/mix/Mix.Tasks.Xref.html) is a task added in Elixir v1.3 which provides general information about how modules and files in an application depend on each other. This release brings many improvements to `xref`, extending the reach of the analysis and helping developers digest the vast amount of data it produces.

One of such additions is the `--include-siblings` option that can be given to all `xref` commands inside umbrella projects. For example, to find all of the callers of a given module or function of an application in an umbrella:

```
$ mix xref callers SomeModule --include-siblings
```

The `graph` command in `mix xref` now can also output general statistics about the graph. In [the hexpm project](https://github.com/hexpm/hexpm), you would get:

```
$ mix xref graph --format stats
Tracked files: 129 (nodes)
Compile dependencies: 256 (edges)
Structs dependencies: 46 (edges)
Runtime dependencies: 266 (edges)

Top 10 files with most outgoing dependencies:
  * test/support/factory.ex (18)
  * lib/hexpm/accounts/user.ex (13)
  * lib/hexpm/accounts/audit_log.ex (12)
  * lib/hexpm/web/controllers/dashboard_controller.ex (12)
  * lib/hexpm/repository/package.ex (12)
  * lib/hexpm/repository/releases.ex (11)
  * lib/hexpm/repository/release.ex (10)
  * lib/hexpm/web/controllers/package_controller.ex (10)
  * lib/mix/tasks/hexpm.stats.ex (9)
  * lib/hexpm/repository/registry_builder.ex (9)

Top 10 files with most incoming dependencies:
  * lib/hexpm/web/web.ex (84)
  * lib/hexpm/web/router.ex (29)
  * lib/hexpm/web/controllers/controller_helpers.ex (29)
  * lib/hexpm/web/controllers/auth_helpers.ex (28)
  * lib/hexpm/web/views/view_helpers.ex (27)
  * lib/hexpm/web/views/icons.ex (27)
  * lib/hexpm/web/endpoint.ex (23)
  * lib/hexpm/ecto/changeset.ex (22)
  * lib/hexpm/accounts/user.ex (19)
  * lib/hexpm/repo.ex (19)
```

`mix xref graph` also got the `--only-nodes` and `--label` options. The former asks Mix to only output file names (nodes) without the edges. The latter allows you to focus on certain relationships:

```
# To get all files that depend on lib/foo.ex
mix xref graph --sink lib/foo.ex --only-nodes

# To get all files that depend on lib/foo.ex at compile time
mix xref graph --label compile --sink lib/foo.ex --only-nodes

# To get all files lib/foo.ex depends on
mix xref graph --source lib/foo.ex --only-nodes

# To limit statistics only to compile time dependencies
mix xref graph --format stats --label compile
```

Those improvements will help developers better understand the relationship between files and reveal potentially complex parts of their systems.

Other improvements in Mix include [better compiler diagnostics](https://hexdocs.pm/mix/Mix.Task.Compiler.html) for editor integration, support for [the `--slowest N` flag in `mix test`](https://hexdocs.pm/mix/Mix.Tasks.Test.html) that shows the slowest tests in your suite, and a new [`mix profile.eprof` task](https://hexdocs.pm/mix/Mix.Tasks.Eprof.html) that provides time based profiling, complementing the existing [`mix profile.cprof` (count based)](https://hexdocs.pm/mix/Mix.Tasks.Profile.Cprof.html) and [`mix profile.fprof` (flame based)](https://hexdocs.pm/mix/Mix.Tasks.Profile.Fprof.html).

## Summing up

The full list of changes is available in our [release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.6.0). There are many other exciting changes, such as compiler enhancements to better track dependencies, leading to less files being recompiled whenever there are changes in project, and overall faster compilation.

Work on Elixir v1.7 has already started. We still welcome developers to try out the [previously announced StreamData library](https://elixir-lang.org/blog/2017/10/31/stream-data-property-based-testing-and-data-generation-for-elixir/), that aims to bring data generation and property-based testing to Elixir. The other [features scheduled for v1.7 can be found in the issues tracker](https://github.com/elixir-lang/elixir/issues).

Don't forget to check [the Install section](/install.html) to get Elixir installed and our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) to learn more.
