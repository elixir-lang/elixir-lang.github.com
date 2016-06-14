---
layout: getting-started
title: Protocols
---

# {{ page.title }}

{% include toc.html %}

Protocols are a mechanism to achieve polymorphism in Elixir. Dispatching on a protocol is available to any data type as long as it implements the protocol. Let's see an example.

In Elixir, only `false` and `nil` are treated as false. Everything else evaluates to true. Depending on the application, it may be important to specify a `blank?` protocol that returns a boolean for other data types that should be considered blank. For instance, an empty list or an empty binary could be considered blanks.

We could define this protocol as follows:

```elixir
defprotocol Blank do
  @doc "Returns true if data is considered blank/empty"
  def blank?(data)
end
```

The protocol expects a function called `blank?` that receives one argument to be implemented. We can implement this protocol for different Elixir data types as follows:

```elixir
# Integers are never blank
defimpl Blank, for: Integer do
  def blank?(_), do: false
end

# Just empty list is blank
defimpl Blank, for: List do
  def blank?([]), do: true
  def blank?(_),  do: false
end

# Just empty map is blank
defimpl Blank, for: Map do
  # Keep in mind we could not pattern match on %{} because
  # it matches on all maps. We can however check if the size
  # is zero (and size is a fast operation).
  def blank?(map), do: map_size(map) == 0
end

# Just the atoms false and nil are blank
defimpl Blank, for: Atom do
  def blank?(false), do: true
  def blank?(nil),   do: true
  def blank?(_),     do: false
end
```

And we would do so for all native data types. The types available are:

* `Atom`
* `BitString`
* `Float`
* `Function`
* `Integer`
* `List`
* `Map`
* `PID`
* `Port`
* `Reference`
* `Tuple`

Now with the protocol defined and implementations in hand, we can invoke it:

```iex
iex> Blank.blank?(0)
false
iex> Blank.blank?([])
true
iex> Blank.blank?([1, 2, 3])
false
```

Passing a data type that does not implement the protocol raises an error:

```iex
iex> Blank.blank?("hello")
** (Protocol.UndefinedError) protocol Blank not implemented for "hello"
```

## Protocols and structs

The power of Elixir's extensibility comes when protocols and structs are used together.

In the [previous chapter](/getting-started/structs.html), we have learned that although structs are maps, they do not share protocol implementations with maps. Let's define a `User` struct as in that chapter:

```iex
iex> defmodule User do
...>   defstruct name: "john", age: 27
...> end
{:module, User,
 <<70, 79, 82, ...>>, {:__struct__, 0}}
```

And then check:

```iex
iex> Blank.blank?(%{})
true
iex> Blank.blank?(%User{})
** (Protocol.UndefinedError) protocol Blank not implemented for %User{age: 27, name: "john"}
```

Instead of sharing protocol implementation with maps, structs require their own protocol implementation:

```elixir
defimpl Blank, for: User do
  def blank?(_), do: false
end
```

If desired, you could come up with your own semantics for a user being blank. Not only that, you could use structs to build more robust data types, like queues, and implement all relevant protocols, such as `Enumerable` and possibly `Blank`, for this data type.

## Implementing `Any`

Manually implementing protocols for all types can quickly become repetitive and tedious.  In such cases, Elixir provides two options: we can explicitly derive the protocol implementation for our types or automatically implement the protocol for all types. In both cases, we need to implement the protocol for `Any`.

### Deriving

Elixir allows us to derive a protocol implementation based on the `Any` implementation. Let's first implement `Any` as follows:

```elixir
defimpl Blank, for: Any do
  def blank?(_), do: false
end
```

Now, when defining the struct, we can explicitly derive the implementation for the `Blank` protocol. Let's create another struct, this one called `DeriveUser`:

```elixir
defmodule DeriveUser do
  @derive Blank
  defstruct name: "john", age: 27
end
```

When deriving, Elixir will implement the `Blank` protocol for `DeriveUser` based on the implementation provided for `Any`. Note this behaviour is opt-in: structs will only work with the protocol as long as they explicitly implement or derive it.

### Fallback to `Any`

Another alternative to `@derive` is to explicitly tell the protocol to fallback to `Any` when an implementation cannot be found. This can be achieved by setting `@fallback_to_any` to `true` in the protocol definition:

```elixir
defprotocol Blank do
  @fallback_to_any true
  def blank?(data)
end
```

Assuming we have implemented `Any` as in the previous section:

```elixir
defimpl Blank, for: Any do
  def blank?(_), do: false
end
```

Now all data types (including structs) that have not implemented the `Blank` protocol will be considered non-blank. In contrast to `@derive`, falling back to `Any` is opt-out: all data types get a pre-defined behaviour unless they provide their own implementation of the protocol. Which technique is best depends on the use case but, given Elixir developers prefer explicit over implicit, you may see many libraries pushing towards the `@derive` approach.

## Built-in protocols

Elixir ships with some built-in protocols. In previous chapters, we have discussed the `Enum` module which provides many functions that work with any data structure that implements the `Enumerable` protocol:

```iex
iex> Enum.map [1, 2, 3], fn(x) -> x * 2 end
[2, 4, 6]
iex> Enum.reduce 1..3, 0, fn(x, acc) -> x + acc end
6
```
Another useful example is the `String.Chars` protocol, which specifies how to convert a data structure with characters to a string. It's exposed via the `to_string` function:

```iex
iex> to_string :hello
"hello"
```

Notice that string interpolation in Elixir calls the `to_string` function:

```iex
iex> "age: #{25}"
"age: 25"
```

The snippet above only works because numbers implement the `String.Chars` protocol. Passing a tuple, for example, will lead to an error:

```iex
iex> tuple = {1, 2, 3}
{1, 2, 3}
iex> "tuple: #{tuple}"
** (Protocol.UndefinedError) protocol String.Chars not implemented for {1, 2, 3}
```

When there is a need to "print" a more complex data structure, one can simply use the `inspect` function, based on the `Inspect` protocol:

```iex
iex> "tuple: #{inspect tuple}"
"tuple: {1, 2, 3}"
```

The `Inspect` protocol is the protocol used to transform any data structure into a readable textual representation. This is what tools like IEx use to print results:

```iex
iex> {1, 2, 3}
{1, 2, 3}
iex> %User{}
%User{name: "john", age: 27}
```

Keep in mind that, by convention, whenever the inspected value starts with `#`, it is representing a data structure in non-valid Elixir syntax. This means the inspect protocol is not reversible as information may be lost along the way:

```iex
iex> inspect &(&1+2)
"#Function<6.71889879/1 in :erl_eval.expr/5>"
```

There are other protocols in Elixir but this covers the most common ones.

## Protocol consolidation

When working with Elixir projects, using the Mix build tool, you may see output as follows:

```
Consolidated String.Chars
Consolidated Collectable
Consolidated List.Chars
Consolidated IEx.Info
Consolidated Enumerable
Consolidated Inspect
```

Those are all protocols that ship with Elixir and they are being consolidated. Because a protocol can dispatch to any data type, the protocol must check on every call if an implementation for the given type exists. This may be expensive.

However, after our project is compiled using a tool like Mix, we know all modules that have been defined, including protocols and their implementations. This way, the protocol can be consolidated into a very simple and fast dispatch module.

From Elixir v1.2, protocol consolidation happens automatically for all projects. We will build our own project in the ***Mix and OTP guide***.
