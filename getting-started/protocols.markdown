---
layout: getting-started
title: Protocols
---

# {{ page.title }}

{% include toc.html %}

Protocols are a mechanism to achieve polymorphism in Elixir; by implementing the functions specified by a protocol, data types can define functionality appropriate to certain situations. Dispatching on a protocol is available to any data type that has implemented the protocol. One common example that you are probably familiar with is the seemingly innocuous "magic" that handles converting variables to binaries during string interpolation:

```iex
iex> n = 0
0
iex> "I got #{n} problems."
"I got 0 problems."
```

We can interpolate a variable containing an integer into a string because Elixir includes a built-in implementation of the `String.Chars` protocol which calls the `Integer.to_string/1` function behind the scenes:

```elixir
defimpl String.Chars, for: Integer do
  def to_string(term) do
    Integer.to_string(term)
  end
end
```
We can infer that the `String.Chars` protocol is responsible for converting a structure to a binary (when applicable), but what does the protocol definition actually look like? A protocol definition makes use of the special `defprotocol` keyword, and it uses function specs and stubs in a way that may look similar to how other languages define interfaces or abstract base classes:

```elixir
defprotocol String.Chars do
  @spec to_string(t) :: String.t()
  def to_string(term)
end
```

Implementing the `String.Chars` protocol requires that you implement a single function: `to_string/1`. 

What if you need to represent some other data type as a string? For example, if you are working with Mongo, you might have `%BSON.ObjectId{}` structs that you wish to represent in a binary string. To unlock the ability to convert `%BSON.ObjectId{}` to strings, you would implement the `String.Chars` protocol and implement its single `to_string/1`:

```elixir
defimpl String.Chars, for: BSON.ObjectId do
  def to_string(term) do
    term
    |> BSON.encode()
    |> Base.encode16(case: :lower)
  end
end
```

This implementation would let us print the `BSON.ObjectId` in human-readable form.

Now that we have seen some examples of working with a built-in protocol, let's explore something more complex. In Elixir, we have two idioms for checking how many items there are in a data structure: `length` and `size`. `length` means the information must be computed. For example, `length(list)` needs to traverse the whole list to calculate its length. On the other hand, `tuple_size(tuple)` and `byte_size(binary)` do not depend on the tuple and binary size as the size information is pre-computed in the data structure.

Even if we have type-specific functions for getting the size built into Elixir (such as `tuple_size/1`), we could implement a generic `Size` protocol that all data structures for which size is pre-computed would implement.

The protocol definition would look like this:

```elixir
defprotocol Size do
  @doc "Calculates the size (and not the length!) of a data structure"
  def size(data)
end
```

The `Size` protocol expects a function called `size` that receives one argument (the data structure we want to know the size of) to be implemented. We can now implement this protocol for the data structures that would have a compliant implementation:

```elixir
defimpl Size, for: BitString do
  def size(string), do: byte_size(string)
end

defimpl Size, for: Map do
  def size(map), do: map_size(map)
end

defimpl Size, for: Tuple do
  def size(tuple), do: tuple_size(tuple)
end
```

We didn't implement the `Size` protocol for lists as there is no "size" information pre-computed for lists, and the length of a list has to be computed (with `length/1`).

Now with the protocol defined and implementations in hand, we can start using it:

```iex
iex> Size.size("foo")
3
iex> Size.size({:ok, "hello"})
2
iex> Size.size(%{label: "some label"})
1
```

Passing a data type that doesn't implement the protocol raises an error:

```iex
iex> Size.size([1, 2, 3])
** (Protocol.UndefinedError) protocol Size not implemented for [1, 2, 3]
```

It's possible to implement protocols for all Elixir data types:

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


## Protocols and structs

The power of Elixir's extensibility comes when protocols and structs are used together.

In the [previous chapter](/getting-started/structs.html), we have learned that although structs are maps, they do not share protocol implementations with maps. For example, [`MapSet`](https://hexdocs.pm/elixir/MapSet.html)s (sets based on maps) are implemented as structs. Let's try to use the `Size` protocol with a `MapSet`:

```iex
iex> Size.size(%{})
0
iex> set = %MapSet{} = MapSet.new
#MapSet<[]>
iex> Size.size(set)
** (Protocol.UndefinedError) protocol Size not implemented for #MapSet<[]>
```

Instead of sharing protocol implementation with maps, structs require their own protocol implementation. Since a `MapSet` has its size precomputed and accessible through `MapSet.size/1`, we can define a `Size` implementation for it:

```elixir
defimpl Size, for: MapSet do
  def size(set), do: MapSet.size(set)
end
```

If desired, you could come up with your own semantics for the size of your struct. Not only that, you could use structs to build more robust data types, like queues, and implement all relevant protocols, such as `Enumerable` and possibly `Size`, for this data type.

```elixir
defmodule User do
  defstruct [:name, :age]
end

defimpl Size, for: User do
  def size(_user), do: 2
end
```

## Implementing `Any`

Manually implementing protocols for all types can quickly become repetitive and tedious. In such cases, Elixir provides two options: we can explicitly derive the protocol implementation for our types or automatically implement the protocol for all types. In both cases, we need to implement the protocol for `Any`.

### Deriving

Elixir allows us to derive a protocol implementation based on the `Any` implementation. Let's first implement `Any` as follows:

```elixir
defimpl Size, for: Any do
  def size(_), do: 0
end
```

The implementation above is arguably not a reasonable one. For example, it makes no sense to say that the size of a `PID` or an `Integer` is `0`.

However, should we be fine with the implementation for `Any`, in order to use such implementation we would need to tell our struct to explicitly derive the `Size` protocol:

```elixir
defmodule OtherUser do
  @derive [Size]
  defstruct [:name, :age]
end
```

When deriving, Elixir will implement the `Size` protocol for `OtherUser` based on the implementation provided for `Any`.

### Fallback to `Any`

Another alternative to `@derive` is to explicitly tell the protocol to fallback to `Any` when an implementation cannot be found. This can be achieved by setting `@fallback_to_any` to `true` in the protocol definition:

```elixir
defprotocol Size do
  @fallback_to_any true
  def size(data)
end
```

As we said in the previous section, the implementation of `Size` for `Any` is not one that can apply to any data type. That's one of the reasons why `@fallback_to_any` is an opt-in behaviour. For the majority of protocols, raising an error when a protocol is not implemented is the proper behaviour. That said, assuming we have implemented `Any` as in the previous section:

```elixir
defimpl Size, for: Any do
  def size(_), do: 0
end
```

Now all data types (including structs) that have not implemented the `Size` protocol will be considered to have a size of `0`.

Which technique is best between deriving and falling back to any depends on the use case but, given Elixir developers prefer explicit over implicit, you may see many libraries pushing towards the `@derive` approach.

## Built-in protocols

Elixir ships with some built-in protocols. In previous chapters, we have discussed the `Enum` module which provides many functions that work with any data structure that implements the `Enumerable` protocol:

```iex
iex> Enum.map [1, 2, 3], fn(x) -> x * 2 end
[2, 4, 6]
iex> Enum.reduce 1..3, 0, fn(x, acc) -> x + acc end
6
```
Another useful example is the `String.Chars` protocol (as we saw above), which specifies how to convert a data structure with characters to a string. It's exposed via the `to_string` function:

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

When there is a need to "print" a more complex data structure, one can use the `inspect` function, based on the `Inspect` protocol:

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

When working with Elixir projects, using the Mix build tool, you may see the output as follows:

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

You can learn more about protocols and implementations in the [`Protocol`](https://hexdocs.pm/elixir/Protocol.html) module.
