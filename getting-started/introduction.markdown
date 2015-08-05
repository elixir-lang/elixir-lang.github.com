---
layout: getting-started
title: Introduction
redirect_from: /getting_started/1.html
---

# {{ page.title }}

{% include toc.html %}

Welcome!

In this tutorial we are going to teach you the Elixir foundation, the language syntax, how to define modules, how to manipulate the characteristics of common data structures and more. This chapter will focus on ensuring Elixir is installed and that you can successfully run Elixir's Interactive Shell, called IEx.

Our requirements are:

  * Elixir - Version 1.0.0 onwards
  * Erlang - Version 17.0 onwards

Let's get started!

> If you find any errors in the tutorial or on the website, please [report a bug](https://github.com/elixir-lang/elixir-lang.github.com/issues/new) or [send a pull request](https://github.com/elixir-lang/elixir-lang.github.com/pulls) to our [issue tracker](https://github.com/elixir-lang/elixir-lang.github.com/issues).

## Installation

If you still haven't installed Elixir, run to our [installation page](/install.html). Once you are done, you can run `elixir -v` to get the current Elixir version.

## Interactive mode

When you install Elixir, you will have three new executables: `iex`, `elixir` and `elixirc`. If you compiled Elixir from source or are using a packaged version, you can find these inside the `bin` directory.

For now, let's start by running `iex` (or `iex.bat` if you are on Windows) which stands for Interactive Elixir. In interactive mode, we can type any Elixir expression and get its result. Let's warm up with some basic expressions.

Open up `iex` and type the following expressions:

```iex
Interactive Elixir - press Ctrl+C to exit (type h() ENTER for help)

iex> 40 + 2
42
iex> "hello" <> " world"
"hello world"
```

It seems we are ready to go! We will use the interactive shell quite a lot in the next chapters to get a bit more familiar with the language constructs and basic types, starting in the next chapter.

> Note: if you are on Windows, you can also try `iex.bat --werl` which may provide a better experience depending on which console you are using.

## Running scripts

After getting familiar with the basics of the language you may want to try writing simple programs. This can be accomplished by putting Elixir code into a file and executing it with `elixir`:

```bash
$ cat simple.exs
IO.puts "Hello world
from Elixir"

$ elixir simple.exs
Hello world
from Elixir
```

Later on we will learn how to compile Elixir code (in [Chapter 8](/getting-started/modules.html)) and how to use the Mix build tool (in the [Mix & OTP guide](/getting-started/mix-otp/introduction-to-mix.html)). For now, let's move on to [Chapter 2](/getting-started/basic-types.html).

## Asking questions

When going through this getting started guide, it is common to have questions, after all, that is part of the learning process! There are many places you could ask them to learn more about Elixir:

  * [#elixir-lang on freenode IRC](irc://irc.freenode.net/elixir-lang)
  * [Elixir on Slack](https://elixir-slackin.herokuapp.com/)
  * [elixir-talk mailing list](https://groups.google.com/group/elixir-lang-talk)
  * [elixir tag on StackOverflow](https://stackoverflow.com/questions/tagged/elixir)

When doing so, remember those two tips:

  * Instead of asking "how to do X in Elixir", ask "how to solve Y in Elixir". In other words, don't ask how to implement a particular solution, instead describe the problem at hand. Stating the problem gives more context and less bias for a correct answer.

  * In case things are not working as expected, please include as much information in your report, for example: your Elixir version, the code snippet and the error message along side the error stacktrace. Use sites like [Gist](https://gist.github.com/) to paste this information.
