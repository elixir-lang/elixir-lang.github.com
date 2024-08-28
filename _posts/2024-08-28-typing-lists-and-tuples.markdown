---
layout: post
title: "Typing lists and tuples in Elixir"
author: José Valim
category: Announcements
excerpt: "This article explores the design decisions of typing lists and tuples in Elixir within a sound gradual type system"
---

We have been working on [a type system for the Elixir programming language](https://elixir-lang.org/blog/2023/06/22/type-system-updates-research-dev/). The type system provides sound gradual typing: it can safely interface static and dynamic code, and if the program type checks, it will not produce type errors at runtime.

It is important to emphasize **type errors**. The type systems used at scale today do not guarantee the absense of any runtime errors, but only typing ones. Many programming languages error when accessing the "head" of an empty list, most languages raise on division by zero or when computing the logarithm of negative numbers on a real domain, and others may fail to allocate memory or when a number overflows/underflows.

Language designers and maintainers must outline the boundaries of what can be represented as typing errors and how that impacts the design of libraries. The goal of this article is to highlight some of these decisions in the context of lists and tuples in Elixir's on-going type system work.

> In this article, the words "raise" and "exceptions" describe something unexpected happened, and not a mechanism for control-flow. Other programming languages may call them "panics" or "faults".

## The `head` of a list

Imagine you are designing a programming language and you want to provide a `head` function, which returns the head - the first element - of a list, you may consider three options.

The first option, the one found in many programming languages, is to raise if an empty list is given. Its implementation in Elixir would be something akin to:

```elixir
$ list(a) -> a
def head([head | _]), do: head
def head([]), do: raise "empty list"
```

Because the type system cannot differentiate between an empty list and a non-empty list, you won't find any typing violations at compile-time, but an error is raised at runtime for empty lists.

An alternative would be to return an `option` type, properly encoding that the function may fail (or not):

```elixir
$ list(a) -> option(a)
def head([head | _]), do: {:ok, head}
def head([]), do: :none
```

This approach may be a bit redundant. Returning an `option` type basically forces the caller to pattern match on the returned `option`. While many programming languages provide functions to compose `option` values, one may also get rid of the additional wrapping and directly pattern match on the list instead. So instead of:

```elixir
case head(list) do
  {:ok, head} -> # there is a head
  :none -> # do what you need to do
end
```

You could just write:

```elixir
case list do
  [head | _] -> # there is a head
  [] -> # do what you need to do
end
```

Both examples above are limited by the fact the type system cannot distinguish between empty and non-empty lists and therefore their handling must happen at runtime. If we get rid of this limitations, we could define `head` as follows:

```elixir
$ non_empty_list(a) -> a
def head([head | _]), do: head
```

And now we get a typing violation at compile-time if an empty list is given as argument. There is no `option` tagging and no runtime exceptions. Win-win?

The trouble with the above is that now it is responsibility of the language users to prove the list is not empty. For example, imagine this code:

```elixir
list = convert_json_array_to_elixir_list(json_array_as_string)
head(list)
```

In the example above, since `convert_json_array_to_elixir_list` may return an empty list, there is a typing violation at compile-time. To resolve it, we need to prove the result of `convert_json_array_to_elixir_list` is not an empty list before calling `head`:

```elixir
list = convert_json_array_to_elixir_list(json_array_as_string)

if list == [] do
  raise "empty list"
end

head(list)
```

But, at this point, we might as well just use pattern matching and once again get rid of `head`:

```elixir
case convert_json_array_to_elixir_list(json_array_as_string) do
  [head | _] -> # there is a head
  [] -> # do what you need to do
end
```

Most people would expect that encoding more information into the type system would bring only benefits but there is a tension here: the more you encode into types, the more you might have to prove in your programs.

While different developers will prefer certain idioms over others, I am not convinced there is one clearly superior approach here. Having `head` raise a runtime error may be the most pragmatic approach _if_ the developer expects the list to be non-empty in the first place. Returning `option` gets rid of the exception by forcing users to explicitly handle the result, but leads to more boilerplate compared to pattern matching, especially if the user does not expect empty lists. And, finally, adding precise types means there could be more for developers to prove.

### What about Elixir?

Thanks to set-theoretic types, we will most likely distinguish between empty lists and non-empty lists in Elixir's type system, since pattern matching on them is a common language idiom. Furthermore, several functions in Elixir, such as `String.split/2` are guaranteed to return non-empty lists, which can then be nicely encoded into a function's return type.

Elixir also has the functions `hd` (for head) and `tl` (for tail) inherited from Erlang, which are [valid guards](https://hexdocs.pm/elixir/patterns-and-guards.html). They only accept non-empty lists as arguments, which will now be enforced by the type system too.

This covers almost all use cases but one: what happens if you want to access the first element of a list, which has not been proven to be empty? You could use pattern matching and conditionals for those cases, but as seen above, this can lead to common boilerplate such as:

```elixir
if list == [] do
  raise "unexpected empty list"
end
```

Luckily, it is common in Elixir to use the `!` suffix to encode the possibility of runtime errors for _valid_ inputs. For these circumstances, we may introduce `List.first!` (and potentially `List.drop_first!` for the tail variant).

## Accessing tuples

Now that we have discussed lists, we can talk about tuples. In a way, tuples are more challenging than lists for two reasons:

1. A list is a collection where all elements have the same type (be it a `list(integer())` or `list(integer() or float())`), while tuples carry the types of each element

2. We natively access tuples by index, instead of its head and tail, such `elem(tuple, 0)`

In the upcoming v1.18 release, Elixir's new type system will support tuple types, and they are written between curly brackets. For example, the [`File.read/1` function](https://hexdocs.pm/elixir/File.html#read/1) would have the return type `{:ok, binary()} or {:error, posix()}`, quite similar to today's typespecs.

The tuple type can also specify a minimum size, as you can also write: `{atom(), integer(), ...} `. This means the tuple has at least two elements, the first being an `atom()` and the second being an `integer()`. This definition is required for type inference in patterns and guards. After all, a guard `is_integer(elem(tuple, 1))` tells you the tuple has at least two elements, with the second one being an integer, but nothing about the other elements and the tuple overall size.

With tuples support merged into main, we need to answer questions such as which kind of compile-time warnings and runtime exceptions tuple operations, such as `elem(tuple, index)` may emit. Today, we know that it raises if:

1. the index is out of bounds, as in `elem({:ok, "hello"}, 3)`

2. the index is negative, as in `elem({:ok, 123}, -1)`

When typing `elem(tuple, index)`, one option is to use "avoid all runtime errors" as our guiding light and make `elem` return `option` types, such as: `{:ok, value}` or `:none`. This makes sense for an out of bounds error, but should it also return `:none` if the index is negative? One could argue that they are both out of bounds. On the other hand, a positive index may be correct depending on the tuple size but **a negative index is always invalid**. From this perspective, encoding an always invalid value as an `:none` can be detrimental to the developer experience, hiding logical bugs instead of (loudly) blowing up.

Another option is to make these programs invalid. If we completely remove `elem/2` from the language and you can only access tuples via pattern matching (or by adding a literal notation such as `tuple.0`), then all possible bugs can be caught by the type checker. However, some data structures, such as [array in Erlang](https://www.erlang.org/doc/apps/stdlib/array.html) rely on dynamic tuple access, and implementing those would be no longer possible.

Yet another option is to encode integers themselves as values in the type system. In the same way that Elixir's type system supports the values `:ok` and `:error` as types, we could support each integer, such as `13` and  `-42` as types as well (or specific subsets, such as `neg_integer()`, `zero()` and `pos_integer()`). This way, the type system would know the possible values of `index` during type checking, allowing us to pass complex expressions to `elem(tuple, index)`, and emit typing errors if the indexes are invalid. However, remember that encoding more information into types may force developers to also prove that those indexes are within bounds in many other cases.

Once again, there are different trade-offs, and we must select one that best fit into Elixir use and semantics today.

### What about Elixir?

The approach we are taking in Elixir is two-fold:

* If the index is a literal integer, it will perform an exact access on the tuple element. This means `elem(tuple, 1)` will work if we can prove the tuple has at least size 2, otherwise you will have a type error

* If the index is not a literal integer, the function will fallback to a dynamic type signature

Let's expand on the second point.

At a fundamental level, we could describe `elem` with the type signature of `tuple(a), integer() -> a`. However, the trouble with this signature is that it does not tell the type system (nor users) the possibility of a runtime error. Luckily, because Elixir will offer a gradual type system, we could encode the type signature as `dynamic({...a}), integer() -> dynamic(a)`. By encoding the argument and return type as dynamic, developers who want a fully static program will be notified of a typing error, while existing developers who rely on dynamic features of the language can continue to do so, and those choices are now encoded into the types.

Overall,

* For static programs (the ones that do not use the `dynamic()` type), `elem/2` will validate that the first argument is a tuple of known shape, and the second argument is a literal integer which is greater than or equal to zero and less than the tuple size. This guarantees no runtime exceptions.

* Gradual programs will have the same semantics (and runtime exceptions) as today.

## Summary

I hope this article outlines some of the design decisions as we bring a gradual type system to Elixir. Although supporting tuples and lists is a "table stakes" feature in most type systems, bringing them to Elixir was an opportunity to understand how the type system will interact with several language idioms, as well as provide a foundation for future decisions. The most important take aways are:

1. Type safety is a commitment from both sides. If you want your type system to find even more bugs through more precise types, you will need to prove more frequently that your programs are free of certain typing violations.

2. Given not everything will be encoded as types, exceptions are important. Even in the presence of `option` types, it would not be beneficial for developers if `elem(tuple, index)` returned `:none` for negative indexes.

3. Elixir's convention of using the suffix `!` to encode the possibility of runtime exceptions for a valid domain (the input types) nicely complements the type system, as it can help static programs avoid the boilerplate of converting `:none`/`:error` into exceptions for unexpected scenarios.

4. Using `dynamic()` in function signatures is a mechanism available in Elixir's type system to signal that a function has dynamic behaviour and may raise runtime errors, allowing violations to be reported on programs that wish to remain fully static. Similar to how other static languages provide dynamic behaviour via `Any` or `Dynamic` types.

The type system was made possible thanks to a partnership between [CNRS](https://www.cnrs.fr/) and [Remote](https://remote.com/). The development work is currently sponsored by [Fresha](https://www.fresha.com/) ([they are hiring!](https://www.fresha.com/careers/openings?department=engineering)), [Starfish*](https://starfish.team/), and [Dashbit](https://dashbit.co/).

Happy typing!
