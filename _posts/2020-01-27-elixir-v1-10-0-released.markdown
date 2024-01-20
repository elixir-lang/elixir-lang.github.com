---
layout: post
title: Elixir v1.10 released
author: José Valim
category: Releases
excerpt: Elixir v1.10 is out with standard library, compiler, and releases improvements.
---

Elixir v1.10 comes with improvements to the standard library, the compiler, as well as several additions to the [`mix release` feature added in v1.9](/blog/2019/06/24/elixir-v1-9-0-released/). In particular, this version adds a lot of polish to existing features, such as our configuration system and our sorting APIs.

Also note Elixir v1.10 requires Erlang/OTP 21+. This allows us to provide tighter integration with Erlang/OTP's new logger. This means that the logger level, logger metadata, as well as all log messages are now shared between Erlang and Elixir APIs.

Let's take a look at what else is new.

## Releases improvements

Elixir v1.9 introduced releases as a mechanism to package self-contained applications. Elixir v1.10 further improves releases with bug fixes and new enhancements based on feedback we got from the community. The highlights are:

  * Allow the dual boot system of releases to be disabled on environments that are boot-time sensitive, such as embedded devices

  * Track and raise if compile-time configuration is set or changes at runtime (more in the next section)

  * Support overlays to easily add extra files to a packaged releases

  * Allow `RELEASE_DISTRIBUTION` to be set to `none` in order to fully disable distribution

  * Add a built-in `:tar` step that automatically packages releases

See the [full release notes for more improvements](https://github.com/elixir-lang/elixir/releases/tag/v1.10.0).

## Improvements to sort-based APIs in Enum

[`Enum.sort/1`](https://hexdocs.pm/elixir/Enum.html#sort/1) in Elixir by default sorts from lowest to highest:

```elixir
iex> Enum.sort(["banana", "apple", "pineapple"])
["apple", "banana", "pineapple"]
```

If you want to sort from highest to lowest, you need to call `Enum.sort/2` with a custom sorting function, such as `Enum.sort(collection, &>=/2)`, which is not immediately obvious to someone reading the code:

```elixir
iex> Enum.sort(["banana", "apple", "pineapple"], &>=/2)
["pineapple", "banana", "apple"]
```

Furthermore, comparison operators, such as `<=` and `>=`, perform structural sorting, instead of a semantic one. For example, using `>=` to sort dates descendingly won't yield the correct result:

```elixir
iex> Enum.sort([~D[2019-12-31], ~D[2020-01-01]])
[~D[2020-01-01], ~D[2019-12-31]]
```

To perform proper semantic comparison for dates, one would also need to pass a custom sorting function:

```elixir
iex> Enum.sort([~D[2019-12-31], ~D[2020-01-01]], &(Date.compare(&1, &2) != :lt))
[~D[2019-12-31], ~D[2020-01-01]]
```

Elixir v1.10 streamlines the sorting functions by introducing both `:asc` and `:desc` shortcuts:

```elixir
iex> Enum.sort(["banana", "apple", "pineapple"], :asc)
["apple", "banana", "pineapple"]
iex> Enum.sort(["banana", "apple", "pineapple"], :desc)
["pineapple", "banana", "apple"]
```

As well as adding the possibility to pass a module to perform semantic comparisons. For example, to sort dates, one now only needs to pass the `Date` module or even `{:desc, Date}` for descending semantical sort:

```elixir
iex> Enum.sort([~D[2019-12-31], ~D[2020-01-01]], Date)
[~D[2019-12-31], ~D[2020-01-01]]
iex> Enum.sort([~D[2019-12-31], ~D[2020-01-01]], {:desc, Date})
[~D[2020-01-01], ~D[2019-12-31]]
```

These API improvements make the code more concise and readable and they have also been added to `Enum.sort_by`, `Enum.min_by`, `Enum.max_by`, and friends.

### Tracking of compile-time configuration

In Elixir, we organize our code in applications. Libraries, your dependencies, and your own project are all separate applications. All applications in Elixir also come with an application environment.

The application environment is a key-value store that allows us to configure said application. While reading the application environment at runtime is the preferred approach, in some rare occasions you may want to use the application environment to configure the compilation of a certain project. This is often done by calling `Application.get_env/3` outside of a function:

```elixir
defmodule MyApp.DBClient do
  @db_host Application.get_env(:my_app, :db_host, "db.local")

  def start_link() do
    SomeLib.DBClient.start_link(host: @db_host)
  end
end
```

This approach has one big limitation: if you change the value of the application environment after the code is compiled, the value used at runtime is not going to change! For example, if you are using `mix release` and your `config/releases.exs` has:

    config :my_app, :db_host, "db.production"

Because `config/releases.exs` is read after the code is compiled, the new value will have no effect as the code was compiled to connect to "db.local".

Of course, the obvious solution to this mismatch is to not read the application environment at compilation time in the first place, and instead move the code to inside a function:

```elixir
defmodule MyApp.DBClient do
  def start_link() do
    SomeLib.DBClient.start_link(host: db_host())
  end

  defp db_host() do
    Application.get_env(:my_app, :db_host, "db.local")
  end
end
```

While this is the preferred approach, there are still two scenarios we need to address:

  1. Not everyone may be aware of this pitfall, so they will mistakenly read the application environment at compile-time, until they are bitten by this behaviour

  2. In rare occasions, you truly need to read the application environment at compile-time, and you want to be warned when you try to configure at runtime something that is valid only at compilation time

Elixir v1.10 aims to solve these two scenarios by introducing a `Application.compile_env/3` function. For example, to read the value at compile time, you can now do:

```elixir
@db_host Application.compile_env(:my_app, :db_host, "db.local")
```

By using `compile_env/3`, Elixir will store the values used during compilation and compare them with the runtime values whenever your system starts, raising an error in case they differ. This helps developers ensure they are running their production systems with the configuration they intend to.

In future versions, we will deprecate the use `Application.get_env/3` at compile-time with a clear message pointing users to configuration best practices, effectively addressing the scenario where users read from the application environment at compile time unaware of its pitfalls.

### Compiler tracing

This release brings enhancements to the Elixir compiler and adds new capabilities for developers to listen to compilation events.

In previous Elixir versions, Elixir would compile a database of cross references between modules (such as function calls, references, structs, etc) for each project in order to perform all kinds of checks, such as deprecations and undefined functions.

Although this database was not public, developers would still use it to run their own checks against their projects. With time, developers would request more data to be included in the database, which was problematic as Elixir itself did not have a use for the additional data, and the database was not meant to be used externally in the first place.

In Elixir v1.10, we have addressed these problems by [introducing compiler tracing](https://hexdocs.pm/elixir/Code.html#module-compilation-tracers). The compiler tracing allows developers to listen to events as they are emitted by the compiler, so they can store all of the information they need - and only the information they need.

Elixir itself is using the new compiler tracing to provide new functionality. One advantage of this approach is that developers can now disable undefined function warnings directly on the callsite. For example, imagine you have an optional dependency which may not be available in some cases. You can tell the compiler to skip warning on calls to optional modules with:

    @compile {:no_warn_undefined, OptionalDependency}
    defdelegate my_function_call(arg), to: OptionalDependency

Previously, this information had to be added to the overall project configuration, which was far away from where the optional call effectively happened.

### Other enhancements

Elixir's calendar data types got many improvements, such as sigil support for third-party calendars, as well as the additions of [`DateTime.now!/2`](https://hexdocs.pm/elixir/DateTime.html#now!/2), [`DateTime.shift_zone!/3`](https://hexdocs.pm/elixir/DateTime.html#shift_zone!/3), and [`NaiveDateTime.local_now/0`](https://hexdocs.pm/elixir/NaiveDateTime.html#local_now/0).

There are many improvements related to Elixir's AST in this release too. [`Code.string_to_quoted/2`](https://hexdocs.pm/elixir/Code.html#string_to_quoted/2) has two new options, `:token_metadata` and `:literal_encoder`, that give more control over Elixir's parser. This information was already available to the Elixir code formatter and has now been made public. These changes alongside compiler tracing means tools like [Credo](https://github.com/rrrene/credo), [Boundary](https://github.com/sasa1977/boundary), and IDE integrations have an even better foundation to analyze the source code.

[ExUnit](https://hexdocs.pm/ex_unit), our test framework, ships two small but important improvements: `ExUnit.CaptureIO` can now be used by tests that run concurrently and we have added "pattern-matching diffing". To understand the last feature, take this code:

```elixir
assert %{"status" => 200, "body" => %{"key" => "foo"}} = json_payload
```

Now imagine that `json_payload` is a large JSON blob and the `"key"` inside the `"body"` did not have value of `"foo"`. In previous Elixir versions, if the assertion failed, Elixir would print the right side and let you up to your own devices to figure out what went wrong. In Elixir v1.10, we diff the data structure against the pattern so you can see exactly which parts of the data matched the pattern and which ones did not. Note ExUnit already performed diffing when comparing data types, this new version adds diffing when matching data against a pattern.

Finally, this release also adds two new guards, `is_struct/1` and `is_map_key/2`, thanks to the strict requirement on Erlang/OTP 21+.

To learn what else is new, you can read the [full release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.10.0).

Check [the Install section](/install.html) to get Elixir installed and read our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) to learn more.

Have fun!
