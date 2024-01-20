---
layout: post
title: Elixir v1.4 released
author: José Valim
category: Releases
excerpt: Elixir v1.4 brings many improvements to the language, its standard library and the Mix build tool.
---

Elixir v1.4 brings new features, enhancements and bug fixes. The most notable changes are the addition of the `Registry` module, the `Task.async_stream/3` and `Task.async_stream/5` function which aid developers in writing concurrent software, and the new application inference and commands added to Mix.

In this post we will cover the main additions. The complete [release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.4.0) are also available.

## Registry

The [`Registry`](https://hexdocs.pm/elixir/Registry.html) is a new module in Elixir's standard library that allows Elixir developers to implement patterns such as name lookups, code dispatching or even a pubsub system in a simple and scalable way.

Broadly speaking, the Registry is a local, decentralized and scalable key-value process storage. Let's break this in parts:

  * Local because keys and values are only accessible to the current node (opposite to distributed)
  * Decentralized because there is no single entity responsible for managing the registry
  * Scalable because performance scales linearly with the addition of more cores upon partitioning

A registry may have unique or duplicate keys. Every key-value pair is associated to the process registering the key. Keys are automatically removed once the owner process terminates. Starting, registering and looking up keys is quite straight-forward:

```elixir
iex> Registry.start_link(:unique, MyRegistry)
iex> {:ok, _} = Registry.register(MyRegistry, "hello", 1)
iex> Registry.lookup(MyRegistry, "hello")
[{self(), 1}]
```

Finally, huge thanks to [Bram Verburg](https://twitter.com/voltonez) who has performed [extensive benchmarks](https://docs.google.com/spreadsheets/d/1MByRZJMCnZ1wPiLhBEnSRRSuy1QXp8kr27PIOXO3qqg/edit#gid=0) on the registry to show it scales linearly with the number of cores by increasing the number of partitions.

## Syntax coloring

Elixir v1.4 introduces the ability to syntax color inspected data structures and IEx automatically relies on this feature to provide syntax coloring for evaluated shell results:

![IEx coloring](/images/contents/iex-coloring.png)

This behaviour can be configured via the `:syntax_colors` coloring option:

```elixir
IEx.configure [colors: [syntax_colors: [atom: :cyan, string: :green]]]
```

To disable coloring altogether, simply pass an empty list to `:syntax_colors`.

## Task.async_stream

When there is a need to traverse a collection of items concurrently, Elixir developers often resort to tasks:

```elixir
collection
|> Enum.map(&Task.async(SomeMod, :function, [&1]))
|> Enum.map(&Task.await/1)
```

The snippet above will spawn a new task by invoking `SomeMod.function(element)` for every element in the collection and then await for the task results.

However, the snippet above will spawn and run concurrently as many tasks as there are items in the collection. While this may be fine in many occasions, including small collections, sometimes it is necessary to restrict amount of tasks running concurrently, specially when shared resources are involved.

Elixir v1.4 adds `Task.async_stream/3` and `Task.async_stream/5` which brings some of the lessons we learned from [the GenStage project](/blog/2016/07/14/announcing-genstage/) directly into Elixir:

```elixir
collection
|> Task.async_stream(SomeMod, :function, [], max_concurrency: 8)
|> Enum.to_list()
```

The code above will also start the same `SomeMod.function(element)` task for every element in the collection except it will also guarantee we have at most 8 tasks being processed at the same time. You can use `System.schedulers_online` to retrieve the number of cores and balance the processing based on the amount of cores available.

The `Task.async_stream` functions are also lazy, allowing developers to partially consume the stream until a condition is reached. Furthermore, `Task.Supervisor.async_stream/4` and `Task.Supervisor.async_stream/6` can be used to ensure the concurrent tasks are spawned under a given supervisor.

## Application inference

In previous Mix versions, most of your dependencies had to be added both to your dependencies list and applications list. Here is how a `mix.exs` would look like:

```elixir
def application do
  [applications: [:logger, :plug, :postgrex]]
end

def deps do
  [{:plug, "~> 1.2"},
   {:postgrex, "~> 1.0"}]
end
```

This was a common source of confusion and quite error prone as many developers would not list their dependencies in the applications list.

Mix v1.4 now automatically infers your applications list as long as you leave the `:applications` key empty. The `mix.exs` above can be rewritten to:

```elixir
def application do
  [extra_applications: [:logger]]
end

def deps do
  [{:plug, "~> 1.2"},
   {:postgrex, "~> 1.0"}]
end
```

With the above, Mix will automatically build your application list based on your dependencies. Developers now only need to specify which applications shipped as part of Erlang or Elixir that they require, such as `:logger`.

Finally, if there is a dependency you don't want to include in the application runtime list, you can do so by specifying the `runtime: false` option:

    {:distillery, "> 0.0.0", runtime: false}

We hope this feature provides a more streamlined workflow for developers who are building releases for their Elixir projects.

## Mix install from SCM

Mix v1.4 can now install escripts and archives from both Git and Hex, providing you with even more options for distributing Elixir code.

This makes it possible to distribute CLI applications written in Elixir by publishing a package which builds an escript to Hex. [`ex_doc`](https://hex.pm/packages/ex_doc) has been updated to serve as an example of how to use this new functionality.

Simply running:

    mix escript.install hex ex_doc

will fetch `ex_doc` and its dependencies, build them, and then install `ex_doc` to `~/.mix/escripts` (by default). After adding `~/.mix/escripts` to your `PATH`, running `ex_doc` is as simple as:

    ex_doc

You can now also install archives from Hex in this way. Since they are fetched and built on the user's machine, they do not have the same limitations as pre-built archives. However, keep in mind archives are loaded on every Mix command and may conflict with modules or dependencies in your projects. For this reason, escripts is the preferred format for sharing executables.

It is also possible to install escripts and archives by providing a Git/GitHub repo. See `mix help escript.install` and `mix help archive.install` for more details.

## Summing up

The full list of changes is available in our [release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.4.0). Don't forget to check [the Install section](/install.html) to get Elixir installed and our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) to learn more.

Happy coding!
