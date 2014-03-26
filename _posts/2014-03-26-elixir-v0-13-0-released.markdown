---
layout: post
title: Elixir v0.13.0 released
author: José Valim
category: Releases
excerpt: Elixir v0.13.0 comes with the biggest changes to the language since it was first released: maps, structs, comprehensiona and more. But don't worry, many changes will take effect over a series of releases in order to avoid breaking changes
---

Hello folks!

Elixir v0.13.0 has been released promoting the biggest changes to the language since it was first released. On this blog post, we are going to cover some of those changes and the road to Elixir v1.0. In a nutshell, here is what new:

* Elixir now runs on and requires Erlang R17;

* The [Getting Started guide](http://elixir-lang.org/getting_started/1.html) was rewritten from scratch. The previous guide was comprised of 7 chapters and was about to become 2 years old. The new guide features 20 chapters, exploring the new maps and structs as part of this release, going deeper into topics like IO and File handling, as well as an extra guide, still in development, about [Meta-Programming in Elixir](http://elixir-lang.org/getting_started/meta/1.html);

* With Erlang R17, Elixir also adds support for maps, which are key-value data structures that supports pattern matching. We'll explore maps, their features and limitations in this post;

* Elixir v0.13 also provides structs, an alternative to Elixir records. Structs are more flexible than records, provide faster polymorphic operations, and still provide the same compile-time guarantees many came to love in records;

* Elixir v0.13 provides a new comprehension syntax that not only works with lists, but with any [`Enumerable`](/docs/stable/Enumerable.html). The output of a comprehension is also extensible via the [`Collectable`](/docs/stable/Collectable.html) protocol;

* Mix, Elixir's build tool, has been improved in order to provide better workflows when compiling projects and working with dependencies;

* There are many other changes, like the [StringIO](/docs/stable/StringIO.html), support for [tags and filters in ExUnit](/docs/stable/ExUnit.Case.html) and more. Please check the [CHANGELOG](https://github.com/elixir-lang/elixir/blob/v0.13.0/CHANGELOG.md) for the complete list.

Keep in mind that some of the major changes described here were and will continue to be applied throughout a series of releases to avoid breaking changes. In fact, Elixir v0.13.0 is completely compatible with Elixir v0.12.5 and upgrading should be a clean process.

## Maps

Maps are key-value data structures:

```iex
iex> map = %{"hello" => :world}
%{"hello" => :world}
iex> map["hello"]
:world
iex> map[:other]
nil
```

Maps do not have a explicit ordering and keys and values can be any term.

Maps can be pattern matched on:

```iex
iex> %{"hello" => world} = map
%{"hello" => :world}
iex> world
:world
iex> %{} = map
%{"hello" => :world}
iex> %{"other" => value} = map
** (MatchError) no match of right hand side value
```

A map pattern will match any map that has the given keys and values. For example, `%{"hello" => world}` will match any map that has the key `"hello"`. An empty map therefore matches all maps.

Developers can use the functions in the [`Map` module](/docs/stable/Map.html) to work with maps. For more information on maps and how they compare to other associative data structures in the language, please check the [Maps chapter in our new Getting Started guide](/getting_started/7.html). Elixir Sips has also released two episodes that cover maps ([part 1](http://elixirsips.com/episodes/054_maps_part_1.html) and [part 2](http://elixirsips.com/episodes/055_maps_part_2.html)).

Finally, maps also provide special syntax for creating, accessing and updating maps with atom keys:

```iex
iex> user = %{name: "josé", age: 27}
%{name: "josé", age: 27}
iex> user.name
"josé"
iex> user = %{user | name: "eric"}
%{name: "eric", age: 27}
iex> user.name
"eric"
```

Both access and update syntax above expect the given keys to exist. Trying to access or update a key that does not exist raises an error:

```iex
iex> %{ user | address: [] }
** (ArgumentError) argument error
     :maps.update(:address, [], %{})
```

As we will see, this functionality becomes very useful when discussing structs.

## Structs

Structs are meant to replace Elixir records. Records in Elixir are simply tuples supported by modules which store record metadata:

```elixir
defrecord User, name: nil, age: 0
```

Internally, this record is represeted as the following tuple:

```elixir
# {tag, name, age}
{User, nil, 0}
```

Records can also be created and pattern matched on:

```elixir
iex> user = User[name: "josé"]
User[name: "josé", age: 0]
iex> user.name
"josé"
iex> User[name: name] = user
User[name: "josé", age: 0]
iex> name
"josé"
```

However, records came with their own issues. First of all, since records were made of data (the underlying tuple) and a module (functions/behaviour), they were frequently misused as an attempt to write "Object Oriented" code in Elixir, for example:

```elixir
defrecord User, name: nil, age: 0 do
  def first_name(self) do
    self.name |> String.split |> Enum.at(0)
  end
end

User["josé valim"].first_name #=> "josé"
```

Not only that, when used in protocols for polymorphic dispatch, records were often slow because we had to check every tuple if it was an actual record or not.

Since maps are meant to replace many cases of records in Erlang, we saw with the introduction of maps the perfect opportunity to revisit Elixir records as well. In order to understand the reasoning behind structs, let's list the features we got from records:

1. A way to organize data by fields
2. Efficient in-memory representation and operations
3. Compile-time structures with compile-time errors
4. The basic foundation for polymorphism in Elixir

Maps naturally solve issues `1.` and `2.` above. In particular, maps that have same keys share the same key-space in memory. That's why the update operation `%{map | ...}` we have seen above is relevant: if we know we are updating an existing key, the new map created as result of the update operation can share the same key space as the old map. For more details on why Maps are efficient, I would recommend [reading Joe's blog post on the matter](http://joearms.github.io/2014/02/01/big-changes-to-erlang.html).

Structs address features `3.` and `4.` as follows. A struct needs to be explicitly defined via `defstruct`:

```elixir
defmodule User do
  defstruct name: nil, age: 0
end
```

Now a `User` struct can be created without a need to explicitly list all necessary fields:

```elixir
iex> user = %User{name: "josé"}
%User{name: "josé", age: 0}
```

Trying to create a struct with an unknown key raises an error during compilation:

```elixir
iex> user = %User{address: []}
** (CompileError) unknown key :unknown for struct User
```

Furthermore, every struct has a `__struct__` field which contains the struct name:

```elixir
iex> user.__struct__
User
```

Now, everytime there is a protocol dispatch, the protocol mechanism searches for the `__struct__` tag in order to do a polymorphic dispatch.

It is interesting to note that structs solve both drawbacks we have earlier mentioned regarding records. Structs do not support the Object Oriented style of programming that was possible with records. Furthermore, polymorphic dispatch is now faster and more robust, because polymorphic dispatch only happens for explicitly tagged structs.

For more information on structs, check out the [Structs chapter in the getting started guide](/getting_started/15.html) (you may also want to read the new Protocols chapter after it).

## Maps, structs and the future

With the introduction of maps and structs, some deprecations will be landing on master. First of all, the `ListDict` data structure is being deprecated and phased out. Records are also being deprecated from the language, although it is going to be a longer processes, as many projects and Elixir itself still uses records in many occasions.

Note though, only Elixir records are being deprecated, i.e. records backed by a module. Erlang records, which are basically syntax sugar around tuples, will remain in the language for the cases Elixir developers need to interact with Erlang libraries that provide records. We expect though such cases to be rare, as records will become less common even in Erlang itself. For this reason, the new getting started guide does not even mention records.

Finally, structs are still in active development and new features, like `@derive`, should land in upcoming Elixir releases. For those interested, the [original maps and structs proposal is still availble](https://gist.github.com/josevalim/b30c881df36801611d13).

## Comprehensions

Erlang R17 also introduced recursion to anonymous functions. This feature, while still not available from Elixir, allows Elixir to provide a more flexible and extensible comprehensions syntax.

The most common use case of a comprehensions are list comprehensions. We can get all the square values of elements in a list as follows:

```iex
iex> for n <- [1, 2, 3, 4], do: n * n
[1, 4, 9, 16]
```

We say the `n <- [1, 2, 3, 4]` part is a comprehension generator. In previous Elixir versions, Elixir supported only lists in generators. In Elixir v0.13, any Enumerable is supported:

```iex
iex> for n <- 1..4, do: n * n
[1, 4, 9, 16]
```

As in previous Elixir versions, there is also support for a bitstring generator. In the example below, we receive a stream of RGB pixels as a binary and break it down into triplets:

```iex
iex> pixels = <<213, 45, 132, 64, 76, 32, 76, 0, 0, 234, 32, 15>>
iex> for <<r::8, g::8, b::8 <- pixels>>, do: {r, g, b}
[{213,45,132},{64,76,32},{76,0,0},{234,32,15}]
```

By default, a comprehension returns a list as a result. However, the result of a comprehension can be inserted into different data structures by passing the `:into` option. For example, we can use bitstring generators with the `:into` option to easily remove all spaces in a string:

```iex
iex> for <<c <- " hello world ">>, c != ?\s, into: "", do: <<c>>
"helloworld"
```

Sets, maps and other dictionaries can also be given with the `:into` option. In general, the `:into` accepts any structure as long as it implements the [`Collectable` protocol](/docs/stable/Collectable.html).

For example, the `IO` module provides streams, that are both `Enumerable` and `Collectable`. You can implement an echo terminal that returns whatever is typed, but in upcase, using comprehensions:

```iex
iex> stream = IO.stream(:stdio, :line)
iex> for line <- stream, into: stream do
...>   String.upcase(line) <> "\n"
...> end
```

This makes comprehensions useful not only for working with in-memory collections but also files and other sources. In future releases, we will continue exploring how to make comprehensions more expressive, following the foot steps of many functional programming research on the topic.

## Mix workflows

The last big change we want to discuss in this release are the improvements done to Mix, Elixir's build tool. Mix is an essential tool to Elixir developers, it helps developers to compile their projects, manage their dependencies, run tests and so on. 

In previous releases, Mix was used to download and compile dependencies per environment. That meant the every day workflow was less than ideal: every time a dependency was updated, when swapping in between development and test environments, developers had to fetch the dependencies for each environment in distinct steps. The workflow would be something like:

```
$ mix deps.get
$ mix compile
$ MIX_ENV=test mix deps.get
$ mix test
```

In Elixir v0.13, `mix deps.get` only fetches dependencies and it does so accross all environments (unless an `--only` flag is specified). To support this new change of behaviour, dependencies now support the `:only` option:

```elixir
def deps do
  [{:ecto, github: "elixir-lang/ecto"},
   {:hackney, github: "benoitc/hackney", only: [:test]}]
end
```

Dependencies are now automatically compiled before you run a command. For example, `mix compile` will automatically compile pending dependencies for the current environment. `mix test` will do the same for test dependencies. In fact, if you pass an external command to Mix, like `mix ecto.migrate`, Mix will compile pending dependencies in case the command exists in any of the to-be-compiled dependencies.

## The next steps

As seen in this announcement, this release dictates many of the developments that will happen in Elixir and its community in the following weeks. All projects are recommended to start moving from records to structs, paving the way for the deprecation of records before 1.0.

The next months will also focus on integrating Elixir more tightly to OTP. During the keynote at Erlang Factory, [Catalyse Change](http://www.youtube.com/watch?v=Djv4C9H9yz4), Dave Thomas and I argued that are many useful patterns, re-implemented everyday by developers, that can make development more productive within the Erlang VM if exposed accordingly.

That said, in the next months we plan to:

* Integrate applications configuration (provided by OTP) right into Mix;
* Provide an Elixir logger that knows how to print and format Elixir exceptions and stacktraces;
* Properly expose the functionality provided by Applications, Supervisors, GenServers and GenEvents and study how they can integrate with Elixir. For example, how to consume events from GenEvent as a [stream of data](/docs/stable/Stream.html)?
* Study how patterns like tasks and agents can be integrated into the language, often picking up the lessons learned by libraries like [e2](http://e2project.org/erlang.html) and [functionality exposed by OTP itself](http://erlang.org/doc/man/rpc.html);
* Rewrite the Mix and ExUnit guides to focus on applications and OTP as a whole, rebranding it to "Building Apps with Mix and OTP";

You can learn more about Elixir in our [Getting Started guide](/getting_started/1.html) and download this release in the [v0.13 announcement](https://github.com/elixir-lang/elixir/releases/tag/v0.13.0).