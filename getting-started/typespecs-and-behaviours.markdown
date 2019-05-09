---
layout: getting-started
title: Typespecs and behaviours
---

# {{ page.title }}

{% include toc.html %}

## Types and specs

Elixir is a dynamically typed language, so all types in Elixir are inferred by the runtime. Nonetheless, Elixir comes with **typespecs**, which are a notation used for:

1. declaring typed function signatures (specifications);
2. declaring custom data types.

### Function specifications

By default, Elixir provides some basic types, such as `integer` or `pid`, as well as more complex types: for example, the `round/1` function, which rounds a float to its nearest integer, takes a `number` as an argument (an `integer` or a `float`) and returns an `integer`. As you can see [in its documentation](https://hexdocs.pm/elixir/Kernel.html#round/1), `round/1`'s typed signature is written as:

```elixir
round(number) :: integer
```

`::` means that the function on the left side *returns* a value whose type is what's on the right side. Function specs are written with the `@spec` directive, placed right before the function definition. The `round/1` function could be written as:

```elixir
@spec round(number) :: integer
def round(number), do: # implementation...
```

Elixir supports compound types as well. For example, a list of integers has type `[integer]`. You can see all the built-in types provided by Elixir [in the typespecs docs](https://hexdocs.pm/elixir/typespecs.html).

### Defining custom types

While Elixir provides a lot of useful built-in types, it's convenient to define custom types when appropriate. This can be done when defining modules through the `@type` directive.

Say we have a `LousyCalculator` module, which performs the usual arithmetic operations (sum, product, and so on) but, instead of returning numbers, it returns tuples with the result of an operation as the first element and a random remark as the second element.

```elixir
defmodule LousyCalculator do
  @spec add(number, number) :: {number, String.t}
  def add(x, y), do: {x + y, "You need a calculator to do that?!"}

  @spec multiply(number, number) :: {number, String.t}
  def multiply(x, y), do: {x * y, "Jeez, come on!"}
end
```

As you can see in the example, tuples are a compound type and each tuple is identified by the types inside it. To understand why `String.t` is not written as `string`, have another look at the [typespecs docs](https://hexdocs.pm/elixir/typespecs.html#the-string-type).

Defining function specs this way works, but it quickly becomes annoying since we're repeating the type `{number, String.t}` over and over. We can use the `@type` directive in order to declare our own custom type.

```elixir
defmodule LousyCalculator do
  @typedoc """
  Just a number followed by a string.
  """
  @type number_with_remark :: {number, String.t}

  @spec add(number, number) :: number_with_remark
  def add(x, y), do: {x + y, "You need a calculator to do that?"}

  @spec multiply(number, number) :: number_with_remark
  def multiply(x, y), do: {x * y, "It is like addition on steroids."}
end
```

The `@typedoc` directive, similarly to the `@doc` and `@moduledoc` directives, is used to document custom types.

Custom types defined through `@type` are exported and available outside the module they're defined in:

```elixir
defmodule QuietCalculator do
  @spec add(number, number) :: number
  def add(x, y), do: make_quiet(LousyCalculator.add(x, y))

  @spec make_quiet(LousyCalculator.number_with_remark) :: number
  defp make_quiet({num, _remark}), do: num
end
```

If you want to keep a custom type private, you can use the `@typep` directive instead of `@type`.

### Static code analysis

Typespecs are not only useful to developers as additional documentation. The Erlang tool [Dialyzer](http://www.erlang.org/doc/man/dialyzer.html), for example, uses typespecs in order to perform static analysis of code. That's why, in the `QuietCalculator` example, we wrote a spec for the `make_quiet/1` function even though it was defined as a private function.

## Behaviours

Many modules share the same public API. Take a look at [Plug](https://github.com/elixir-lang/plug), which, as its description states, is a **specification** for composable modules in web applications. Each *plug* is a module which **has to** implement at least two public functions: `init/1` and `call/2`.

Behaviours provide a way to:

* define a set of functions that have to be implemented by a module;
* ensure that a module implements all the functions in that set.

If you have to, you can think of behaviours like interfaces in object oriented languages like Java: a set of function signatures that a module has to implement.

### Defining behaviours

Say we want to implement a bunch of parsers, each parsing structured data: for example, a JSON parser and a MessagePack parser. Each of these two parsers will *behave* the same way: both will provide a `parse/1` function and an `extensions/0` function. The `parse/1` function will return an Elixir representation of the structured data, while the `extensions/0` function will return a list of file extensions that can be used for each type of data (e.g., `.json` for JSON files).

We can create a `Parser` behaviour:

```elixir
defmodule Parser do
  @callback parse(String.t) :: {:ok, term} | {:error, String.t}
  @callback extensions() :: [String.t]
end
```

Modules adopting the `Parser` behaviour will have to implement all the functions defined with the `@callback` directive. As you can see, `@callback` expects a function name but also a function specification like the ones used with the `@spec` directive we saw above. Also note that the `term` type is used to represent the parsed value. In Elixir, the `term` type is a shortcut to represent any type.

### Adopting behaviours

Adopting a behaviour is straightforward:

```elixir
defmodule JSONParser do
  @behaviour Parser

  @impl Parser
  def parse(str), do: {:ok, "some json " <> str} # ... parse JSON
  
  @impl Parser
  def extensions, do: ["json"]
end
```

```elixir
defmodule YAMLParser do
  @behaviour Parser

  @impl Parser
  def parse(str), do: {:ok, "some yaml " <> str} # ... parse YAML
  
  @impl Parser
  def extensions, do: ["yml"]
end
```

If a module adopting a given behaviour doesn't implement one of the callbacks required by that behaviour, a compile-time warning will be generated.

Furthermore, with `@impl` you can also make sure that you are implementing the **correct** callbacks from the given behaviour in an explicit manner. For example, the following parser implements both `parse` and `extensions`, however thanks to a typo, `BADParser` is implementing `parse/0` instead of `parse/1`.

```elixir
defmodule BADParser do
  @behaviour Parser

  @impl Parser
  def parse, do: {:ok, "something bad"}
  
  @impl Parser
  def extensions, do: ["bad"]
end
```

This code generates a warning letting you know that you are mistakenly implementing `parse/0` instead of `parse/1`.
You can read more about `@impl` in the [module documentation](https://hexdocs.pm/elixir/master/Module.html#module-impl).

### Dynamic dispatch

Behaviours are frequently used with dynamic dispatching. For example, we could add a `parse!` function to the `Parser` module that dispatches to the given implementation and returns the `:ok` result or raises in cases of `:error`:

```elixir
defmodule Parser do
  @callback parse(String.t) :: {:ok, term} | {:error, String.t}
  @callback extensions() :: [String.t]

  def parse!(implementation, contents) do
    case implementation.parse(contents) do
      {:ok, data} -> data
      {:error, error} -> raise ArgumentError, "parsing error: #{error}"
    end
  end
end
```

Note you don't need to define a behaviour in order to dynamically dispatch on a module, but those features often go hand in hand.
