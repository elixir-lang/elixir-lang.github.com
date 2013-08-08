---
layout: post
title: Elixir Design Goals
author: José Valim
category: Internals
excerpt: Highlight of Elixir design goals.
---

During the last year, I have spoken at many conferences spreading the word about Elixir. [My talk](http://vimeo.com/53221562) started with introducing the Erlang VM, then I went on to talk about Elixir goals, saving some time at the end to do a live demo, showing some goodies like exchange information in between remote nodes and even hot code swapping.

This post is a summary of the talk, focusing on the language goals: compatibility, productivity and extensibility.

## Compatibility

Elixir is meant to be compatible with the Erlang VM and the existing ecosystem. When we talk about Erlang, we can break it into three parts:

* A functional programming language, called Erlang
* A set of design principles, called OTP
* The Erlang Virtual Machine, referred as EVM or BEAM

Elixir runs in the same virtual machine and is compatible with OTP. Not only that, all the tools and libraries available in the Erlang ecosystem are also available in Elixir simply because there is no conversion cost from calling Erlang from Elixir and vice-versa.

I frequently say that **the Erlang VM is Elixir's strongest asset**.

A regular Elixir code is organized inside light-weight processes (actors), each with its own state, that exchange messages in between them. The Erlang VM multiplexes those processes into many cores, making it trivial to run code concurrently.

In fact if you compile any Elixir code, including Elixir source, you will see all cores on your machine being used. With [technologies like Parallella](http://www.parallella.org/board/) becoming more accessible and affordable, it is hard to ignore the power you can get out of the Erlang VM.

Finally, the Erlang VM was designed to build systems that run forever, self-head and scale. Joe Armstrong, one of Erlang creators, has recently given an excellent talk [about the design decisions behind OTP and the VM](http://www.infoq.com/presentations/self-heal-scalable-system).

Nothing that I am saying here is particularly new. Open source projects like CouchDB, Riak, RabbitMQ, Chef11 and companies like Ericsson, Heroku, Basho, Klarna and Wooga are already enjoying the benefits provided by the Erlang VM, some of them for quite a long time.

## Productivity

Productivity is in general a hard to measure goal. A language productive for creating desktop applications may not be productive for technical computing. Productivity depends directly on the field you intend to use the language, the available tools in the ecosystem and how easy it is to create and extend those tools.

For this reason, we have opted for a small language core. While many languages have `if`, `case`, `try` and so on as language keywords, each with its own rules in the parser, **in Elixir they are just macros**. This allows us to implement most of Elixir in Elixir and also allows developers to extend the language by providing better constructs specific to the domain they are working on (the so-called DSLs).

Here is for example how someone would implement `unless`, which is a keyword in many languages, in Elixir:

```elixir
def unless(expr, opts) do
  quote do
    if(!unquote(expr), unquote(opts))
  end
end

unless true do
  IO.puts "this will never be seen"
end
```

Since a macro receives the code representation instead of its arguments, we can simply convert it into an `if` at compilation time.

Macros are also the base construct for meta-programming in Elixir: the ability of writing code that writes code. Meta-programming allows developers to easily get rid of boilerplate and create powerful tools.  On my talks, I usually mention how our test framework uses macros for expressiveness. Let's see a simple example:

```elixir
ExUnit.start

defmodule MathTest do
  use ExUnit.Case, async: true
  
  test "adding two numbers" do
    assert 1 + 2 == 4
  end
end
```

The first thing to notice is the `async: true` option. When your tests do not have any side-effect, you can run them concurrenctly by passing the `async: true` option.

Next we define a test case and we do an assertion with the `assert` macro. Simply calling `assert` would be a bad practice in many languages, since it would provide a poor error report. In such languages, functions/methods like `assertEqual` or `assert_equal` would be the recommended way of performing such assertion.

In Elixir however `assert` is a macro and as such it can look into the code being asserted and infer that a comparison is being made. This code is then transformed to provide a detailed error report when the test runs:

```
Failures:

  1) test adding two numbers (MathTest)
     ** (ExUnit.ExpectationError)
                  expected: 3
       to be equal to (==): 4
     at test.exs:7
```

This very simply example illustrates how a developer can leverage macros to provide a concise but powerful API. Macros have access to the whole compilation environment, being able to check imported functions, macros and defined variables.

Those examples are just scratching the surface of what can be achieved with macros in Elixir. In some talks I mentioned how we can use macros to compile routes from a web application into a bunch of patterns that are highly optimizable by the VM, providing an expressive but heavily optimized routing algorithm.

The macro system also caused a huge imapct on the syntax, which we will discuss briefly before moving to our last goal.

### Syntax

Although syntax is usually one of the first topics that come out when Elixir is being discussed, it was never a goal to simply provide a different syntax. Since we wanted to provide a macro system, we knew that the macro system would only be sane if we could represent Elixir syntax in terms of Elixir own data structures in a straight-forward fashion. With this goal in mind, we set out to design the first Elixir version, which looked like this:

```elixir
defmodule(Hello, do: (
  def(calculate(a, b, c), do: (
    =(temp, *(a, b))
    +(temp, c)
  ))
))
```

In the snippet above, we represent everything, except variables, as a function or a macro call. Notice keywords were common since the first version. From this, we slowly added new syntax, making some common patterns more elegant while keeping the same underlying data representation. We soon added operators:

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

And finally we added `do/end` as delimiters for the common `do: (...)` construct:

```elixir
defmodule Hello do
  def calculate(a, b, c) do
    temp = a * b
    temp + c
  end
end
```

Given my previous background in Ruby, it is natural that some of the constructs added were borrowed from Ruby. However, those additions were a by-product, never a language goal.

Many language constructs are also based on their Erlang counter-parts, like some of the control-flow macros, operators and containers. Notice how some Elixir code:

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

When talking about productivity, we had a glimpsy about extensibility in Elixir. By building on top of a small core, most of the constructs in the language can be replaced and extended by developers for specific domains. However, there is a particular domain that Elixir is inherently good at, which is building concurrent, distributed applications, thanks to OTP and the Erlang VM.

Elixir complements this domain by providing a standard library with:

* Unicode strings and unicode operations
* A unit test framework
* Sets, Lists, Dictionaries and Ranges
* Polymorphic records (in contrast to Erlang's compilation-time only records)
* Strict and lazy enumeration APIs
* An interactive shell
* Functions for working with paths and the file system
* A project management tool to compile and test Elixir code

And much more.

Most of the features above provide their own extensibility mechanisms too. For example, take the `Enum` module. The `Enum` module can work against the built-in ranges, lists, sets, etc:

```elixir
list = 1..3
Enum.map list, fn(x) -> x * 2 end
#=> [2,4,6]

range = 1..3
Enum.map range, fn(x) -> x * 2 end
#=> [2,4,6]

set = HashSet.new [1,2,3]
Enum.map set, fn(x) -> x * 2 end
#=> [2,4,6]
```

Not only that, any developer can **extend** the `Enum` module to work with any data type as long as the data type implements the `Enumerable` protocol (protocols in Elixir are based on Clojure's protocol). This is extremely convenient because the developer needs to know only the `Enum` API for enumeration, instead of memorizing a specific API for enumerating sets, another for lists, another for dicts, etc.

There are many other protocols exposed by the language, like the inspect protocol for pretty printing data structures and the access protocol for accessing key-value data by key. By being extensible, Elixir ensures developers can work **with** the language, instead of **against** the language.

## Summing up

The goal of this post was to sumarize the language goals: compatibility, productivity and extensibility. By being compatibile with the Erlang VM, we are providing developers another approach for building concurrent, distributed and fault-tolerant systems.

We also hope to have clarified what Elixir offers in addition to what exists in the Erlang VM today, in particular, meta-programming through macros, polymorphic constructs for extensibility and a data-focused standard library with powerful and consistent APIs for different types, including strict and lazy enumeration, unicode handling, a test framework and more.

Give Elixir a try! You can start with our [getting started guide](http://elixir-lang.org/getting_started/1.html), or check out our sidebar for other learning resources.
