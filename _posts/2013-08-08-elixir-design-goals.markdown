---
layout: post
title: Elixir Design Goals
author: José Valim
category: Internals
excerpt: Highlight of Elixir design goals.
---

During the last year, we have spoken at many conferences spreading the word about Elixir. We [usually started with introducing the Erlang VM](https://vimeo.com/53221562), then went on to talk about Elixir goals, saving some time at the end to do a live demo, showing some goodies like exchanging information between remote nodes and even hot code swapping.

This post is a summary of those talks, focusing on the language goals: compatibility, productivity and extensibility.

## Compatibility

Elixir is meant to be compatible with the Erlang VM and the existing ecosystem. When we talk about Erlang, we can break it into three parts:

* A functional programming language, called Erlang
* A set of design principles, called OTP
* The Erlang Virtual Machine, referred to as EVM or BEAM

Elixir runs in the same virtual machine and is compatible with OTP. Not only that, all the tools and libraries available in the Erlang ecosystem are also available in Elixir, simply because there is no conversion cost from calling Erlang from Elixir and vice-versa.

We frequently say that **the Erlang VM is Elixir's strongest asset**.

All Elixir code is executed inside light-weight processes (actors), each with its own state, that exchange messages between each other. The Erlang VM multiplexes those processes onto many cores, making it trivial to run code concurrently.

In fact if you compile any Elixir code, including the Elixir source, you will see all cores on your machine being used out of the box. With [technologies like Parallella](http://www.parallella.org/board/) becoming more accessible and affordable, it is hard to ignore the power you can get out of the Erlang VM.

Finally, the Erlang VM was designed to build systems that run forever, self-heal and scale. Joe Armstrong, one of Erlang's creators, has recently given an excellent talk [about the design decisions behind OTP and the VM](http://www.infoq.com/presentations/self-heal-scalable-system).

Nothing that we are describing here is particularly new. Open source projects like CouchDB, Riak, RabbitMQ, Chef11 and companies like Ericsson, Heroku, Basho, Klarna and Wooga are already enjoying the benefits provided by the Erlang VM, some of them for quite a long time.

## Productivity

> Now we need to go meta. We should now think of a language design as being a pattern for language designs. A tool for making more tools of the same kind. [...] A language design can no longer be a thing. It must be a pattern, a pattern for growth. A pattern for growing a pattern, for defining the patterns that programmers can use for their real work and main goals.

- Guy Steele, keynote at the 1998 ACM OOPSLA conference on "Growing a Language"

Productivity is, in general, a hard goal to measure. A language productive for creating desktop applications may not be productive for mathematical computing. Productivity depends directly on the field in which you intend to use the language, the available tools in the ecosystem and how easy it is to create and extend those tools.

For this reason, we have opted for a small language core. For example, while some languages have `if`, `case`, `try` and so on as language keywords, each with its own rules in the parser, **in Elixir they are just macros**. This allows us to implement most of Elixir in Elixir and also allows developers to extend the language using the same tools we used to build the language itself, often extending the language to the specific domains they are working on.

Here is an example of how someone would implement `unless`, which is a keyword in many languages, in Elixir:

```elixir
defmacro unless(expr, opts) do
  quote do
    if(!unquote(expr), unquote(opts))
  end
end

unless true do
  IO.puts "this will never be seen"
end
```

Since a macro receives the code representation as arguments, we can simply convert an `unless` into an `if` at compile time.

Macros are also the base construct for meta-programming in Elixir: the ability to write code that generates code. Meta-programming allows developers to easily get rid of boilerplate and create powerful tools. A common example mentioned in talks is how our test framework uses macros for expressiveness. Let's see an example:

```elixir
ExUnit.start

defmodule MathTest do
  use ExUnit.Case, async: true

  test "adding two numbers" do
    assert 1 + 2 == 4
  end
end
```

The first thing to notice is the `async: true` option. When your tests do not have any side-effects, you can run them concurrently by passing the `async: true` option.

Next we define a test case and we do an assertion with the `assert` macro. Simply calling `assert` would be a bad practice in many languages as it would provide a poor error report. In such languages, functions/methods like `assertEqual` or `assert_equal` would be the recommended way of performing such assertion.

In Elixir, however, `assert` is a macro and as such it can look into the code being asserted and infer that a comparison is being made. This code is then transformed to provide a detailed error report when the test runs:

```
1) test adding two numbers (MathTest)
   ** (ExUnit.ExpectationError)
                expected: 3
     to be equal to (==): 4
   at test.exs:7
```

This simple example illustrates how a developer can leverage macros to provide a concise but powerful API. Macros have access to the whole compilation environment, being able to check the imported functions, macros, defined variables and more.

Those examples are just scratching the surface of what can be achieved with macros in Elixir. For example, we are currently using macros to compile routes from a web application into a bunch of patterns that are highly optimizable by the VM, providing an expressive but heavily optimized routing algorithm.

The macro system also caused a huge impact on the syntax, which we will discuss briefly before moving to the last goal.

### Syntax

Although syntax is usually one of the first topics that comes up when Elixir is being discussed, it was never a goal to simply provide a different syntax. Since we wanted to provide a macro system, we knew that the macro system would only be sane if we could represent Elixir syntax in terms of Elixir's own data structures in a straight-forward fashion. With this goal in mind, we set out to design the first Elixir version, which looked like this:

```elixir
defmodule(Hello, do: (
  def(calculate(a, b, c), do: (
    =(temp, *(a, b))
    +(temp, c)
  ))
))
```

In the snippet above, we represent everything, except variables, as a function or a macro call. Notice keyword arguments like `do:` have been present since the first version. To this, we slowly added new syntax, making some common patterns more elegant while keeping the same underlying data representation. We soon added infix notation for operators:

```elixir
defmodule(Hello, do: (
  def(calculate(a, b, c), do: (
    temp = a * b
    temp + c
  ))
))
```

The next step was to make parentheses optional:

```elixir
defmodule Hello, do: (
  def calculate(a, b, c), do: (
    temp = a * b
    temp + c
  )
)
```

And finally we added `do/end` as convenience for the common `do: (...)` construct:

```elixir
defmodule Hello do
  def calculate(a, b, c) do
    temp = a * b
    temp + c
  end
end
```

Given my previous background in Ruby, it is natural that some of the constructs added were borrowed from Ruby. However, those additions were a by-product, never a language goal.

Many language constructs are also inspired by their Erlang counter-parts, like some of the control-flow macros, operators and containers. Notice how some Elixir code:

```elixir
# A tuple
tuple = { 1, 2, 3 }

# Adding two lists
[1,2,3] ++ [4,5,6]

# Case
case expr do
  { x, y } -> x + y
  other when is_integer(other) -> other
end
```

maps to Erlang:

```erlang
% A tuple
Tuple = { 1, 2, 3 }.

% Adding two lists
[1,2,3] ++ [4,5,6].

% Case
case Expr of
  { X, Y } -> X + Y;
  Other when is_integer(Other) -> Other
end.
```

## Extensibility

By building on top of a small core, most of the constructs in the language can be replaced and extended as required by developers to target specific domains. However, there is a particular domain that Elixir is inherently good at, which is building concurrent, distributed applications, thanks to OTP and the Erlang VM.

Elixir complements this domain by providing a standard library with:

* Unicode strings and unicode operations
* A powerful unit test framework
* More data structures like ranges, including novel implementations for sets and dictionaries
* Polymorphic records (in contrast to Erlang's compilation-time only records)
* Strict and lazy enumeration APIs
* Convenience functions for scripting, like working with paths and the filesystem
* A project management tool to compile and test Elixir code

And much more.

Most of the features above provide their own extensibility mechanisms, too. For example, take the `Enum` module. The `Enum` module allow us to enumerate the built-in ranges, lists, sets, etc:

```elixir
list = [1,2,3]
Enum.map list, fn(x) -> x * 2 end
#=> [2,4,6]

range = 1..3
Enum.map range, fn(x) -> x * 2 end
#=> [2,4,6]

set = HashSet.new [1,2,3]
Enum.map set, fn(x) -> x * 2 end
#=> [2,4,6]
```

Not only that, any developer can **extend** the `Enum` module to work with any data type as long as the data type implements [the `Enumerable` protocol](/docs/stable/elixir/Enumerable.html) (protocols in Elixir are based on Clojure's protocol). This is extremely convenient because the developer needs to know only the `Enum` API for enumeration, instead of memorizing specific APIs for sets, lists, dicts, etc.

There are many other protocols exposed by the language, like [the `Inspect` protocol](/docs/stable/elixir/Inspect.html) for pretty printing data structures and [the `Access` protocol](/docs/stable/elixir/Access.html) for accessing key-value data by key. By being extensible, Elixir ensures developers can work **with** the language, instead of **against** the language.

## Summing up

The goal of this post was to sumarize the language goals: compatibility, productivity and extensibility. By being compatibile with the Erlang VM, we are providing developers another toolset for building concurrent, distributed and fault-tolerant systems.

We also hope to have clarified what Elixir brings to the Erlang VM, in particular, meta-programming through macros, polymorphic constructs for extensibility and a data-focused standard library with extensible and consistent APIs for diverse types, including strict and lazy enumeration, unicode handling, a test framework and more.

Give Elixir a try! You can start with our [getting started guide](/getting-started/introduction.html), or check out our sidebar for other learning resources.
