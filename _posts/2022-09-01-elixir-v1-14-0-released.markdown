---
layout: post
title: Elixir v1.14 released
author: Andrea Leopardi
category: Releases
excerpt: Elixir v1.14 is out with a focus on debugging and developer experience
---

Elixir v1.14 has just been released. 🎉

Let's check out new features in this release. Like many of the past Elixir releases, this one has a strong focus on developer experience and developer happiness, through improvements to debugging, new debugging tools, and improvements to term inspection. Let's take a quick tour.

Note: this announcement contains [asciinema](https://asciinema.org) snippets. You may need to enable 3rd-party JavaScript on this site in order to see them. If JavaScript is disabled, `noscript` tags with the proper links will be shown.

## `dbg`

[`Kernel.dbg/2`](https://hexdocs.pm/elixir/Kernel.html#dbg/2) is a new macro that's somewhat similar to [`IO.inspect/2`](https://hexdocs.pm/elixir/IO.html#inspect/2), but specifically tailored for **debugging**.

When called, it prints the value of whatever you pass to it, plus the debugged code itself as well as its location.

<script id="asciicast-510632" src="https://asciinema.org/a/510632.js" async></script><noscript><p><a href="https://asciinema.org/a/510632">See the example in asciinema</a></p></noscript>

`dbg/2` can do more. It's a macro, so it *understands Elixir code*. You can see that when you pass a series of `|>` pipes to it. `dbg/2` will print the value for every step of the pipeline.

<script id="asciicast-509506" src="https://asciinema.org/a/509506.js" async></script><noscript><p><a href="https://asciinema.org/a/509506">See the example in asciinema</a></p></noscript>

## IEx + dbg

Interactive Elixir (IEx) is Elixir's shell (also known as REPL). In v1.14, we have improved IEx breakpoints to also allow line-by-line stepping:

<script id="asciicast-508048" src="https://asciinema.org/a/508048.js" async></script><noscript><p><a href="https://asciinema.org/a/508048">See the example in asciinema</a></p></noscript>

We have also gone one step further and integrated this new functionality with `dbg/2`.

`dbg/2` supports **configurable backends**. IEx automatically replaces the default backend by one that halts the code execution with IEx:

<script id="asciicast-509507" src="https://asciinema.org/a/509507.js" async></script><noscript><p><a href="https://asciinema.org/a/509507">See the example in asciinema</a></p></noscript>

We call this process "prying", as you get access to variables and imports, but without the ability to change how the code actually executes.

This also works with pipelines: if you pass a series of `|>` pipe calls to `dbg` (or pipe into it at the end, like `|> dbg()`), you'll be able to step through every line in the pipeline.

<script id="asciicast-509509" src="https://asciinema.org/a/509509.js" async></script><noscript><p><a href="https://asciinema.org/a/509509">See the example in asciinema</a></p></noscript>

You can keep the default behavior by passing the `--no-pry` option to IEx.

## dbg in Livebook

[Livebook](https://livebook.dev/) brings the power of computation notebooks to Elixir.

As an another example of the power behind `dbg`, the Livebook team has implemented a visual representation for `dbg` as a backend, where it prints each step of the pipeline as its distinct UI element. You can select an element to see its output or even re-order and disable sections of the pipeline on the fly:

<video src="https://user-images.githubusercontent.com/17034772/187455667-b166ce50-c440-444c-94dc-e2c0280a4924.webm" data-canonical-src="https://user-images.githubusercontent.com/17034772/187455667-b166ce50-c440-444c-94dc-e2c0280a4924.webm" controls="controls" muted="muted" style="max-height:640px;"></video>

## PartitionSupervisor

[`PartitionSupervisor`](https://hexdocs.pm/elixir/PartitionSupervisor.html) implements a new supervisor type. It is designed to help when you have a single supervised process that becomes a bottleneck. If that process' state can be easily partitioned, then you can use `PartitionSupervisor` to supervise multiple isolated copies of that process running concurrently, each assigned its own partition.

For example, imagine you have a `ErrorReporter` process that you use to report errors to a monitoring service.

```elixir
# Application supervisor:
children = [
  # ...,
  ErrorReporter
]

Supervisor.start_link(children, strategy: :one_for_one)
```

As the concurrency of your application goes up, the `ErrorReporter` process might receive requests from many other processes and eventually become a bottleneck. In a case like this, it could help to spin up multiple copies of the `ErrorReporter` process under a `PartitionSupervisor`.

```elixir
# Application supervisor
children = [
  {PartitionSupervisor, child_spec: ErrorReporter, name: Reporters}
]
```

The `PartitionSupervisor` will spin up a number of processes equal to `System.schedulers_online()` by default (most often one per core). Now, when routing requests to `ErrorReporter` processes we can use a `:via` tuple and route the requests through the partition supervisor.

```elixir
partitioning_key = self()
ErrorReporter.report({:via, PartitionSupervisor, {Reporters, partitioning_key}}, error)
```

Using `self()` as the partitioning key here means that the same process will always report errors to the same `ErrorReporter` process, ensuring a form of back-pressure. You can use any term as the partitioning key.

### A common example

A common and practical example of a good use case for `PartitionSupervisor` is partitioning something like a `DynamicSupervisor`. When starting many processes under it, a dynamic supervisor can be a bottleneck, especially if said processes take a long time to initialize. Instead of starting a single `DynamicSupervisor`, you can start multiple:

```elixir
children = [
  {PartitionSupervisor, child_spec: DynamicSupervisor, name: MyApp.DynamicSupervisors}
]

Supervisor.start_link(children, strategy: :one_for_one)
```

Now you start processes on the dynamic supervisor for the right partition. For instance, you can partition by PID, like in the previous example:

```elixir
DynamicSupervisor.start_child(
  {:via, PartitionSupervisor, {MyApp.DynamicSupervisors, self()}},
  my_child_specification
)
```

## Improved errors on binaries and evaluation

Erlang/OTP 25 improved errors on binary construction and evaluation. These improvements apply to Elixir as well. Before v1.14, errors when constructing binaries would often be hard-to-debug, generic "argument errors". Erlang/OTP 25 and Elixir v1.14 provide more detail for easier debugging. This work is part of [EEP 54](https://www.erlang.org/eeps/eep-0054).

Before:

```elixir
int = 1
bin = "foo"
int <> bin
#=> ** (ArgumentError) argument error
```

Now:

```elixir
int = 1
bin = "foo"
int <> bin
#=> ** (ArgumentError) construction of binary failed:
#=>    segment 1 of type 'binary':
#=>    expected a binary but got: 1
```

Code evaluation (in IEx and Livebook) has also been improved to provide better error reports and stacktraces.

## Slicing with Steps

Elixir v1.12 introduced **stepped ranges**, which are ranges where you can specify the "step":

```elixir
Enum.to_list(1..10//3)
#=> [1, 4, 7, 10]
```

Stepped ranges are particularly useful for numerical operations involving vectors and matrices (see [Nx](https://github.com/elixir-nx/nx), for example). However, the Elixir standard library was not making use of stepped ranges in its APIs. Elixir v1.14 starts to take advantage of steps with support for stepped ranges in a couple of functions. One of them is [`Enum.slice/2`](https://hexdocs.pm/elixir/Enum.html#slice/2):

```elixir
letters = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"]
Enum.slice(letters, 0..5//2)
#=> ["a", "c", "e"]
```

[`binary_slice/2`](https://hexdocs.pm/elixir/Kernel.html#binary_slice/2) (and [`binary_slice/3`](https://hexdocs.pm/elixir/Kernel.html#binary_slice/3) for completeness) has been added to the `Kernel` module, that works with bytes and also support stepped ranges:

```elixir
binary_slice("Elixir", 1..5//2)
#=> "lxr"
```

## Expression-based Inspection and `Inspect` Improvements

In Elixir, it's conventional to implement the `Inspect` protocol for opaque structs so that they're inspected with a special notation, resembling this:

```elixir
MapSet.new([:apple, :banana])
#MapSet<[:apple, :banana]>
```

This is generally done when the struct content or part of it is private and the `%name{...}` representation would reveal fields that are not part of the public API.

The downside of the `#name<...>` convention is that *the inspected output is not valid Elixir code*. For example, you cannot copy the inspected output and paste it into an IEx session.

Elixir v1.14 changes the convention for some of the standard-library structs. The `Inspect` implementation for those structs now returns a string with a valid Elixir expression that recreates the struct when evaluated. In the `MapSet` example above, this is what we have now:

```elixir
fruits = MapSet.new([:apple, :banana])
MapSet.put(fruits, :pear)
#=> MapSet.new([:apple, :banana, :pear])
```

The `MapSet.new/1` expression evaluates to exactly the struct that we're inspecting. This allows us to hide the internals of `MapSet`, while keeping it as valid Elixir code. This expression-based inspection has been implemented for `Version.Requirement`, `MapSet`, and `Date.Range`.

Finally, we have improved the `Inspect` protocol for structs so that fields are inspected in the order they are declared in `defstruct`. The option `:optional` has also been added when deriving the `Inspect` protocol, giving developers more control over the struct representation. See [the updated documentation for `Inspect`](https://hexdocs.pm/elixir/Inspect.html) for a general rundown on the approaches and options available.

## Learn more

For a complete list of all changes, see the [full release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.14.0).

Check [the Install section](/install.html) to get Elixir installed and read our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) to learn more.

Happy debugging!
