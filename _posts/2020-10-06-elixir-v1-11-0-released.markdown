---
layout: post
title: Elixir v1.11 released
author: José Valim
category: Releases
excerpt: Elixir v1.11 is out with improvements to the compiler and tighter integration with Erlang/OTP
---

Over the last releases, the Elixir team has been focusing on the compiler, both in terms of catching more mistakes at compilation time and making it faster. Elixir v1.11 has made excellent progress on both fronts. This release also includes many other goodies, such as tighter Erlang integration, support for more guard expressions, built-in datetime formatting, and other calendar enhancements.

During this period, we have also started [publishing a series of production cases](/cases.html) on our website, featuring Elixir's usage at [Farmbot](/blog/2020/08/20/embedded-elixir-at-farmbot/) and [Heroku](/blog/2020/09/24/paas-with-elixir-at-Heroku/), with many more cases coming soon.

For now, let's focus on what's new in Elixir v1.11.

## Tighter Erlang integration

On the footsteps of v1.10, we have further integrated with Erlang's new logger by adding four new log levels: `notice`, `critical`, `alert`, and `emergency`, matching all log levels found in the Syslog standard. The `Logger` module now supports structured logging by passing maps and keyword lists to its various functions. It is also possible to specify the log level per module, via the [`Logger.put_module_level/2`](https://hexdocs.pm/logger/Logger.html#put_module_level/2) function. Log levels per application will be added in future releases.

IEx also has been improved to show the documentation for Erlang modules directly from your Elixir terminal. For example, here is a clip of me accessing the documentation for [Erlang's gen_server module](erlang.org/doc/man/gen_server.html):

<script id="asciicast-1Kqwwkn0wMl0feePvWQwHe85G" src="https://asciinema.org/a/1Kqwwkn0wMl0feePvWQwHe85G.js" async></script><noscript><p><a href="https://asciinema.org/a/iAOk0yaZtQDsuJqn2sXa1FRQW">See the example in asciinema</a></p></noscript>

 This works with Erlang/OTP 23+ and requires Erlang modules to have been compiled with documentation chunks. A huge thank you to the Erlang/OTP team and the Documentation Working Group of the [Erlang Ecosystem Foundation](https://erlef.org/) for making this possible.

## Compiler checks: application boundaries

Elixir v1.11 builds on top of the recently added compilation tracers to track application boundaries. From this release, Elixir will warn if you invoke a function from an existing module but this module does not belong to any of your listed dependencies.

These two conditions may seem contradictory. After all, if a module is available, it must have come from a dependency. This is not true in two scenarios:

  * Modules from Elixir and Erlang/OTP are always available - even if their applications are not listed as a dependency

  * In an umbrella project, because all child applications are compiled within the same VM, you may have a module from a sibling project available, even if you don't depend on said sibling

This new compiler check makes sure that all modules that you invoke are listed as part of your dependencies, emitting a warning like below otherwise:

```text
:ssl.connect/2 defined in application :ssl is used by the current
application but the current application does not directly depend
on :ssl. To fix this, you must do one of:

  1. If :ssl is part of Erlang/Elixir, you must include it under
     :extra_applications inside "def application" in your mix.exs

  2. If :ssl is a dependency, make sure it is listed under "def deps"
     in your mix.exs

  3. In case you don't want to add a requirement to :ssl, you may
     optionally skip this warning by adding [xref: [exclude: :ssl]
     to your "def project" in mix.exs
```

This comes with extra benefits in umbrella projects, as it requires applications to depend on the siblings they depend on, which will fail if there are any cyclic dependencies.

## Compiler checks: data constructors

In Elixir v1.11, the compiler also tracks structs and maps fields across a function body. For example, imagine you wanted to write this code:

```elixir
def drive?(%User{age: age}), do: age >= 18
```

If there is either a typo on the `:age` field or the `:age` field was not yet defined, the compiler will fail accordingly. However, if you wrote this code:

```elixir
def drive?(%User{} = user), do: user.age >= 18
```

The compiler would not catch the missing field and an error would only be raised at runtime. With v1.11, Elixir will track the usage of all maps and struct fields within the same function, emitting warnings for cases like above:

```text
warning: undefined field `age` in expression:

    # example.exs:7
    user.age

expected one of the following fields: name, address

where "user" was given the type %User{} in:

    # example.exs:7
    %User{} = user

Conflict found at
  example.exs:7: Check.drive?/1
```

The compiler also checks binary constructors. Consider you have to send a string over the wire with length-based encoding, where the string is prefixed by its length, up to 4MBs. Your initial attempt may be this:

```elixir
def run_length(string) when is_binary(string) do
  <<byte_size(string)::32, string>>
end
```

However, the code above has a bug. Each segment given between `<<>>` must be an integer, unless specified otherwise. With Elixir v1.11, the compiler will let you know so:

```text
warning: incompatible types:

    binary() !~ integer()

in expression:

    <<byte_size(string)::integer()-size(32), string>>

where "string" was given the type integer() in:

    # foo.exs:4
    <<byte_size(string)::integer()-size(32), string>>

where "string" was given the type binary() in:

    # foo.exs:3
    is_binary(string)

HINT: all expressions given to binaries are assumed to be of type integer()
unless said otherwise. For example, <<expr>> assumes "expr" is an integer.
Pass a modifier, such as <<expr::float>> or <<expr::binary>>, to change the
default behaviour.

Conflict found at
  foo.exs:4: Check.run_length/1
```

Which can be fixed by adding `::binary` to the second component:

```elixir
def run_length(string) when is_binary(string) do
  <<byte_size(string)::32, string::binary>>
end
```

While some of those warnings could be automatically fixed by the compiler, future versions will also perform those checks across functions and potentially across modules, where automatic fixes wouldn't be desired (nor possible).

## Compilation time improvements

Elixir v1.11 features many improvements to how the compiler tracks file dependencies, such that touching one file causes less files to be recompiled. In previous versions, Elixir tracked three types of dependencies:

  * compile time dependencies - if A depends on B at compile time, such as by using a macro, whenever B changes, A is recompiled
  * struct dependencies - if A depends on B's struct, whenever B's struct definition changed, A is recompiled
  * runtime dependencies - if A depends on B at runtime, A is never recompiled

However, because dependencies are transitive, if A depends on B at compile time and B depends on C at runtime, A would depend on C at compile time. Therefore, it is very important to reduce the amount of compile time dependencies.

Elixir v1.11 replaces "struct dependencies" by "exports dependencies". In other words, if A depends on B, whenever B public's interface changes, A is recompiled. B's public interface is made by its struct definition and all of its public functions and macros.

This change allows us to mark `import`s and `require`s as "exports dependencies" instead of "compile time" dependencies. This simplifies the dependency graph considerably. For example, [in the Hex.pm project](https://github.com/hexpm/hexpm), changing the `user.ex` file in Elixir v1.10 would emit this:

```text
$ touch lib/hexpm/accounts/user.ex && mix compile
Compiling 90 files (.ex)
```

In Elixir v1.11, we now get:

```text
$ touch lib/hexpm/accounts/user.ex && mix compile
Compiling 16 files (.ex)
```

To make things even better, Elixir v1.11 also introduces a more granular tracking for umbrella projects (and path dependencies in general). In previous versions, a module from a sibling application would always be treated as a compile time dependency. This often meant that changing an application would cause many modules in sibling applications to recompile. Elixir v1.11 will tag modules from dependencies as exports whenever possible, yielding dramatic improvements in those cases.

To round up the list of compiler enhancements, the `--profile=time` option added in Elixir v1.10 now also includes the time to compile each individual file. For example, in the Plug project, one can now get:

```text
[profile] lib/plug/conn.ex compiled in 935ms
[profile] lib/plug/ssl.ex compiled in 147ms (plus 744ms waiting)
[profile] lib/plug/static.ex compiled in 238ms (plus 654ms waiting)
[profile] lib/plug/csrf_protection.ex compiled in 237ms (plus 790ms waiting)
[profile] lib/plug/debugger.ex compiled in 719ms (plus 947ms waiting)
[profile] Finished compilation cycle of 60 modules in 1802ms
[profile] Finished group pass check of 60 modules in 75ms
```

While implementing those features, we have also made the `--long-compilation-threshold` flag more precise. In previous versions, `--long-compilation-threshold` would consider both the time a file spent to compile and the time spent waiting on other files. In Elixir v1.11, it considers only the compilation time. This means less false positives and you can now effectively get all files that take longer than 2s to compile, in execution time, by passing `--long-compilation-threshold 2`.

## `config/runtime.exs` and `mix app.config`

Elixir v1.9 introduced a new configuration file called `config/releases.exs`. However, this new configuration file was executed only during releases. For those not familiar with releases, a release is a self-contained artifact with the Erlang VM, Elixir and your application, ready to run in production.

This new configuration file was considered a very useful addition to releases. Therefore, we are also introducing `config/runtime.exs`, which is executed after the code compilation on all environments (dev, test, and prod) - for both Mix and releases. Our goal is to provide a better runtime configuration experience to developers, in contrast to our current configuration system which has been mostly compile-time centric.

`config/runtime.exs` works the same as any other configuration file in Elixir. However, given `config/runtime.exs` is meant to run in production systems, where our `Mix` build tool is not available, developers must not use [`Mix.env()`](https://hexdocs.pm/mix/Mix.html#env/0) or [`Mix.target()`](https://hexdocs.pm/mix/Mix.html#target/0) in `config/runtime.exs`. Instead, they must use the new `config_env()` and `config_target()`, which have been added to the [`Config`](https://hexdocs.pm/elixir/Config.html) module.

While `config/releases.exs` will continue to be supported, developers can migrate to `config/runtime.exs` without loss of functionality. For example, a `config/releases.exs` file such as this one

```elixir
# config/releases.exs
import Config

config :foo, ...
config :bar, ...
```

could run as is as `config/runtime.exs`. However, given `config/runtime.exs` runs in all environments, you may want to restrict part of your configuration to the `:prod` environment:

```elixir
# config/runtime.exs
import Config

if config_env() == :prod do
  config :foo, ...
  config :bar, ...
end
```

If both files are available, releases will pick the now preferred `config/runtime.exs` instead of `config/releases.exs`.

To wrap it all up, `Mix` also includes a new task called [`mix app.config`](https://hexdocs.pm/mix/Mix.Tasks.App.Config.html). This task loads all applications and configures them, without starting them. Whenever you write your own Mix tasks, you will typically want to invoke either `mix app.start` or `mix app.config` before running your own code. Which one is better depends if you want your applications running or only configured.

## Other improvements

Elixir v1.11 adds the `is_struct/2`, `is_exception/1`, and `is_exception/2` guards. It also adds support for the `map.field` syntax in guards.

The Calendar module ships with a new [`Calendar.strftime/3`](https://hexdocs.pm/elixir/Calendar.html#strftime/3) function, which provides datetime formatting based on the `strftime` format. The [`Date`](https://hexdocs.pm/elixir/Date.html) module got new functions for working with weeks and months, such as `Date.beginning_of_month/1` and `Date.end_of_week/2`. Finally, all calendar types got conversion functions from and to gregorian timestamps, such as `Date.from_gregorian_days/2` and `NaiveDateTime.to_gregorian_seconds/1`.

Finally, to bring visibility to the compiler tracking improvements described in previous sections, we have also added new features to [`mix xref`](https://hexdocs.pm/mix/Mix.Tasks.Xref.html). `mix xref` is a task that describes cross-references between files in your projects and can be helpful to diagnose large compilation cycles in projects.

For a complete list of all changes, see the [full release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.11.0).

Check [the Install section](/install.html) to get Elixir installed and read our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) to learn more.

Have fun!
