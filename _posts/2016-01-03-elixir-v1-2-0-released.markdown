---
layout: post
title: Elixir v1.2 released
author: José Valim
category: Releases
excerpt: Elixir v1.2 brings enhancements, bug fixes, performance improvements and more into Elixir.
---

v1.2 brings enhancements, bug fixes, performance improvements and more into Elixir. Elixir v1.2 relies on many features in Erlang 18, requiring at least Erlang 18+. Upgrading to Erlang 18 is therefore necessary before upgrading Elixir.

To celebrate this release and the new year, we have also reviewed both the [Getting Started](https://hexdocs.pm/elixir/introduction.html) and [Mix & OTP](https://hexdocs.pm/elixir/introduction-to-mix.html) guides, bringing it up to date and exploring new functionalities added since Elixir v1.0.

## Erlang 18 support

We have brought many features specific to Erlang 18. Here are the highlights:

  * Maps can now scale from dozens to millions of keys. Therefore, usage of the modules `Dict` and `HashDict` is now discouraged and will be deprecated in future releases, instead use `Map`. Similarly, `Set` and `HashSet` will be deprecated in favor of `MapSet`
  * Compilation times are ~15% faster on average due to improvements in both the Elixir and Erlang compilers and by using maps more extensively in the compilation stack
  * Dialyzer now emits less false negative warnings thanks to new annotations available in the Erlang compiler

## Language improvements

This release includes many notable language improvements.

The first of them was the addition of multi aliases/imports/require. Often developers would write:

```elixir
alias MyApp.Foo
alias MyApp.Bar
alias MyApp.Baz
```

Now it can be written in one line by using the new multi syntax:

```elixir
alias MyApp.{Foo, Bar, Baz}
```

We have also added support for variables in map keys. Now you can write:

```elixir
iex> key = :hello
iex> value = "world"
iex> %{key => value}
%{:hello => "world"}
```

Furthermore, variables can also be used on pattern matching along-side the pin operator:

```elixir
iex> key = :hello
iex> %{^key => value} = %{:hello => "another world"}
iex> value
"another world"
```

Finally, Elixir v1.2 introduces the `with` special form that allows developers to match on multiple expressions concisely. Previously, one would write

```elixir
case File.read("my_file.ex") do
  {:ok, contents} ->
    case Code.eval_string(contents) do
      {res, _binding} ->
        {:ok, res}
      error ->
        error
  error -> error
    error
end
```

such can now be rewritten as

```elixir
with {:ok, contents} <- File.read("my_file.ex"),
     {res, binding} <- Code.eval_string(contents),
     do: {:ok, res}
```

`with` will match each left side of `<-` against the right side, executing expressions until one of those match fails or until the `do: expression` is performed. In case a match fails, the non-matching result is returned.

These improvements aim to make the language more consistent and expressive.

## Getting started experience

We have also improved both the parser and compiler to be more aware of language constructs, emitting warnings on common pitfalls like when piping to expressions without parentheses or when defining unsafe variables. Such improvements will point developers to the more idiomatic way of writing Elixir code early on.

Elixir v1.2 also introduces the `i/1` helper in IEx, which allows developers to retrieve information about any data type. This will help newcomers explore the language values while providing experienced developers with crucial information about the value they are introspecting. For example, giving a PID to `i/1` will show if it has a registered name, linked processes and more. Giving it a module, like `i(String)`, shows compile-time information and others.

All of those improvements tie nicely with our updates to the Getting Started guide, ensuring learning Elixir is more fun and efficient than ever before.

## Workflow improvements

One of Elixir goals is to build upon the abstractions provided by Erlang/OTP and make them more productive by focusing on the tooling aspect.

One of such efforts resulted in "Umbrella Projects", which allows developers to build multiple applications side-by-side, but still run and test them in isolation when desired. Because each application contains its own configuration, supervision tree and initialization cycle, this gives developers the proper mechanisms to break monolithic applications apart without introducing the complexity of managing multiple, different repositories.

Up to this release, umbrella applications shared mostly dependencies, which meant each application still had their own build directory and their own compilation cycle. Elixir v1.2 allows developers to also share both build and configuration files. This change allows teams to drastically reduce compilation times in umbrella projects by adding the following configuration to each umbrella app's `mix.exs` file:

```elixir
build_path: "../../_build",
config_path: "../../config/config.exs",
```

Umbrella applications generated with Elixir v1.2 will by default include this configuration. The downside of this approach is that applications are a bit less isolated, since configuration is now shared across all projects, although developers can revert back to the previous behaviour by simply removing the flags above.

Finally, Mix will now consolidate protocols by default as we are now able to consolidate in parallel and cache the consolidation results, providing the best performance across all environments without affecting compilation times.

These are great additions on top of the faster compilation times we have achieved when migrating to Erlang 18.

## Rebar 3 support

With Rebar 3 gaining more adoption in the Erlang community, Mix is now able to fetch and compile Rebar 3 dependencies. This feature is currently experimental and therefore opt-in: if you have a Rebar 3 dependency, you can ask Mix to use Rebar 3 to compile it by passing the `manager: :rebar3` option. Once configured, Mix will prompt you to install Rebar 3 if it is not yet available.

The full list of changes is available in our [release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.2.0). Don't forget to check [the Install section](/install.html) to get Elixir installed and our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) to learn more.

Happy coding!
