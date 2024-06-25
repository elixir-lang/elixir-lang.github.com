---
layout: post
title: Elixir v1.13 released
author: José Valim
category: Releases
excerpt: Elixir v1.13 is out with a focus on developer tooling
---

Elixir v1.13 has just been released!

Generally speaking, new Elixir versions include improvements to its primary API, the one Elixir developers use every day, and also to the foundation that powers its tooling. In this release, however, it coincided that most new functionality centers around Elixir tooling. The result is a series of quality of life improvements that will impact Elixir developers immediately as well as in the long term.

Let's check them out!

Note: this announcement contains [asciinema](https://asciinema.org) snippets. You may need to enable 3rd-party JavaScript on this site in order to see them. If JavaScript is disabled, `noscript` tags with the proper links will be shown.

## Semantic recompilation

The feature that will most and immediately benefit all Elixir developers is the series of improvements we have made to how the compiler tracks file contents.

Generally speaking, once a file changes, it may lead to other files in your codebase to be recompiled. In previous versions, however, Elixir made no effort to understand which parts of the file changed. This meant the smallest of changes to certain files, such as configuration files, could trigger a full project recompilation.

This release comes with a series of improvements that better understand how your files change. In particular:

  * An Elixir file is no longer considered as changed if its size and its digest stay the same. This avoids recompiling many files when switching or rebasing branches.

  * Changing your `mix.exs` will no longer trigger a full project recompilation, unless you specifically change the configurations used by the Elixir compiler (`:elixirc_paths` and `:elixirc_options`).

  * Changing compile-time configuration files (`config/config.exs` and any other files imported from it) now only recompiles the project files that depend on the reconfigured applications, instead of a full project recompilation. However, if you change the configuration of your application itself, the whole project is still recompiled.

  * Adding, updating or removing a dependency now only recompiles the project files that depend on the modified dependency.

  * If your project has both Erlang and Elixir files, changing an Erlang file will now recompile only the Elixir files that depend on it.

In a nutshell, Elixir went from triggering full recompilations whenever any of `mix.exs`, `config/config.exs`, `src/*`, and `mix.lock` changed on disk to semantic recompilations. Now it only fully recompiles when:

  * you change the compilation options in `mix.exs`
  * you change the configuration for the current project in `config/config.exs`

To give a more practical example, take a regular [Phoenix project](https://phoenixframework.org/). It is most likely divided in two main directories: `my_app` and `my_app_web`. Most of your usage of Phoenix' APIs will happen within the files in the `my_app_web` directory. However, if you bumped your Phoenix version or changed its configuration in previous Elixir versions, it would cause all files, in both directories, to be recompiled. With these changes, the recompilation should affect mostly the files in `my_app_web`.

> To further clarify, the Elixir compiler is not tracking directories. It is just a consequence of how Phoenix projects are organized that most dependencies to Phoenix are within `my_app_web`.

## Code fragments

The [`Code`](https://hexdocs.pm/elixir/Code.html) module got a companion module called [`Code.Fragment`](https://hexdocs.pm/elixir/Code.Fragment.html).

The `Code` module works with complete code. For example, its functions will consider the snippet `123 +` as invalid, since the right-hand side of `+` is missing. However, our tooling, such as editors, REPLs, and code notebooks must still parse and understand such snippets, in order to provide code completion, argument suggestion, etc.

That's the goal of the `Code.Fragment` module. It contains different heuristics to analyze and return context informational of code fragments, which are code snippets that may be incomplete.

To better show the benefits of said improvements, let's talk about IEx, Elixir's interactive shell. IEx has been rewritten to use `Code.Fragment` and, in the process, it gained new functionality as part of its autocompletion system (available by hitting TAB). For example, it can now autocomplete sigils, used to [create regexes](https://hexdocs.pm/elixir/Kernel.html#sigil_r/2) or [lists of words](https://hexdocs.pm/elixir/Kernel.html#sigil_w/2), and their terminators:

<script id="asciicast-By0cGpu9xSUgflc24cVlLgPgY" src="https://asciinema.org/a/By0cGpu9xSUgflc24cVlLgPgY.js" async></script><noscript><p><a href="https://asciinema.org/a/By0cGpu9xSUgflc24cVlLgPgY">See the example in asciinema</a></p></noscript>

Similarly, you can now autocomplete struct names and their fields:

<script id="asciicast-A44auZ00saSud3l7DbOL4IMYn" src="https://asciinema.org/a/A44auZ00saSud3l7DbOL4IMYn.js" async></script><noscript><p><a href="https://asciinema.org/a/A44auZ00saSud3l7DbOL4IMYn">See the example in asciinema</a></p></noscript>

Overall, we hope the `Code.Fragment` module will become the shared foundation to power many of the tools in the ecosystem. We have also added new reflection APIs to [`Module`](https://hexdocs.pm/elixir/Module.html), which can then be used to power code intelligence features.

## mix xref

[`mix xref`](https://hexdocs.pm/mix/Mix.Tasks.Xref.html) is a tool that analyzes relationships between files. By analyzing the compile-time and runtime dependencies between them, it allows developers to understand what has to be recompiled whenever a file changes.

Elixir v1.13 comes with many improvements to `mix xref`, such as:

  * `mix xref graph` now supports `--label` to be set to "compile-connected", which returns all compile-time dependencies that lead to additional transitive dependencies.

  * A new `mix xref trace FILE` subcommand receives a file and returns all dependencies in said file, including the line and what caused said dependency (a function/macro call, an alias, a struct, etc).

  * All `mix xref` subcommands support the `--fail-above` flag, which allows you to enforce your project has at most a certain number of compile-time cycles, transitive compile-time dependencies, etc. This can be useful on Continuous Integration (CI) servers.

  * `mix xref graph` now supports multiple `--sink` and `--source` to be given.

If you haven't used `mix xref` before, it may be hard to visualize what those changes mean. If you want to learn more, you can [watch the relevant section of my ElixirConf 2021 keynote](https://youtu.be/ydjx2kKHzrM?t=772) that includes a short introduction to `mix xref`.

Those improvements came from direct feedback from the community. A special shout out to Marc-André Lafortune for the contributions and testing.

## Extended code formatting

Thanks to its sigils, Elixir provides the ability of embedding snippets in other languages inside its source code. One could use it to embed XML:

    ~X"""
    <?xml version="1.0" encoding="UTF-8"?>
    <text><![CDATA[Hello World]]></text>
    """

Or even [Zig](https://ziglang.org/), [via the Zigler project](https://github.com/ityonemo/zigler):

    ~Z"""
    /// nif: example_fun/2
    fn example_fun(value1: f64, value2: f64) bool {
      return value1 > value2;
    }
    """

However, while you can format Elixir source code with [`mix format`](https://hexdocs.pm/mix/Mix.Tasks.Format.html), you could not format the code inside snippets.

Elixir v1.13 solves this by adding plugins to `mix format`. Plugins can teach the formatter how to format new files and how to format sigils, via the `Mix.Tasks.Format` behaviour.

For example, imagine that your project uses Markdown in two distinct ways: via a custom `~M` sigil and via files with the `.md` and `.markdown` extensions. A custom plugin would look like this:

```elixir
defmodule MixMarkdownFormatter do
  @behaviour Mix.Tasks.Format

  def features(_opts) do
    [sigils: [:M], extensions: [".md", ".markdown"]]
  end

  def format(contents, opts) do
    # logic that formats markdown
  end
end
```

Now any application can use your formatter as follows:

```elixir
# .formatter.exs
[
  # Define the desired plugins
  plugins: [MixMarkdownFormatter],
  # Remember to update the inputs list to include the new extensions
  inputs: ["{mix,.formatter}.exs", "{config,lib,test}/**/*.{ex,exs}", "posts/*.{md,markdown}"]
]
```

We are looking forward to see how this new functionality will be used by community, especially projects like [Surface](https://github.com/surface-ui/surface) and [Phoenix LiveView](https://github.com/phoenixframework/phoenix_live_view), which provide a templating language on top of the HTML markup.

## Other bits and bytes

`SyntaxError` and `TokenMissingError` were improved to show a code snippet whenever possible:

    $ elixir -e "hello + * world"
    ** (SyntaxError) nofile:1:9: syntax error before: '*'
        |
      1 | hello + * world
        |         ^

The `Code` module has also been augmented with two functions: [`Code.string_to_quoted_with_comments/2`](https://hexdocs.pm/elixir/Code.html#string_to_quoted_with_comments/2) and [`Code.quoted_to_algebra/2`](https://hexdocs.pm/elixir/Code.html#quoted_to_algebra/2). Those functions allow someone to retrieve the Elixir AST with their original source code comments, and then convert this AST to formatted code. In other words, those functions provide a wrapper around the Elixir Code Formatter, supporting developers who wish to create tools that directly manipulate and custom format Elixir source code.

`elixir --short-version` has been added to quickly get the Elixir version, without booting the Erlang VM. The `Task` module includes performance optimizations and [new](https://hexdocs.pm/elixir/Task.html#ignore/1) [functions](https://hexdocs.pm/elixir/Task.html#completed/1). Finally, `mix test --profile-require=time` has been added to debug loading times of test suites and the recently added [`Mix.install/2`](https://hexdocs.pm/mix/Mix.html#install#2) has been improved with new options and environment variables.

## Learn more

For a complete list of all changes, see the [full release notes](https://github.com/elixir-lang/elixir/releases/tag/v1.13.0). You can also [watch my ElixirConf 2021 keynote about Elixir v1.13](https://youtu.be/ydjx2kKHzrM) to learn more.

Check [the Install section](/install.html) to get Elixir installed and read our [Getting Started guide](https://hexdocs.pm/elixir/introduction.html) to learn more.

Have fun!
