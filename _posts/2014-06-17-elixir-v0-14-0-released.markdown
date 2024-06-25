---
layout: post
title: Elixir v0.14.0 released
author: José Valim
category: Releases
excerpt: "Elixir v0.14.0 is released and expands the work on structs and bringing more of OTP right into Elixir and Mix"
---

Hello everyone!

We are glad to announce v0.14.0 has been released.

Our previous release, [v0.13.0](/blog/2014/04/21/elixir-v0-13-0-released/), brought important changes to the language. Back then we have introduced a new associative data structure, called maps, and presented the concept of structs to replace Elixir records.

With v0.14.0 we have expanded on the work started on v0.13.0, replacing records by structs and integrating OTP behaviours, applications, and configurations into Mix.

## @derive

Maps are Elixir's new associative data structure:

```elixir
%{key: "value"}
```

With maps, Elixir also introduced structs, that are basically raw, named maps:

```elixir
defmodule User do
  defstruct name: "", age: 0
end

%User{name: "jose"}
#=> %User{name: "jose", age: 0}
```

Structs allow us to provide default values for a map fields. Structs also validate, at compilation time, that all fields given during the struct construction are valid fields. The following, for example, would fail:

```elixir
%User{unknown: "field"}
#=> ** (CompileError) iex:2: unknown key :unknown for struct User
```

We say structs are *raw* because they do not implement any of the protocols that are implemented for maps  by default. For instance, we can call `Enum.each/2` for a map, which uses the [`Enumerable`](https://hexdocs.pm/elixir/Enumerable.html) protocol:

```elixir
Enum.each %{foo: :bar}, fn {k, v} ->
  IO.puts "Got #{k}: #{v}"
end
#=> Got foo: bar
```

But such a call would fail for the User struct:

```elixir
Enum.each %User{}, fn {k, v} ->
  IO.puts "Got #{k}: #{v}"
end
#=> ** (Protocol.UndefinedError) protocol Enumerable not implemented for %User{age: 0, name: ""}
```

However, in many situations, we may want to enumerate the keys and values in a struct. Before this release, it would require us to manually implement the `Enumerable` protocol for every struct.

Elixir v0.14.0 solves this issue by introducing `@derive` which allows us to dynamically derive implementations for structs based on the implementation for maps:

```elixir
defmodule User do
  @derive [Enumerable]
  defstruct name: "", age: 0
end

Enum.each %User{name: "jose"}, fn {k, v} ->
  IO.puts "Got #{k}: #{v}"
end
#=> Got __struct__: Elixir.User
#=> Got name: jose
#=> Got age: 0
```

The deriving functionality can be customized by implementing `PROTOCOL.Map.__deriving__/3`. For example, a JSON protocol could define a `JSON.Map.__deriving__/3` function that derives specific implementations for every struct. Such implementations could access the struct fields and generate a JSON template at compilation time, avoiding work at runtime.

## Protocol consolidation

In the example above, when we called `Enum.each/2`, it invoked the `Enumerable` protocol internally, which then checks if there is an implementation available for the `User` struct. This means that dispatching a protocol incurs some overhead to check if the implementation is available or not.

While this behaviour is useful for development, in production all implementations for all protocols are usually known up-front, so we could avoid this overhead by doing a direct dispatch. That's exactly what protocol consolidation does.

Protocol consolidation checks all code paths in your project, looking for all protocols and all implementions. When all implementations are found it will recompile all protocols to have quick dispatch rules.

You can invoke `Protocol.consolidate/2` to manually consolidate protocols. However, if you are inside a Mix project, you can consolidate all protocols by simply invoking `mix compile.protocols`. Type `mix help compile.protocols` in your terminal to get more information. This task should be invoked when deploying to production and we have opened issues in the Elixir buildpack as well as in the existing build tools so they automatically consolidade protocols for you.

## Nested access

With v0.14.0, Elixir introduced functionality to traverse deeply nested data structures. To show this functionality let's imagine we have a gaming application where users can be in different dungeons. Each dungeon may have many rooms and users can talk to each other only if they are in the same room.

We can model the game's dungeons with a Dungeon struct:

```elixir
%Dungeon{name: "", rooms: %{}}
```

The Dungeon can have many rooms and we keep them in a map, with the room id as key, and the Room struct as value:

```elixir
%Room{id: 0, users: HashDict.new}
```

A room has users and since we can possibly have hundreds of them, we store them in a HashDict, with the user id as key. Finally, the user may participate from different devices, so we need to keep a set of device codes in each user:

```elixir
%User{id: 0, username: "", device_codes: HashSet.new}
```

The nested access functionality that ships with Elixir allows us to quickly access or update a nested value. For example, given a dungeon named `dungeon`, we can access all the device codes for a given user as follow:

```elixir
dungeon.rooms[room_id].users[user_id].device_codes
```

With the nested access functionality, we can now update a nested path directly too. For example, if a user changes his name, we can change it directly with:

```elixir
put_in dungeon.rooms[room_id].users[user_id].username, "new username"
```

If the user signs out from one device, we can delete the code from that particular device:

```elixir
update_in dungeon.rooms[room_id].users[user_id].device_codes, &Set.delete(&1, code)
```

`put_in/2` and `update_in/2` are macros that work as syntax sugar for the lower-level `put_in/3` and `update_in/3`, that expects the whole path to be given as a list:

```elixir
put_in dungeon, [:rooms, room_id, :users, user_id, :username], "new username"
```

You can read more information about nested access in [the Access protocol documentation](https://hexdocs.pm/elixir/Access.html) and in the docs for [`get_in/2`](https://hexdocs.pm/elixir/Kernel.html#get_in/2) and friends.

## Mix and OTP

OTP is a set of libraries that ships with Erlang. Erlang developers use OTP to build robust, fault-tolerant applications.

In v0.14.0, Elixir closely integrates with OTP by providing modules for building [servers](https://hexdocs.pm/elixir/GenServer.html), [supervisors](https://hexdocs.pm/elixir/Supervisor.html) and [applications](https://hexdocs.pm/elixir/Application.html).

We have also introduced the concepts of [agents](https://hexdocs.pm/elixir/Agent.html) and the idea of [tasks](https://hexdocs.pm/elixir/Task.html), which can be supervised and distributed. Application configuration has been made first class in Mix, allowing developers to configure their dependencies, sometimes even using different configurations per environment (dev, test or prod by default).

This functionality is at the core of building applications in Erlang and Elixir. For this reason we have published a new guide called [Mix and OTP](https://hexdocs.pm/elixir/introduction-to-mix.html) where we build a distributed key-value store to help explore all concepts mentioned above. The guide is quite fresh, so please do submit pull requests for typos and mistakes. Feedback is also welcome!

Note "Mix and OTP" is our most advanced guide so far and it expects you to have read our introductory guide. In case you haven't yet, you can [get started here](https://hexdocs.pm/elixir/introduction.html).

## What's next?

With v0.14.0 we have reached many of the milestones [we have set in the previous release](/blog/2014/04/21/elixir-v0-13-0-released/#the-next-steps). This brings us closer to Elixir v1.0 and only a handful of tasks are pending:

* Provide an Elixir logger that knows how to print and format Elixir exceptions and stacktraces. Work has already started on this front as Elixir already prints errors coming from the application startup nicely;

* Continue the work of cleaning up the [Kernel module](https://hexdocs.pm/elixir/Kernel.html). In v0.14.0, we added alternatives for conversion functions, like `integer_to_binary/1` to `Integer.to_string/1`, now they must be properly deprecated and removed;

* Support mix aliases, allowing developers to easily define Mix shortcuts for their favorite tasks;

* Solve all remaining [open issues](https://github.com/elixir-lang/elixir/issues?state=open). We have always kept the issues tracker tidy and there is little work left to solve the existing issues. Note we have also listed all [upcoming backwards incompatible changes](https://github.com/elixir-lang/elixir/issues?labels=Note%3ABackwards+incompatible&page=1&state=open). Many of those changes will actually be deprecated first and developers should be able to follow along without breaking changes in minor releases, but they are breaking changes in the sense they work in v0.14.0 but will work differently by the time v1.0 is released;

That's all for now! Elixir developers can see [a summary of all changes in v0.14.0 in the release notes](https://github.com/elixir-lang/elixir/releases/tag/v0.14.0). In case you are new around here, you can get started with Elixir by reading [our Getting Started guide](https://hexdocs.pm/elixir/introduction.html).

We hope to see you all this July at [ElixirConf](http://elixirconf.com/)!
