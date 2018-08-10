---
layout: post
title: Google Summer of Code 2018 projects
author: Andrea Leopardi
category: Announcements
excerpt: Once again Elixir is participating in Google Summer of Code 2018. In this post, we'll have a look at the active projects.
---

Like previous years, the Elixir community is happy to participate in [Google Summer of Code][gsoc] 2018. We are currently working on four different projects. Let's have a look at them.

## StreamData integration with typespecs

*Student: Nikola Jichev*

[StreamData][stream_data] is a data-generation and property-based testing library for Elixir. The goal of this GSoC project is to integrate StreamData with typespecs.

The data-generation side of StreamData provides tools to generate random data through composable generators. For example, you could generate keyword lists like this:

```elixir
import StreamData

keywords_generator = list_of({atom(:alphanumeric), term()})

Enum.take(keywords_generator, 2)
#=> [[_: [true]], [tm: 2, h: %{}]]
```

In many cases, it would be useful to be able to generate such random data starting from already existing or user-defined types. For example, Elixir already provides a built-in `keyword/0` type for keyword lists defined roughly as:

```elixir
@type keyword() :: [{atom(), any()}]
```

The goal of the first part of this GSoC project is to provide StreamData with the ability to create data generators from type definitions. The API is not yet defined, but in this case, it could look something like the following:

```elixir
import StreamData

keywords_generator = from_type(keyword/0)

Enum.take(keywords_generator, 2)
#=> [[_: [true]], [tm: 2, h: %{}]]
```

In the second part of the GSoC project, the aim is to be able to property-test functions with specs automatically.

```elixir
@spec has_key?(keyword(), atom()) :: boolean()
def has_key?(keyword, key) do
  # ...
end
```

The first part of the project focuses on generating data from types, so we know how to generate function arguments. The missing piece is **validating** that a given term *belongs to* a given type. For example, in the snippet above, we want to be able to check if a term is a `boolean()`. Once we're able to do this, automatic spec validation will be straightforward: it will be a matter of generating random arguments for the given function, calling the function with those arguments, and asserting that the returned value belongs to the return type defined in the spec.

This kind of property-based testing doesn't test for *correctness*. In the snippet above, `has_key?/2` could be implemented to ignore arguments always return `false` and the automatic spec validation would pass since `false` is always a boolean. However, this is a kind of **smoke testing** useful for discovering inconsistencies in the arguments and return values of functions.

## Tensorflex: Tensorflow bindings for the Elixir programming language

*Student: Anshuman Chhabra*

Currently, there is a lack of machine learning tools and frameworks for Elixir. With the number of programmers learning/using machine learning only set to grow, supporting machine learning capabilities is essential for any programming language. Moreover, there are discussions on [ElixirForum][elixirforum] regarding this and recent talks given at ElixirConf that reflect the need for Elixir to provide machine learning capabilities.

This project's goal is Tensorflex, an Elixir machine learning framework similar to [Keras for Python][keras]. Keras uses Tensorflow as a backend for doing all the machine learning. Tensorflex will use Using Native Implemented Functions (NIFs) and the Tensorflow C API as a backend to provide a low-level API. This low-level API will then be used to write a Keras-like framework in the form of a high-level API. This will allow Elixir developers to write expedient and efficient machine learning code in Elixir.

## Dialyzer task for Elixir

*Student: Gabriel Gatu*

Dialyzer is a discrepancy analyzer that ships as part of Erlang/OTP. Currently, there are two projects that add Dialyzer support to Elixir applications: [dialyxir][] and [dialyzex][]. The goal of this project is to bring ideas from both projects into Elixir itself in order to make using Dialyzer in Elixir projects easier. The task we aim to add to Elixir will focus on two main features: better user experience (in particular, better error messages and formatting) and the ability to analyze projects incrementally.

## ElixirBench

*Student: Tallys Martins*

ElixirBench aims to be a service to monitor performance of Elixir projects. The goal of the GSoC project is to bring ElixirBench up and have it run nightly performance monitoring of significant Elixir projects (including Elixir itself). The end goal is to have a platform that, given a project from GitHub, will monitor the performance of new releases of that project and look for performance regressions. The benchmarking process will be controlled through a configuration file that will specify the benchmark scripts to run.

We have high hopes for this tool as we see value in it for the whole community and for core Elixir projects alike.

[gsoc]: https://summerofcode.withgoogle.com
[stream_data]: https://github.com/whatyouhide/stream_data
[elixirforum]: https://elixirforum.com
[keras]: https://keras.io
[dialyxir]: https://github.com/jeremyjh/dialyxir
[dialyzex]: https://github.com/Comcast/dialyzex
