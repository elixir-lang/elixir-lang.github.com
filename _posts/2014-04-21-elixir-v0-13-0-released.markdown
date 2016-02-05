---
layout: post
title: Elixir v0.13.0 released, hex.pm and ElixirConf announced
author: José Valim
category: Releases
excerpt: "Elixir v0.13.0 comes with substantial improvements to the language: maps, structs, comprehensiona and more. It also marks the announcement of the hex.pm package manager and the announcment of ElixirConf!"
---

Hello folks!

Elixir v0.13.0 has been released. It contains changes that will effectively shape how developers will write Elixir code from now on, making it an important milestone towards v1.0! On this post we are going to cover some of those changes, the road to Elixir v1.0, as well as the announcement of [hex.pm](https://hex.pm).

Before we go into the changes, let's briefly talk about ElixirConf!

## ElixirConf

We are excited to announce [ElixirConf](http://elixirconf.com), the first ever Elixir conference, happening July 25-26, 2014 in Austin, TX. The Call For Proposals is open and we are waiting for your talks!

The registration is also open and we hope you will join us on this exciting event. We welcome Elixir developers and enthusiasts that are looking forward to be part of our thrilling community!

## Summary

In a nutshell, here is what new:

* Elixir now runs on and requires Erlang R17;

* With Erlang R17, Elixir also adds support for maps, which are key-value data structures that supports pattern matching. We'll explore maps, their features and limitations in this post;

* Elixir v0.13 also provides structs, an alternative to Elixir records. Structs are more flexible than records, provide faster polymorphic operations, and still provide the same compile-time guarantees many came to love in records;

* The [Getting Started guide](/getting-started/introduction.html) was rewritten from scratch. The previous guide was comprised of 7 chapters and was about to become 2 years old. The new guide features 20 chapters, it explores the new maps and structs (which are part of this release), and it goes deeper into topics like IO and File handling. It also includes an extra guide, still in development, about [Meta-Programming in Elixir](/getting-started/meta/quote-and-unquote.html);

* Elixir v0.13 provides a new comprehension syntax that not only works with lists, but with any [`Enumerable`](/docs/stable/elixir/Enumerable.html). The output of a comprehension is also extensible via the [`Collectable`](/docs/stable/elixir/Collectable.html) protocol;

* Mix, Elixir's build tool, has been improved in order to provide better workflows when compiling projects and working with dependencies;

* There are many other changes, like the addition of [StringIO](/docs/stable/elixir/StringIO.html), support for [tags and filters in ExUnit](/docs/stable/ex_unit/ExUnit.Case.html) and more. Please check the [CHANGELOG](https://github.com/elixir-lang/elixir/blob/v0.13.0/CHANGELOG.md) for the complete list.

Even with all those improvements, Elixir v0.13.0 is backwards compatible with Elixir v0.12.5 and upgrading should be a clean process.

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

A map pattern will match any map that has all the keys specified in the pattern. The values for the matching keys must also match. For example, `%{"hello" => world}` will match any map that has the key `"hello"` and assign the value to `world`, while `%{"hello" => "world"}` will match any map that has the key `"hello"` with value equals to `"world"`. An empty map pattern (`%{}`) will match all maps.

Developers can use the functions in the [`Map` module](/docs/stable/elixir/Map.html) to work with maps. For more information on maps and how they compare to other associative data structures in the language, please check the [Maps chapter in our new Getting Started guide](/getting-started/keywords-and-maps.html). Elixir Sips has also released two episodes that cover maps ([part 1](http://elixirsips.com/episodes/054_maps_part_1.html) and [part 2](http://elixirsips.com/episodes/055_maps_part_2.html)).

Maps also provide special syntax for creating, accessing and updating maps with atom keys:

```iex
iex> user = %{name: "john", age: 27}
%{name: "john", age: 27}
iex> user.name
"john"
iex> user = %{user | name: "meg"}
%{name: "meg", age: 27}
iex> user.name
"meg"
```

Both access and update syntax above expect the given keys to exist. Trying to access or update a key that does not exist raises an error:

```iex
iex> %{ user | address: [] }
** (ArgumentError) argument error
     :maps.update(:address, [], %{})
```

As we will see, this functionality becomes very useful when working with structs.

## Structs

Structs are meant to replace Elixir records. Records in Elixir are simply tuples supported by modules which store record metadata:

```elixir
defrecord User, name: nil, age: 0
```

Internally, this record is represented as the following tuple:

```elixir
# {tag, name, age}
{User, nil, 0}
```

Records can also be created and pattern matched on:

```iex
iex> user = User[name: "john"]
User[name: "john", age: 0]
iex> user.name
"john"
iex> User[name: name] = user
User[name: "john", age: 0]
iex> name
"john"
```

Pattern matching works because the record meta-data is stored in the User module which can be accessed when building patterns.

However, records came with their own issues. First of all, since records were made of data (the underlying tuple) and a module (functions/behaviour), they were frequently misused as an attempt to bundle data and behaviour together in Elixir, for example:

```elixir
defrecord User, name: nil, age: 0 do
  def first_name(self) do
    self.name |> String.split |> Enum.at(0)
  end
end

User[name: "john doe"].first_name #=> "john"
```

Not only that, records were often slow in protocol dispatches because every tuple can potentially be a record, sometimes leading to expensive checks at runtime.

Since maps are meant to replace many cases of records in Erlang, we saw with the introduction of maps the perfect opportunity to revisit Elixir records as well. In order to understand the reasoning behind structs, let's list the features we got from Elixir records:

1. A way to organize data by fields
2. Efficient in-memory representation and operations
3. Compile-time structures with compile-time errors
4. The basic foundation for polymorphism in Elixir

Maps naturally solve issues `1.` and `2.` above. In particular, maps that have same keys share the same key-space in memory. That's why the update operation `%{map | ...}` we have seen above is relevant: if we know we are updating an existing key, the new map created as result of the update operation can share the same key space as the old map without extra checks. For more details on why Maps are efficient, I would recommend [reading Joe's blog post on the matter](http://joearms.github.io/2014/02/01/big-changes-to-erlang.html).

Structs were added to address features `3.` and `4.`. A struct needs to be explicitly defined via `defstruct`:

```elixir
defmodule User do
  defstruct name: nil, age: 0
end
```

Now a `User` struct can be created without a need to explicitly list all necessary fields:

```iex
iex> user = %User{name: "john"}
%User{name: "john", age: 0}
```

Trying to create a struct with an unknown key raises an error during compilation:

```iex
iex> user = %User{address: []}
** (CompileError) unknown key :address for struct User
```

Furthermore, every struct has a `__struct__` field which contains the struct name:

```iex
iex> user.__struct__
User
```

The `__struct__` field is also used for polymorphic dispatch in protocols, addressing issue `4.`.

It is interesting to note that structs solve both drawbacks we have earlier mentioned regarding records. Structs are purely data and polymorphic dispatch is now faster and more robust as it happens only for explicitly tagged structs.

For more information on structs, check out the [Structs chapter in the getting started guide](/getting-started/structs.html) (you may also want to read the new [Protocols chapter](/getting-started/protocols.html) after it).

## Maps, structs and the future

With the introduction of maps and structs, some deprecations will arrive on upcoming releases. First of all, the `ListDict` data structure is being deprecated and phased out. Records are also being deprecated from the language, although it is going to be a longer process, as many projects and Elixir itself still use records in diverse occasions.

Note though only Elixir records are being deprecated. Erlang records, which are basically syntax sugar around tuples, will remain in the language for the rare cases Elixir developers need to interact with Erlang libraries that provide records. In particular, the [Record](/docs/stable/elixir/Record.html) has been updated to provide the new Record API (while keeping the old one for backwards compatibility).

Finally, structs are still in active development and new features, like `@derive`, should land in upcoming Elixir releases. For those interested, the [original maps and structs proposal is still availble](https://gist.github.com/josevalim/b30c881df36801611d13).

## Comprehensions

Erlang R17 also introduced recursion to anonymous functions. This feature, while still not available from Elixir, allows Elixir to provide a more flexible and extensible comprehension syntax.

The most common use case of a comprehension are [list comprehensions](https://en.wikipedia.org/wiki/List_comprehension). For example, we can get all the square values of elements in a list as follows:

```iex
iex> for n <- [1, 2, 3, 4], do: n * n
[1, 4, 9, 16]
```

We say the `n <- [1, 2, 3, 4]` part is a comprehension generator. In previous Elixir versions, Elixir supported only lists in generators. In Elixir v0.13.0, any Enumerable is supported (ranges, maps, etc):

```iex
iex> for n <- 1..4, do: n * n
[1, 4, 9, 16]
```

As in previous Elixir versions, there is also support for a bitstring generator. In the example below, we receive a stream of RGB pixels as a binary and break it down into triplets:

```iex
iex> pixels = <<213, 45, 132, 64, 76, 32, 76, 0, 0, 234, 32, 15>>
iex> for <<r::8, g::8, b::8 <- pixels>>, do: {r, g, b}
[{213,45,132}, {64,76,32}, {76,0,0}, {234,32,15}]
```

By default, a comprehension returns a list as a result. However the result of a comprehension can be inserted into different data structures by passing the `:into` option. For example, we can use bitstring generators with the `:into` option to easily remove all spaces in a string:

```iex
iex> for <<c <- " hello world ">>, c != ?\s, into: "", do: <<c>>
"helloworld"
```

Sets, maps and other dictionaries can also be given with the `:into` option. In general, the `:into` accepts any structure as long as it implements the [`Collectable` protocol](/docs/stable/elixir/Collectable.html).

For example, the `IO` module provides streams, that are both `Enumerable` and `Collectable`. You can implement an echo terminal that returns whatever is typed into the shell, but in upcase, using comprehensions:

```iex
iex> stream = IO.stream(:stdio, :line)
iex> for line <- stream, into: stream do
...>   String.upcase(line) <> "\n"
...> end
```

This makes comprehensions useful not only for working with in-memory collections but also with files, io devices, and other sources. In future releases, we will continue exploring how to make comprehensions more expressive, following in the footsteps of other functional programming research on the topic (like Comprehensive Comprehensions and Parallel Comprehensions).

## Mix workflows

The last big change we want to discuss in this release are the improvements done to Mix, Elixir's build tool. Mix is an essential tool to Elixir developers and helps developers to compile their projects, manage their dependencies, run tests and so on.

In previous releases, Mix was used to download and compile dependencies per environment. That meant the usual workflow was less than ideal: every time a dependency was updated, developers had to explicitly fetch and compile the dependencies for each environment. The workflow would be something like:

```bash
$ mix deps.get
$ mix compile
$ MIX_ENV=test mix deps.get
$ mix test
```

In Elixir v0.13, `mix deps.get` only fetches dependencies and it does so accross all environments (unless an `--only` flag is specified). To support this new behaviour, dependencies now support the `:only` option:

```elixir
def deps do
  [{:ecto, github: "elixir-lang/ecto"},
   {:hackney, github: "benoitc/hackney", only: [:test]}]
end
```

Dependencies now are also automatically compiled before you run a command. For example, `mix compile` will automatically compile pending dependencies for the current environment. `mix test` will do the same for test dependencies and so on, interrupting less the developer workflow.

## hex.pm

This release also marks the announcement of [hex.pm](https://hex.pm/), a package manager for the Erlang VM. Hex allows you to package and publish your projects while fetching them and performing dependency resolution in your applications.

Currently Hex only integrates with Mix and contributions to extend it to other tools and other languages in the Erlang VM are welcome!

## The next steps

As seen in this announcement, this release dictates many of the developments that will happen in Elixir and its community in the following weeks. All projects are recommended to start moving from records to structs, paving the way for the deprecation of records before 1.0.

The next months will also focus on integrating Elixir more tightly to OTP. During the keynote at Erlang Factory, [Catalyse Change](https://www.youtube.com/watch?v=Djv4C9H9yz4), Dave Thomas and I argued that there are many useful patterns, re-implemented everyday by developers, that could make development more productive within the Erlang VM if exposed accordingly.

That said, in the next months we plan to:

* Integrate applications configuration (provided by OTP) right into Mix;
* Provide an Elixir logger that knows how to print and format Elixir exceptions and stacktraces;
* Properly expose the functionality provided by Applications, Supervisors, GenServers and GenEvents and study how they can integrate with Elixir. For example, how to consume events from GenEvent as a [stream of data](/docs/stable/elixir/Stream.html)?
* Study how patterns like tasks and agents can be integrated into the language, often picking up the lessons learned by libraries like [e2](http://e2project.org/erlang.html) and [functionality exposed by OTP itself](http://www.erlang.org/doc/man/rpc.html);
* Rewrite the Mix and ExUnit guides to focus on applications and OTP as a whole, rebranding it to "Building Apps with Mix and OTP";

You can learn more about Elixir in our [Getting Started guide](/getting-started/introduction.html) and download this release in the [v0.13 announcement](https://github.com/elixir-lang/elixir/releases/tag/v0.13.0). We hope to see you at [ElixirConf](http://elixirconf.com/) as well as pushing your packages to [hex.pm](https://hex.pm/).
