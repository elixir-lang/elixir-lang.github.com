---
layout: getting-started
title: Modules and functions
redirect_from: /getting-started/modules.html
---

# {{ page.title }}

{% include toc.html %}

In Elixir we group several functions into modules. We've already used many different modules in the previous chapters such as [the `String` module](https://hexdocs.pm/elixir/String.html):

```iex
iex> String.length("hello")
5
```

In order to create our own modules in Elixir, we use the `defmodule` macro. We use the `def` macro to define functions in that module:

```iex
iex> defmodule Math do
...>   def sum(a, b) do
...>     a + b
...>   end
...> end

iex> Math.sum(1, 2)
3
```

In the following sections, our examples are going to get longer in size, and it can be tricky to type them all in the shell. It's about time for us to learn how to compile Elixir code and also how to run Elixir scripts.

## Compilation

Most of the time it is convenient to write modules into files so they can be compiled and reused. Let's assume we have a file named `math.ex` with the following contents:

```elixir
defmodule Math do
  def sum(a, b) do
    a + b
  end
end
```

This file can be compiled using `elixirc`:

```console
$ elixirc math.ex
```

This will generate a file named `Elixir.Math.beam` containing the bytecode for the defined module. If we start `iex` again, our module definition will be available (provided that `iex` is started in the same directory the bytecode file is in):

```iex
iex> Math.sum(1, 2)
3
```

Elixir projects are usually organized into three directories:

* ebin - contains the compiled bytecode
* lib - contains elixir code (usually `.ex` files)
* test - contains tests (usually `.exs` files)

When working on actual projects, the build tool called `mix` will be responsible for compiling and setting up the proper paths for you. For learning purposes, Elixir also supports a scripted mode which is more flexible and does not generate any compiled artifacts.

## Scripted mode

In addition to the Elixir file extension `.ex`, Elixir also supports `.exs` files for scripting. Elixir treats both files exactly the same way, the only difference is in intention. `.ex` files are meant to be compiled while `.exs` files are used for scripting. When executed, both extensions compile and load their modules into memory, although only `.ex` files write their bytecode to disk in the format of `.beam` files.

For instance, we can create a file called `math.exs`:

```elixir
defmodule Math do
  def sum(a, b) do
    a + b
  end
end

IO.puts Math.sum(1, 2)
```

And execute it as:

```console
$ elixir math.exs
```

The file will be compiled in memory and executed, printing "3" as the result. No bytecode file will be created. In the following examples, we recommend you write your code into script files and execute them as shown above.

## Named functions

Inside a module, we can define functions with `def/2` and private functions with `defp/2`. A function defined with `def/2` can be invoked from other modules while a private function can only be invoked locally.

```elixir
defmodule Math do
  def sum(a, b) do
    do_sum(a, b)
  end

  defp do_sum(a, b) do
    a + b
  end
end

IO.puts Math.sum(1, 2)    #=> 3
IO.puts Math.do_sum(1, 2) #=> ** (UndefinedFunctionError)
```

Function declarations also support guards and multiple clauses. If a function has several clauses, Elixir will try each clause until it finds one that matches. Here is an implementation of a function that checks if the given number is zero or not:

```elixir
defmodule Math do
  def zero?(0) do
    true
  end

  def zero?(x) when is_integer(x) do
    false
  end
end

IO.puts Math.zero?(0)         #=> true
IO.puts Math.zero?(1)         #=> false
IO.puts Math.zero?([1, 2, 3]) #=> ** (FunctionClauseError)
IO.puts Math.zero?(0.0)       #=> ** (FunctionClauseError)
```

*The trailing question mark in `zero?` means that this function returns a boolean; see [Naming Conventions](https://hexdocs.pm/elixir/master/naming-conventions.html#trailing-question-mark-foo).*

Giving an argument that does not match any of the clauses raises an error.

Similar to constructs like `if`, named functions support both `do:` and `do`/`end` block syntax, as [we learned `do`/`end` is a convenient syntax for the keyword list format](/getting-started/case-cond-and-if.html#doend-blocks). For example, we can edit `math.exs` to look like this:

```elixir
defmodule Math do
  def zero?(0), do: true
  def zero?(x) when is_integer(x), do: false
end
```

And it will provide the same behaviour. You may use `do:` for one-liners but always use `do`/`end` for functions spanning multiple lines.

## Function capturing

Throughout this tutorial, we have been using the notation `name/arity` to refer to functions. It happens that this notation can actually be used to retrieve a named function as a function type. Start `iex`, running the `math.exs` file defined above:

```console
$ iex math.exs
```

```iex
iex> Math.zero?(0)
true
iex> fun = &Math.zero?/1
&Math.zero?/1
iex> is_function(fun)
true
iex> fun.(0)
true
```

Remember Elixir makes a distinction between anonymous functions and named functions, where the former must be invoked with a dot (`.`) between the variable name and parentheses. The capture operator bridges this gap by allowing named functions to be assigned to variables and passed as arguments in the same way we assign, invoke and pass anonymous functions.

Local or imported functions, like `is_function/1`, can be captured without the module:

```iex
iex> &is_function/1
&:erlang.is_function/1
iex> (&is_function/1).(fun)
true
```

Note the capture syntax can also be used as a shortcut for creating functions:

```iex
iex> fun = &(&1 + 1)
#Function<6.71889879/1 in :erl_eval.expr/5>
iex> fun.(1)
2

iex> fun2 = &"Good #{&1}"
#Function<6.127694169/1 in :erl_eval.expr/5>
iex)> fun2.("morning")
"Good morning"
```

The `&1` represents the first argument passed into the function. `&(&1 + 1)` above is exactly the same as `fn x -> x + 1 end`. The syntax above is useful for short function definitions.

If you want to capture a function from a module, you can do `&Module.function()`:

```iex
iex> fun = &List.flatten(&1, &2)
&List.flatten/2
iex> fun.([1, [[2], 3]], [4, 5])
[1, 2, 3, 4, 5]
```

`&List.flatten(&1, &2)` is the same as writing `fn(list, tail) -> List.flatten(list, tail) end` which in this case is equivalent to `&List.flatten/2`. You can read more about the capture operator `&` in [the `Kernel.SpecialForms` documentation](https://hexdocs.pm/elixir/Kernel.SpecialForms.html#&/1).

## Default arguments

Named functions in Elixir also support default arguments:

```elixir
defmodule Concat do
  def join(a, b, sep \\ " ") do
    a <> sep <> b
  end
end

IO.puts Concat.join("Hello", "world")      #=> Hello world
IO.puts Concat.join("Hello", "world", "_") #=> Hello_world
```

Any expression is allowed to serve as a default value, but it won't be evaluated during the function definition. Every time the function is invoked and any of its default values have to be used, the expression for that default value will be evaluated:

```elixir
defmodule DefaultTest do
  def dowork(x \\ "hello") do
    x
  end
end
```

```iex
iex> DefaultTest.dowork
"hello"
iex> DefaultTest.dowork 123
123
iex> DefaultTest.dowork
"hello"
```

If a function with default values has multiple clauses, it is required to create a function head (without an actual body) for declaring defaults:

```elixir
defmodule Concat do
  def join(a, b \\ nil, sep \\ " ")

  def join(a, b, _sep) when is_nil(b) do
    a
  end

  def join(a, b, sep) do
    a <> sep <> b
  end
end

IO.puts Concat.join("Hello", "world")      #=> Hello world
IO.puts Concat.join("Hello", "world", "_") #=> Hello_world
IO.puts Concat.join("Hello")               #=> Hello
```

*The leading underscore in `_sep` means that the variable will be ignored in this function; see [Naming Conventions](https://hexdocs.pm/elixir/master/naming-conventions.html#underscore-_foo).*

When using default values, one must be careful to avoid overlapping function definitions. Consider the following example:

```elixir
defmodule Concat do
  def join(a, b) do
    IO.puts "***First join"
    a <> b
  end

  def join(a, b, sep \\ " ") do
    IO.puts "***Second join"
    a <> sep <> b
  end
end
```

If we save the code above in a file named "concat.ex" and compile it, Elixir will emit the following warning:

    warning: this clause cannot match because a previous clause at line 2 always matches

The compiler is telling us that invoking the `join` function with two arguments will always choose the first definition of `join` whereas the second one will only be invoked when three arguments are passed:

```console
$ iex concat.exs
```

```iex
iex> Concat.join "Hello", "world"
***First join
"Helloworld"
```

```iex
iex> Concat.join "Hello", "world", "_"
***Second join
"Hello_world"
```

This finishes our short introduction to modules. In the next chapters, we will learn how to use named functions for recursion, explore Elixir lexical directives that can be used for importing functions from other modules and discuss module attributes.
