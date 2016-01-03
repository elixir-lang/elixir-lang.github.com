---
layout: getting-started
title: alias, require and import
redirect_from: /getting_started/13.html
---

# {{ page.title }}

{% include toc.html %}

In order to facilitate software reuse, Elixir provides three directives. As we are going to see below, they are called directives because they have **lexical scope**.

## `alias`

`alias` allows you to set up aliases for any given module name. Imagine our `Math` module uses a special list implementation for doing math specific operations:

```elixir
defmodule Math do
  alias Math.List, as: List
end
```

From now on, any reference to `List` will automatically expand to `Math.List`. In case one wants to access the original `List`, it can be done by prefixing the module name with `Elixir.`:

```elixir
List.flatten             #=> uses Math.List.flatten
Elixir.List.flatten      #=> uses List.flatten
Elixir.Math.List.flatten #=> uses Math.List.flatten
```

> Note: All modules defined in Elixir are defined inside a main Elixir namespace. However, for convenience, you can omit "Elixir." when referencing them.

Aliases are frequently used to define shortcuts. In fact, calling `alias` without an `:as` option sets the alias automatically to the last part of the module name, for example:

```elixir
alias Math.List
```

Is the same as:

```elixir
alias Math.List, as: List
```

Note that `alias` is **lexically scoped**, which allows you to set aliases inside specific functions:

```elixir
defmodule Math do
  def plus(a, b) do
    alias Math.List
    # ...
  end

  def minus(a, b) do
    # ...
  end
end
```

In the example above, since we are invoking `alias` inside the function `plus/2`, the alias will just be valid inside the function `plus/2`. `minus/2` won't be affected at all.

## `require`

Elixir provides macros as a mechanism for meta-programming (writing code that generates code).

Macros are chunks of code that are executed and expanded at compilation time. This means, in order to use a macro, we need to guarantee its module and implementation are available during compilation. This is done with the `require` directive:

```iex
iex> Integer.is_odd(3)
** (CompileError) iex:1: you must require Integer before invoking the macro Integer.is_odd/1
iex> require Integer
nil
iex> Integer.is_odd(3)
true
```

In Elixir, `Integer.is_odd/1` is defined as a macro so that it can be used as a guard. This means that, in order to invoke `Integer.is_odd/1`, we need to first require the `Integer` module.

In general a module does not need to be required before usage, except if we want to use the macros available in that module. An attempt to call a macro that was not loaded will raise an error. Note that like the `alias` directive, `require` is also lexically scoped. We will talk more about macros in a later chapter.

## `import`

We use `import` whenever we want to easily access functions or macros from other modules without using the fully-qualified name. For instance, if we want to use the `duplicate/2` function from the `List` module several times, we can simply import it:

```iex
iex> import List, only: [duplicate: 2]
nil
iex> duplicate :ok, 3
[:ok, :ok, :ok]
```

In this case, we are importing only the function `duplicate` (with arity 2) from `List`. Although `:only` is optional, its usage is recommended in order to avoid importing all the functions of a given module inside the namespace. `:except` could also be given as an option in order to import everything in a module *except* a list of functions.

`import` also supports `:macros` and `:functions` to be given to `:only`. For example, to import all macros, one could write:

```elixir
import Integer, only: :macros
```

Or to import all functions, you could write:

```elixir
import Integer, only: :functions
```

Note that `import` is **lexically scoped** too. This means that we can import specific macros or functions inside function definitions:

```elixir
defmodule Math do
  def some_function do
    import List, only: [duplicate: 2]
    duplicate(:ok, 10)
  end
end
```

In the example above, the imported `List.duplicate/2` is only visible within that specific function. `duplicate/2` won't be available in any other function in that module (or any other module for that matter).

Note that `import`ing a module automatically `require`s it.

## Aliases

At this point you may be wondering: what exactly an Elixir alias is and how is it represented?

An alias in Elixir is a capitalized identifier (like `String`, `Keyword`, etc) which is converted to an atom during compilation. For instance, the `String` alias translates by default to the atom `:"Elixir.String"`:

```iex
iex> is_atom(String)
true
iex> to_string(String)
"Elixir.String"
iex> :"Elixir.String" == String
true
```

By using the `alias/2` directive, we are simply changing the atom the alias expands to.

Aliases expand to atoms because in the Erlang <abbr title="Virtual Machine">VM</abbr> (and consequently Elixir) modules are always represented by atoms. For example, that's the mechanism we use to call Erlang modules:

```iex
iex> :lists.flatten([1, [2], 3])
[1, 2, 3]
```

This is also the mechanism that allows us to dynamically call a given function in a module:

```iex
iex> mod = :lists
:lists
iex> mod.flatten([1, [2], 3])
[1, 2, 3]
```

We are simply calling the function `flatten` on the atom `:lists`.

## Nesting

Now that we have talked about aliases, we can talk about nesting and how it works in Elixir. Consider the following example:

```elixir
defmodule Foo do
  defmodule Bar do
  end
end
```

The example above will define two modules: `Foo` and `Foo.Bar`. The second can be accessed as `Bar` inside `Foo` as long as they are in the same lexical scope. The code above is exactly the same as:

```elixir
defmodule Elixir.Foo do
  defmodule Elixir.Foo.Bar do
  end
  alias Elixir.Foo.Bar, as: Bar
end
```

If, later, the `Bar` module is moved outside the `Foo` module definition, it must be referenced by its full name (`Foo.Bar`) or an alias must be set using the `alias` directive discussed above.

**Note**: in Elixir, you don't have to define the `Foo` module before being able to define the `Foo.Bar` module, as the language translates all module names to atoms. You can define arbitrarily-nested modules without defining any module in the chain (e.g., `Foo.Bar.Baz` without defining `Foo` or `Foo.Bar` first).

As we will see in later chapters, aliases also play a crucial role in macros, to guarantee they are hygienic.

### Multi `alias`/`import`/`require`

From Elixir v1.2, it is possible to alias, import or require multiple modules at once. This is particularly useful once we start nesting modules, which is very common when building Elixir applications. For example, imagine you have an application where all modules are nested under `MyApp`, you can alias the modules `MyApp.Foo`, `MyApp.Bar` and `MyApp.Baz` at once as follows:

```elixir
alias MyApp.{Foo, Bar, Baz}
```

## `use`

Although not a directive, `use` is a macro tightly related to `require` that allows you to use a module in the current context. The `use` macro is frequently used by developers to bring external functionality into the current lexical scope, often modules.

For example, in order to write tests using the ExUnit framework, a developer should use the `ExUnit.Case` module:

```elixir
defmodule AssertionTest do
  use ExUnit.Case, async: true

  test "always pass" do
    assert true
  end
end
```

Behind the scenes, `use` requires the given module and then calls the `__using__/1` callback on it allowing the module to inject some code into the current context. Generally speaking, the following module:

```elixir
defmodule Example do
  use Feature, option: :value
end
```

is compiled into

```elixir
defmodule Example do
  require Feature
  Feature.__using__(option: :value)
end
```

With this we are almost finishing our tour about Elixir modules. The last topic to cover is module attributes.
