---
layout: getting-started
title: Introduction
---
{% assign stable = site.data.elixir-versions[site.data.elixir-versions.stable] %}

# {{ page.title }}

{% include toc.html %}

Welcome!

In this tutorial, we are going to teach you about Elixir fundamentals - the language syntax, how to define modules, how to manipulate the characteristics of common data structures, and more. This chapter will focus on ensuring that Elixir is installed and that you can successfully run Elixir's Interactive Shell, called IEx.

Our requirements are (see `elixir -v`):

  * Elixir 1.5.0 onwards
  * Erlang/OTP 19 onwards

Let's get started!

> If you find any errors in the tutorial or on the website, [please report a bug or send a pull request to our issue tracker](https://github.com/elixir-lang/elixir-lang.github.com).

> The Elixir guides are also available in EPUB format:
>
>   * [Getting started guide](https://repo.hex.pm/guides/elixir/elixir-getting-started-guide.epub)
>   * [Mix and OTP guide](https://repo.hex.pm/guides/elixir/mix-and-otp.epub)
>   * [Meta-programming guide](https://repo.hex.pm/guides/elixir/meta-programming-in-elixir.epub)

## Installation

If you haven't yet installed Elixir, visit our [installation page](/install.html). Once you are done, you can run `elixir --version` to get the current Elixir version.

## Interactive mode

When you install Elixir, you will have three new executables: `iex`, `elixir` and `elixirc`. If you compiled Elixir from source or are using a packaged version, you can find these inside the `bin` directory.

For now, let's start by running `iex` (or `iex.bat` if you are on Windows PowerShell, where `iex` is a PowerShell command) which stands for Interactive Elixir. In interactive mode, we can type any Elixir expression and get its result. Let's warm up with some basic expressions.

Open up `iex` and type the following expressions:

```elixir
Erlang/OTP {{ stable.minimum_otp }} [64-bit] [smp:2:2] [...]

Interactive Elixir ({{ stable.version }}) - press Ctrl+C to exit
iex(1)> 40 + 2
42
iex(2)> "hello" <> " world"
"hello world"
```

Please note that some details like version numbers may differ a bit in your session; that's not important. From now on `iex` sessions will be stripped down to focus on the code. To exit `iex` press `Ctrl+C` twice.

It seems we are ready to go! We will use the interactive shell quite a lot in the next chapters to get a bit more familiar with the language constructs and basic types, starting in the next chapter.

> Note: if you are on Windows, you can also try `iex --werl` (`iex.bat --werl` on PowerShell) which may provide a better experience depending on which console you are using.

## Running scripts

After getting familiar with the basics of the language you may want to try writing simple programs. This can be accomplished by putting the following Elixir code into a file:

```elixir
IO.puts "Hello world from Elixir"
```

Save it as `simple.exs` and execute it with `elixir`:

```console
$ elixir simple.exs
Hello world from Elixir
```

Later on we will learn how to compile Elixir code (in [Chapter 8](/getting-started/modules-and-functions.html)) and how to use the Mix build tool (in the [Mix & OTP guide](/getting-started/mix-otp/introduction-to-mix.html)). For now, let's move on to [Chapter 2](/getting-started/basic-types.html).

## Asking questions

When going through this getting started guide, it is common to have questions; after all, that is part of the learning process! There are many places where you can ask questions, here are some of them:

  * [Official #elixir-lang on freenode IRC](irc://irc.freenode.net/elixir-lang)
  * [Elixir Forum](http://elixirforum.com)
  * [Elixir on Slack](https://elixir-slackin.herokuapp.com/)
  * [Elixir on Discord](https://discord.gg/elixir)
  * [elixir tag on StackOverflow](https://stackoverflow.com/questions/tagged/elixir)

When asking questions, remember these two tips:

  * Instead of asking "how to do X in Elixir", ask "how to solve Y in Elixir". In other words, don't ask how to implement a particular solution, instead describe the problem at hand. Stating the problem gives more context and less bias for a correct answer.

  * In case things are not working as expected, please include as much information as you can in your report, for example: your Elixir version, the code snippet and the error message alongside the error stacktrace. Use sites like [Gist](https://gist.github.com/) to paste this information.
