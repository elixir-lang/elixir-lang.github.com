---
layout: getting_started
title: 3 Domain Specific Languages
guide: 3
last: true
---

# {{ page.title }}

{% include toc.html %}

[Domain Specific Languages](https://en.wikipedia.org/wiki/Domain-specific_language) allow developers to tailor their application to a particular domain. There are many language features that, when used in combination, can aid developers to write Domain Specific Languages. In this chapter we will focus on how macros and module attributes can be used together to create domain specific modules that are focused on solving one particular problem. As an example, we will write a very simple module to define and run tests.

The goal is to build a module named `TestCase` that allows us to write the following:

```elixir
defmodule MyTest do
  use TestCase

  test "arithmetic operations" do
    4 = 2 + 2
  end

  test "list operations" do
    [1, 2, 3] = [1, 2] ++ [3]
  end
end

MyTest.run
```

In the example above, by using `TestCase`, we can write tests using the `test` macro, which defines a function named `run` to automatically run all tests for us. Our prototype will simply rely on the match operator (`=`) as a mechanism to do assertions.

## 3.1 The `test` macro

Let's start by creating a module that simply defines and imports the `test` macro when used:

```elixir
defmodule TestCase do
  # Callback invoked by `use`.
  #
  # For now it simply returns a quoted expression that
  # imports the module itself into the user code.
  @doc false
  defmacro __using__(_opts) do
    quote do
      import TestCase
    end
  end

  @doc """
  Defines a test case with the given description.

  ## Examples

      test "arithmetic operations" do
        4 = 2 + 2
      end

  """
  defmacro test(description, do: block) do
    function_name = String.to_atom("test " <> description)
    quote do
      def unquote(function_name)(), do: unquote(block)
    end
  end
end
```

Assuming we defined `TestCase` in a file named `tests.exs`, we can open it up by running `iex tests.exs` and define our first tests:

```iex
iex> defmodule MyTest do
...>   use TestCase
...>
...>   test "hello" do
...>     "hello" = "world"
...>   end
...> end
```

For now we don't have a mechanism to run tests, but we know that a function named "test hello" was defined behind the scenes. When we invoke it, it should fail:

```iex
iex> MyTest."test hello"()
** (MatchError) no match of right hand side value: "world"
```

## 3.2 Storing information with attributes

In order to finish our `TestCase` implementation, we need to be able to access all defined test cases. One way of doing this is by retrieving the tests at runtime via `__MODULE__.__info__(:functions)`, which returns a list of all functions in a given module. However, considering that we may want to store more information about each test besides the test name, a more flexible approach is required.

When discussing module attributes in earlier chapters, we mentioned how they can be used as temporary storage. That's exactly the property we will apply in this section.

In the `__using__/1` implementation, we will initialize a module attribute named `@tests` to an empty list, then store the name of each defined test in this attribute so the tests can be invoked from the `run` function.

Here is the updated code for the `TestCase` module:

```elixir
defmodule TestCase do
  @doc false
  defmacro __using__(_opts) do
    quote do
      import TestCase

      # Initialize @tests to an empty list
      @tests []

      # Invoke TestCase.__before_compile__/1 before the module is compiled
      @before_compile TestCase
    end
  end

  @doc """
  Defines a test case with the given description.

  ## Examples

      test "arithmetic operations" do
        4 = 2 + 2
      end

  """
  defmacro test(description, do: block) do
    function_name = String.to_atom("test " <> description)
    quote do
      # Prepend the newly defined test to the list of tests
      @tests [unquote(function_name)|@tests]
      def unquote(function_name)(), do: unquote(block)
    end
  end

  # This will be invoked right before the target module is compiled
  # giving us the perfect opportunity to inject the `run/0` function
  @doc false
  defmacro __before_compile__(env) do
    quote do
      def run do
        Enum.each @tests, fn name ->
          IO.puts "Running #{name}"
          apply(__MODULE__, name, [])
        end
      end
    end
  end
end
```

By starting a new IEx session, we can now define our tests and run them:

```iex
iex> defmodule MyTest do
...>   use TestCase
...>
...>   test "hello" do
...>     "hello" = "world"
...>   end
...> end
iex> MyTest.run
Running test hello
** (MatchError) no match of right hand side value: "world"
```

Although we have overlooked some details, this is the main idea behind creating domain specific modules in Elixir. Macros enable us to return quoted expressions that are executed in the caller, which we can then use to transform code and store relevant information in the target module via module attributes. Finally, callbacks such as `@before_compile` allow us to inject code into the module when its definition is complete.

Besides `@before_compile`, there are other useful module attributes like `@on_definition` and `@after_compile`, which you can read more about in [the docs for the `Module` module](/docs/stable/elixir/Module.html). You can also find useful information about macros and the compilation environment in the documentation for the [`Macro` module](/docs/stable/elixir/Macro.html) and [`Macro.Env`](/docs/stable/elixir/Macro.Env.html).
