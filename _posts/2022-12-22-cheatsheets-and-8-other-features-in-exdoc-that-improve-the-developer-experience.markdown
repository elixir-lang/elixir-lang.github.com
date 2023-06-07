---
layout: post
title: "Cheatsheets and other 8 ExDoc features that improve the developer experience"
author: Hugo Baraúna
category: Announcements
excerpt: This post explains the motivation behind the new ExDoc Cheatsheet feature. It also highlights other ExDoc features that show how ExDoc has been evolving to make the documentation experience in Elixir better and better.
---

ExDoc has a cool new feature, [cheatsheets](https://hexdocs.pm/ex_doc/cheatsheet.html)!

In this blog post, we'll explain what that new feature is and the motivation behind it. We'll also take the opportunity to highlight other ExDoc features that show how it has been evolving to make the documentation experience in Elixir better and better.

## What are ExDoc cheatsheets and how they improve the documentation experience

ExDoc's cheatsheets are Markdown files with the `.cheatmd` extension. You can see [an example](https://hexdocs.pm/ecto/crud.html) of how the Ecto project is using them.

Writing and reading cheatsheets is not exactly new to developers. What ExDoc brings to the table is the possibility of integrating cheatsheets alongside the rest of the documentation of an Elixir project, instead of hosting them in a different place.

Developers need different kinds of documentation at different times. When one is learning about a new library, a guide format is proper. When one needs to know if a library can solve a specific problem, an API reference can be more appropriate. When someone wants to remember a couple of functions they already used from that library, a cheatsheet could be more practical.

Imagine if you had to go to a different place for every type of documentation you're looking for. That would make a very fragmented experience, not only for readers of documentation but also for writers.

ExDoc cheatsheets represent one step further in the direction of making documentation in Elixir an even more comprehensive and integrated experience.

ExDoc cheatsheets are inspired by [devhints.io](https://devhints.io) from [Rico Sta. Cruz](https://twitter.com/rstacruz), and were contributed by [Paulo Valim](https://twitter.com/paulovalim) and [Yordis Prieto](https://twitter.com/alchemist_ubi).

## Eight features that show how ExDoc has improved developer experience over time

We added cheatsheets to ExDoc because we value developer experience and believe documentation is a core aspect of it.

Since the beginning, one of Elixir's principles is that documentation should be a first-class citizen. What this idea means to us is that documentation should be easy to write and easy to read. ExDoc has been continuously evolving over the years, guided by this principle.

Here are some of the features added to ExDoc over the years that make reading and writing documentation in Elixir a joy.

### Beautiful and usable design

As developers, we may not have the skill to make beautifully designed UIs. That doesn't mean we don't appreciate it. Here's what documentation generated with ExDoc looked like almost ten years ago, with its original layout based on [YARD](https://yardoc.org/):

![Screenshot of the Phoenix v0.5.0 documentation generated with an early version
of ExDoc](https://i.imgur.com/O9xKjR8.jpg)

Here's what it looks like today:

![Screenshot of the Phoenix v1.6.15 documentation generated with current
ExDoc](https://i.imgur.com/ZKI1T23.png)

The evolution of ExDoc's design helped documentation be more visually appealing and easier to read and navigate.

### Links to source code

Sometimes you're reading the documentation of a library, and you want to know more about the implementation of a function. Or, you found something in the documentation that could be improved and wants to help. In those situations, it's helpful to go from the documentation to the source code. ExDoc makes that dead easy. For every module, function, or page, ExDoc gives you a link that you can click to go directly to the project's source code on GitHub:

![Short screencast of a user clicking on the "link to source code" button on the
documentation for a function](https://i.imgur.com/PXvoeDk.gif)

### Guides

One of the most common formats of library documentation is an API reference. But depending on your needs, that's not the most approachable format. For example, it's not optimal when you're just getting started with a library or when you want to learn how to solve a specific problem using it. That's why ExDoc allows writing other types of docs besides API references, like *"Getting started" guides* or *How-tos*.

Look at how [Ecto's documentation](https://hexdocs.pm/ecto/getting-started.html) uses that, for example:

![Screencast of a user exploring the guides in the Ecto
documentation](https://i.imgur.com/KInZb4x.gif)

### Custom grouping of modules, functions, and pages in the sidebar

Sometimes your library has dozens of modules. Sometimes, one given module has a large API surface area. In those situations, showing the list of functions as a single large list may not be the most digestible way to be consumed. For those cases, ExDoc allows modules, functions, or extra pages to be grouped in the sidebar in a way that makes more sense semantically.

Here's an example of how Ecto use grouped functions for its `Repo` module:

![Screenshot of the sidebar of the Ecto documentation, showing grouped functions
in the `Ecto.Repo` module](https://i.imgur.com/ZE7N312.png)

Instead of listing the ~40 functions of `Ecto.Repo` as a single extensive list, it presents them grouped by five cohesive topics:

- Query API
- Schema API
- Transaction API
- Runtime API
- User callbacks

The same functionality is available for modules and pages (guides, how-tos, and so on). Phoenix is a [good example](https://hexdocs.pm/phoenix/overview.html) of how that's used.

### Full-text search

Sometimes you don't know or don't remember the name of the function that you're looking for. For example, let's say you're looking for a function for dealing with file system directories.

Although there's no function or module called "directory" in Elixir, when you type "directory" in [Elixir's documentation](https://hexdocs.pm/elixir/search.html?q=directory), it will return all the entries that have the word "directory" inside the documentation. It will even return entries with variations of the word "directory", like "directories", doing a fuzzy search.

![Screenshot of the result of searching for "directory" in the Elixir
documentation](https://i.imgur.com/IHHuej8.png)

The search bar also supports autocompletion for module and function names:

![Screencast of a user typing the word "Enum" in the search bar of Elixir's
documentation and letting it autocomplete the module. Then, the user types
"Range" and both modules and functions show
up.](https://i.imgur.com/2cmsuDi.gif)

The best part is that full-text search is fully implemented on the client-side, which means ExDoc pages can be fully hosted as static websites (for example on GitHub Pages).

### Keyboard shortcuts to navigate to docs of other Hex packages

It's common for an application to have dependencies. While coding, we usually need to read the documentation of more than one of those dependencies.

One solution is to keep a window open for the documentation of each dependency. However, ExDoc offers another option: a keyboard shortcut to search and go to another package documentation within the same window.

Here's what it looks like:

![Screencast of a user enabling the `g` shortcut to search through dependencies
documentation and then using it to search for "phoenix_live" in the
documentation for Nerves.](https://i.imgur.com/I9uJxUF.gif)

There are more keyboard shortcuts to help you navigate within and between documentation:

![Screenshot of the keyboard shortcuts that you can enable in
ExDoc](https://i.imgur.com/qdoNUx9.png)

### A version dropdown to switch to other versions

Keeping our application updated with the latest versions of all its dependencies can be challenging. So, it's common to need to look at the documentation of an older version of a library we're using. ExDoc makes it simple to do that.

When you access the documentation of a project, there's a dropdown that you can use to select the version you're looking for:

![Screencast of a user typing the version dropdown under the application name in
the "timex" documentation, revealing all the
versions.](https://i.imgur.com/1krcY5g.gif)

### Livebook integration

[Livebook](https://livebook.dev/) is a web application for writing interactive and collaborative code notebooks in Elixir.

One of the ways Elixir developers have been using Livebook is for documentation. Because of its interactivity capabilities, it enables the reader to play with the code right inside the documentation, which makes it great for tutorials and augmenting the user experience.

With that in mind, ExDoc offers the possibility of integrating Livebook notebooks. That means one can host Livebook-based documentation together with the API reference.

Here's an [example of using Livebook inside ExDoc for writing a Usage Guide](https://hexdocs.pm/req_sandbox/usage.html):

![Screencast of a user navigating through the "req_sandbox" documentation,
finding a Livebook, clicking "Run in Livebook", and using the Livebook that
opens up on their local machine.](https://i.imgur.com/FxOLs0Y.gif)

### Bonus: Erlang support

[EEP 48](https://www.erlang.org/eeps/eep-0048) proposed a standardized way for how BEAM languages could store API documentation. This allows any BEAM language to read documentation generated by each other.

By leveraging that work, ExDoc can generate documentation for an Erlang project. For example, Telemetry is a library written in Erlang that has [its documentation](https://hexdocs.pm/telemetry/readme.html) generated with ExDoc.

![Screenshot of "telemetry" documentation generated with
ExDoc](https://i.imgur.com/C4Idbuh.png)

By using ExDoc to also generate documentation for Erlang-based projects, we can have more consistency in the user experience along the BEAM ecosystem. See the great [`rebar3_ex_doc`](https://hexdocs.pm/rebar3_ex_doc/) plugin to get started.

### Bonus: Doctests

When writing documentation, it's helpful to offer code examples. For instance, here's the documentation of the `Enum.any?/1` function from Elixir's standard library:

```elixir
@doc """
Returns `true` if at least one element in `enumerable` is truthy.

When an element has a truthy value (neither `false` nor `nil`) iteration stops
immediately and `true` is returned. In all other cases `false` is returned.

## Examples

  iex> Enum.any?([false, false, false])
  false

  iex> Enum.any?([false, true, false])
  true

  iex> Enum.any?([])
  false

"""
```

To ensure examples do not get out of date, Elixir's test framework ExUnit provides a feature called **doctests**. This allows developers to test the examples in their documentation. Doctests work by parsing out code samples starting with `iex>` from the documentation.

Although this is not a feature of ExDoc, it is an essential part of Elixir's developer and documentation experience.

## Wrap up

As we saw, ExDoc has evolved a lot throughout the years! As it continues to evolve into a more and more comprehensive documentation tool, we want to enable developers to keep investing more time writing the documentation itself instead of needing to spend time building custom documentation tools and websites. The best part is that all you need to do to leverage many of those features is to simply document your code using the `@doc` attribute!

Here's to a continuously improving documentation experience for the next years.
