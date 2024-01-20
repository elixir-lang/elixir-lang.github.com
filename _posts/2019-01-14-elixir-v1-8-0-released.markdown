---
layout: post
title: Elixir v1.8 released
author: José Valim
category: Releases
excerpt: Elixir v1.8 comes with many improvements at the infrastructure level, improving compilation time, speeding up common patterns, and adding features around introspection of the system.
---

Elixir v1.8 comes with many improvements at the infrastructure level, improving compilation time, speeding up common patterns, and adding features around introspection of the system.

## Custom struct inspections

Elixir now provides a derivable implementation of the `Inspect` protocol. In a nutshell, this means it is really easy to filter data from your data structures whenever they are inspected. For example, imagine you have a user struct with security and privacy sensitive information:

```elixir
defmodule User do
  defstruct [:id, :name, :age, :email, :encrypted_password]
end
```

By default, if you inspect a user via `inspect(user)`, it will include all fields. This can cause fields such as `:email` and `:encrypted_password` to appear in logs, error reports, etc. You could always define a custom implementation of the `Inspect` protocol for such cases but Elixir v1.8 makes it simpler by allowing you to derive the `Inspect` protocol:

```elixir
defmodule User do
  @derive {Inspect, only: [:id, :name, :age]}
  defstruct [:id, :name, :age, :email, :encrypted_password]
end
```

Now all user structs will be printed with all remaining fields collapsed:

    #User<id: 1, name: "Jane", age: 33, ...>

You can also pass `@derive {Inspect, except: [...]}` in case you want to keep all fields by default and exclude only some.

## Time zone database support

In Elixir v1.3, Elixir added four types, known as Calendar types, to work with dates and times: `Time`, `Date`, `NaiveDateTime` (without time zone), and `DateTime` (with time zone). Over the last versions we have added many enhancements to the Calendar types but the `DateTime` module always evolved at a slower pace since Elixir did not provide an API for time zone databases.

Elixir v1.8 now defines a `Calendar.TimeZoneDatabase` behaviour, allowing developers to bring in their own time zone databases. By defining an explicit contract for time zone behaviours, Elixir can now extend the `DateTime` API, adding functions such as `DateTime.shift_zone/3`. By default, Elixir ships with a time zone database called `Calendar.UTCOnlyTimeZoneDatabase` that only handles UTC.

Other Calendar related improvements include the addition of `Date.day_of_year/1`, `Date.quarter_of_year/1`, `Date.year_of_era/1`, and `Date.day_of_era/1`.

## Faster compilation and other performance improvements

Due to improvements to the compiler made over the last year, Elixir v1.8 should compile code about 5% faster on average. This is yet another release where we have been able to reduce compilation times and provide a more joyful development experience to everyone.

The compiler also emits more efficient code for range checks in guards (such as `x in y..z`), for charlists with interpolation (such as `'foo #{bar} baz'`), and when working with records via the `Record` module.

Finally, EEx templates got their own share of optimizations, emitting more compact code that runs faster.

## Improved instrumentation and ownership with `$callers`

The `Task` module is one of the most common ways to spawn light-weight processes to perform work concurrently. Whenever you spawn a new process, Elixir annotates the parent of that process through the `$ancestors` key. This information can be used by instrumentation tools to track the relationship between events occurring within multiple processes. However, many times, tracking only the `$ancestors` is not enough.

For example, we recommend developers to always start tasks under a supervisor. This provides more visibility and allows us to control how those tasks are terminated when a node shuts down. In your code, this can be done by invoking something like: `Task.Supervisor.start_child(MySupervisor, task_specification)`. This means that, although your code is the one who invokes the task, the actual parent of the task would be the supervisor, as the supervisor is the one spawning it. We would list the supervisor as one of the `$ancestors` for the task, but the relationship between your code and the task is lost.

In Elixir v1.8, we now track the relationship between your code and the task via the `$callers` key in the process dictionary, which aligns well with the existing `$ancestors` key. Therefore, assuming the `Task.Supervisor` call above, we have:

    [your code] -- calls --> [supervisor] ---- spawns --> [task]

which means we store the following relationships:

    [your code]              [supervisor] <-- ancestor -- [task]
         ^                                                  |
         |--------------------- caller ---------------------|

When a task is spawned directly from your code, without a supervisor, then the process running your code will be listed under both `$ancestors` and `$callers`.

This small feature is very powerful. It allows instrumentation and monitoring tools to better track and relate the events happening in your system. This feature can also be used by tools like the "Ecto Sandbox". The "Ecto Sandbox" allows developers to run tests concurrently against the database, by using transactions and an ownership mechanism where each process explicitly gets a connection assigned to it. Without `$callers`, every time you spawned a task that queries the database, the task would not know its caller, and therefore it would be unable to know which connection was assigned to it. This often meant features that rely on tasks could not be tested concurrently. With `$callers`, figuring out this relationship is trivial and you have more tests using the full power of your machine.

## Summing up

We are really proud of this release (as usual!) which brings many improvements at the infrastructure level. Those improvements were designed with feedback from the community and from the many different companies using Elixir in production. The full list of changes is available in our [release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.8.0).

There is only one last major feature planned for upcoming Elixir versions, which is the addition of `mix release` to Elixir itself, streamlining the experience provided by packages like [distillery](https://github.com/bitwalker/distillery). With `mix release`, a developer can bundle the VM and all compiled code in a single directory, which can then be packaged and sent to production. We are glad to say the [work on this feature has already started](https://github.com/elixir-lang/elixir/issues/8612).

During [my keynote at ElixirConf 2018 US](https://www.youtube.com/watch?v=suOzNeMJXl0), I talked about the next five years for Elixir and much of the emphasis is put on the community. Elixir was designed to be an extensible language and therefore the work on the language itself is meant to reduce with time, which we have seen in the last two releases. We trust the community to continue building on this solid foundation, bringing new challenges to the ecosystem and taking the language to new domains.

Check [the Install section](/install.html) to get Elixir installed and read our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) to learn more.

Your turn. :)