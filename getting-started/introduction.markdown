---
section: getting-started
layout: getting-started
title: Introduction
---
{% assign stable = site.data.elixir-versions[site.data.elixir-versions.stable] %}

Welcome!

In this tutorial, we are going to teach you about Elixir fundamentals - the language syntax, how to define modules, how to manipulate the characteristics of common data structures, and more. This chapter will focus on ensuring that Elixir is installed and that you can successfully run Elixir's Interactive Shell, called IEx.

Our requirements are (see `elixir -v`):

  * Elixir 1.11.0 onwards
  * Erlang/OTP 22 onwards

Let's get started!

> If you find any errors in the tutorial or on the website, [please report a bug or send a pull request to our issue tracker](https://github.com/elixir-lang/elixir-lang.github.com).

## Installation

If you haven't yet installed Elixir, visit our [installation page](/install.html). Once you are done, you can run `elixir --version` to get the current Elixir version.

## Interactive mode

When you install Elixir, you will have three new executables: `iex`, `elixir` and `elixirc`. If you compiled Elixir from source or are using a packaged version, you can find these inside the `bin` directory.

For now, let's start by running `iex` (or `iex.bat` if you are on Windows PowerShell, where `iex` is a PowerShell command) which stands for Interactive Elixir. In interactive mode, we can type any Elixir expression and get its result. Let's warm up with some basic expressions.

Open up `iex` and type the following expressions:

```elixir
Erlang/OTP {{ stable.minimum_otp }} [64-bit] [smp:2:2] [...]

Interactive Elixir ({{ stable.version }}) - press Ctrl+C to exit
iex> 40 + 2
42
iex> "hello" <> " world"
"hello world"
```

Please note that some details like version numbers may differ a bit in your session; that's not important. From now on `iex` sessions will be stripped down to focus on the code. To exit `iex` press `Ctrl+C` twice.

It seems we are ready to go! We will use the interactive shell quite a lot in the next chapters to get a bit more familiar with the language constructs and basic types, starting in the next chapter.

> Note: if you are on Windows and running on an Erlang/OTP version earlier than 26, you can also try `iex --werl` (`iex.bat --werl` on PowerShell) which may provide a better experience depending on which console you are using.

## Running scripts

After getting familiar with the basics of the language you may want to try writing simple programs. This can be accomplished by putting the following Elixir code into a file:

```elixir
IO.puts("Hello world from Elixir")
```

Save it as `simple.exs` and execute it with `elixir`:

```console
$ elixir simple.exs
Hello world from Elixir
```

Later on we will learn how to compile Elixir code (in [Chapter 8](/getting-started/modules-and-functions.html)) and how to use the Mix build tool (in the [Mix & OTP guide](/getting-started/mix-otp/introduction-to-mix.html)). For now, let's move on to [Chapter 2](/getting-started/basic-types.html).
