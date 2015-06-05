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

> If you find any errors in the tutorial or on the website, [please report a bug or send a pull request to our issue tracker](https://github.com/elixir-lang/elixir-lang.github.com).

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

> Note: if you are on Windows, you can also try `iex --werl` which may provide a better experience depending on which console you are using.

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
