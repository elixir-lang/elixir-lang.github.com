---
layout: getting-started
title: Module attributes
---

# {{ page.title }}

{% include toc.html %}

Module attributes in Elixir serve three purposes:

1. They serve to annotate the module, often with information to be used by the user or the <abbr title="Virtual Machine">VM</abbr>.
2. They work as constants.
3. They work as a temporary module storage to be used during compilation.

Let's check each case, one by one.

## As annotations

Elixir brings the concept of module attributes from Erlang. For example:

```elixir
defmodule MyServer do
  @vsn 2
end
```

In the example above, we are explicitly setting the version attribute for that module. `@vsn` is used by the code reloading mechanism in the Erlang <abbr title="Virtual Machine">VM</abbr> to check if a module has been updated or not. If no version is specified, the version is set to the MD5 checksum of the module functions.

Elixir has a handful of reserved attributes. Here are a few of them, the most commonly used ones:

* `@moduledoc` - provides documentation for the current module.
* `@doc` - provides documentation for the function or macro that follows the attribute.
* `@behaviour` - (notice the British spelling) used for specifying an <abbr title="Open Telecom Platform">OTP</abbr> or user-defined behaviour.
* `@before_compile` - provides a hook that will be invoked before the module is compiled. This makes it possible to inject functions inside the module exactly before compilation.

`@moduledoc` and `@doc` are by far the most used attributes, and we expect you to use them a lot. Elixir treats documentation as first-class and provides many functions to access documentation. You can read more about [writing documentation in Elixir in our official documentation](https://hexdocs.pm/elixir/writing-documentation.html).

Let's go back to the `Math` module defined in the previous chapters, add some documentation and save it to the `math.ex` file:

```elixir
defmodule Math do
  @moduledoc """
  Provides math-related functions.

  ## Examples

      iex> Math.sum(1, 2)
      3

  """

  @doc """
  Calculates the sum of two numbers.
  """
  def sum(a, b), do: a + b
end
```

Elixir promotes the use of Markdown with heredocs to write readable documentation. Heredocs are multi-line strings, they start and end with triple double-quotes, keeping the formatting of the inner text. We can access the documentation of any compiled module directly from IEx:

```console
$ elixirc math.ex
$ iex
```

```iex
iex> h Math # Access the docs for the module Math
...
iex> h Math.sum # Access the docs for the sum function
...
```

We also provide a tool called [ExDoc](https://github.com/elixir-lang/ex_doc) which is used to generate HTML pages from the documentation.

You can take a look at the docs for [Module](https://hexdocs.pm/elixir/Module.html) for a complete list of supported attributes. Elixir also uses attributes to define [typespecs](/getting-started/typespecs-and-behaviours.html).

This section covers built-in attributes. However, attributes can also be used by developers or extended by libraries to support custom behaviour.

## As "constants"

Elixir developers will often use module attributes as constants:

```elixir
defmodule MyServer do
  @initial_state %{host: "127.0.0.1", port: 3456}
  IO.inspect @initial_state
end
```

> Note: Unlike Erlang, user defined attributes are not stored in the module by default. The value exists only during compilation time. A developer can configure an attribute to behave closer to Erlang by calling [`Module.register_attribute/3`](https://hexdocs.pm/elixir/Module.html#register_attribute/3).

Trying to access an attribute that was not defined will print a warning:

```elixir
defmodule MyServer do
  @unknown
end
warning: undefined module attribute @unknown, please remove access to @unknown or explicitly set it before access
```

Finally, attributes can also be read inside functions:

```elixir
defmodule MyServer do
  @my_data 14
  def first_data, do: @my_data
  @my_data 13
  def second_data, do: @my_data
end

MyServer.first_data #=> 14
MyServer.second_data #=> 13
```

Every time an attribute is read inside a function, a snapshot of its current value is taken. In other words, the value is read at compilation time and not at runtime. As we are going to see, this also makes attributes useful to be used as storage during module compilation.

Any functions may be called when defining a module attribute.

When defining an attribute, do not leave a line break between the attribute name and its value.

## As temporary storage

One of the projects in the Elixir organization is [the `Plug` project](https://github.com/elixir-lang/plug), which is meant to be a common foundation for building web libraries and frameworks in Elixir.

The Plug library also allows developers to define their own plugs which can be run in a web server:

```elixir
defmodule MyPlug do
  use Plug.Builder

  plug :set_header
  plug :send_ok

  def set_header(conn, _opts) do
    put_resp_header(conn, "x-header", "set")
  end

  def send_ok(conn, _opts) do
    send_resp(conn, 200, "ok")
  end
end

IO.puts "Running MyPlug with Cowboy on http://localhost:4000"
Plug.Adapters.Cowboy.http MyPlug, []
```

In the example above, we have used the `plug/1` macro to connect functions that will be invoked when there is a web request. Internally, every time you call `plug/1`, the Plug library stores the given argument in a `@plugs` attribute. Just before the module is compiled, Plug runs a callback that defines a function (`call/2`) which handles HTTP requests. This function will run all plugs inside `@plugs` in order.

In order to understand the underlying code, we'd need macros, so we will revisit this pattern in the meta-programming guide. However, the focus here is on how using module attributes as storage allows developers to create DSLs.

Another example comes from [the ExUnit framework](https://hexdocs.pm/ex_unit/) which uses module attributes as annotation and storage:

```elixir
defmodule MyTest do
  use ExUnit.Case

  @tag :external
  test "contacts external service" do
    # ...
  end
end
```

Tags in ExUnit are used to annotate tests. Tags can be later used to filter tests. For example, you can avoid running external tests on your machine because they are slow and dependent on other services, while they can still be enabled in your build system.

We hope this section shines some light on how Elixir supports meta-programming and how module attributes play an important role when doing so.

In the next chapters, we'll explore structs and protocols before moving to exception handling and other constructs like sigils and comprehensions.
