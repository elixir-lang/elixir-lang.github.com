---
layout: post
title: Elixir v0.8.2 released
author: José Valim
category: Releases
excerpt: Elixir v0.8.2 is released with bug fixes, better Erlang R16 support and doctests.
---

The past week we have released Elixir v0.8.2. It contains many bug fixes and better support for Erlang R16, including [the new built-in functions `insert_elem/3` and `delete_elem/2`](https://github.com/elixir-lang/elixir/commit/0fad1883df9da541628e8485d28372fd4b977b89).

We have also added extensive support to ANSI escape codes. For example, by simply upgrading to the latest Elixir you will get colored output from your test suites:

![ANSI escape with ExUnit](/images/contents/exunit-ansi.png)

We have also added colored output to Interactive Elixir (IEx) but it requires Erlang R16.

Finally, Elixir has always given special attention to documentation. You can easily document functions with the `@doc` attribute:

```elixir
defmodule Math do
  @doc """
  Add two numbers together.

  ## Examples

      iex> Math.add(1, 2)
      3

  """
  def add(a, b) do
    a + b
  end
end
```

The documentation above is embedded into the module and can be easily retrieved at runtime. For example, by typing `h Math.add/2` into Interactive Elixir, we can access the documentation for that module.

Elixir v0.8.2 takes this to the next level by adding support to doctests. Given the example above, you can configure Elixir to automatically run the code samples in your documentation by including a call to the `doctest` macro in your test suite:

```elixir
defmodule MathTest do
  use ExUnit.Case, async: true
  doctest Math
end
```

You can learn more about [doctests on our documentation page](https://hexdocs.pm/ex_unit/ExUnit.DocTest.html) and get more information about our latest release [on the CHANGELOG](https://github.com/elixir-lang/elixir/blob/ed27611f48ba150404c95fe15f1d6058a4287330/CHANGELOG.md).

If you are new to Elixir, [it's easy to get started with](https://hexdocs.pm/elixir/introduction.html)!
