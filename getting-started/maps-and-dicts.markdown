---
layout: getting-started
title: 7 Keywords, maps and dicts
guide: 7
---

# {{ page.title }}

{% include toc.html %}

So far we haven't discussed any associative data structures, i.e. data structures that are able to associate a certain value (or multiple values) to a key. Different languages call these different names like dictionaries, hashes, associative arrays, maps, etc.

In Elixir, we have two main associative data structures: keyword lists and maps. It's time to learn more about them!

## 7.1 Keyword lists

In many functional programming languages, it is common to use a list of 2-item tuples as the representation of an associative data structure. In Elixir, when we have a list of tuples and the first item of the tuple (i.e. the key) is an atom, we call it a keyword list:

```iex
iex> list = [{:a, 1}, {:b, 2}]
[a: 1, b: 2]
iex> list == [a: 1, b: 2]
true
iex> list[:a]
1
```

As you can see above, Elixir supports a special syntax for defining such lists, and underneath they just map to a list of tuples. Since they are simply lists, all operations available to lists, including their performance characteristics, also apply to keyword lists.

For example, we can use `++` to add new values to a keyword list:

```iex
iex> list ++ [c: 3]
[a: 1, b: 2, c: 3]
iex> [a: 0] ++ list
[a: 0, a: 1, b: 2]
```

Note that values added to the front are the ones fetched on lookup:

```iex
iex> new_list = [a: 0] ++ list
[a: 0, a: 1, b: 2]
iex> new_list[:a]
0
```

Keyword lists are important because they have three special characteristics:

  * Keys must be atoms.
  * Keys are ordered, as specified by the developer.
  * Keys can be given more than once.

For example, [the Ecto library](https://github.com/elixir-lang/ecto) makes use of both features to provide an elegant DSL for writing database queries:

```elixir
query = from w in Weather,
      where: w.prcp > 0,
      where: w.temp < 20,
     select: w
```

Those features are what prompted keyword lists to be the default mechanism for passing options to functions in Elixir. In chapter 5, when we discussed the `if/2` macro, we mentioned the following syntax is supported:

```iex
iex> if false, do: :this, else: :that
:that
```

The `do:` and `else:` pairs are keyword lists! In fact, the call above is equivalent to:

```iex
iex> if(false, [do: :this, else: :that])
:that
```

In general, when the keyword list is the last argument of a function, the square brackets are optional.

In order to manipulate keyword lists, Elixir provides [the `Keyword` module](/docs/stable/elixir/Keyword.html). Remember though keyword lists are simply lists, and as such they provide the same linear performance characteristics as lists. The longer the list, the longer it will take to find a key, to count the number of items, and so on. For this reason, keyword lists are used in Elixir mainly as options. If you need to store many items or guarantee one-key associates with at maximum one-value, you should use maps instead.

Although we can pattern match on keyword lists, it is rarely done in practice since pattern matching on lists require the number of items and their order to match:

```iex
iex> [a: a] = [a: 1]
[a: 1]
iex> a
1
iex> [a: a] = [a: 1, b: 2]
** (MatchError) no match of right hand side value: [a: 1, b: 2]
iex> [b: b, a: a] = [a: 1, b: 2]
** (MatchError) no match of right hand side value: [a: 1, b: 2]
```

## 7.2 Maps

Whenever you need a key-value store, maps are the "go to" data structure in Elixir. A map is created using the `%{}` syntax:

```iex
iex> map = %{:a => 1, 2 => :b}
%{2 => :b, :a => 1}
iex> map[:a]
1
iex> map[2]
:b
iex> map[:c]
nil
```

Compared to keyword lists, we can already see two differences:

  * Maps allow any value as a key.
  * Maps' keys do not follow any ordering.

If you pass duplicate keys when creating a map, the last one wins:

```iex
iex> %{1 => 1, 1 => 2}
%{1 => 2}
```

When all the keys in a map are atoms, you can use the keyword syntax for convenience:

```iex
iex> map = %{a: 1, b: 2}
%{a: 1, b: 2}
```

In contrast to keyword lists, maps are very useful with pattern matching:

```iex
iex> %{} = %{:a => 1, 2 => :b}
%{:a => 1, 2 => :b}
iex> %{:a => a} = %{:a => 1, 2 => :b}
%{:a => 1, 2 => :b}
iex> a
1
iex> %{:c => c} = %{:a => 1, 2 => :b}
** (MatchError) no match of right hand side value: %{2 => :b, :a => 1}
```

As shown above, a map matches as long as the given keys exist in the given map. Therefore, an empty map matches all maps.

[The `Map` module](/docs/stable/elixir/Map.html) provides a very similar API to the `Keyword` module with convenience functions to manipulate maps:

```iex
iex> Map.get(%{:a => 1, 2 => :b}, :a)
1
iex> Map.to_list(%{:a => 1, 2 => :b})
[{2, :b}, {:a, 1}]
```

One interesting property about maps is that they provide a particular syntax for updating and accessing atom keys:

```iex
iex> map = %{:a => 1, 2 => :b}
%{:a => 1, 2 => :b}

iex> map.a
1
iex> map.c
** (KeyError) key :c not found in: %{2 => :b, :a => 1}

iex> %{map | :a => 2}
%{:a => 2, 2 => :b}
iex> %{map | :c => 3}
** (ArgumentError) argument error
```

Both access and update syntaxes above require the given keys to exist. For example, accessing and updating the `:c` key failed there is no `:c` in the map.

Elixir developers typically prefer to use the `map.field` syntax and pattern matching instead of the functions in the `Map` module when working with maps because they lead to an assertive style of programming. [This blog post](http://blog.plataformatec.com.br/2014/09/writing-assertive-code-with-elixir/) provides insight and examples on how you get more concise and faster software by writing assertive code in Elixir.

> Note: Maps were recently introduced into the Erlang <abbr title="Virtual Machine">VM</abbr> with [EEP 43](http://www.erlang.org/eeps/eep-0043.html "Erlang Enhancement Proposal #43: Maps"). Erlang 17 provides a partial implementation of the <abbr title="Erlang Enhancement Proposal">EEP</abbr>, where only "small maps" are supported. This means maps have good performance characteristics only when storing at maximum a couple of dozens keys. To fill in this gap, Elixir also provides [the `HashDict` module](/docs/stable/elixir/HashDict.html) which uses a hashing algorithm to provide a dictionary that supports hundreds of thousands keys with good performance.

## 7.3 Dicts

In Elixir, both keyword lists and maps are called dictionaries. In other words, a dictionary is like an interface (we call them behaviours in Elixir) and both keyword lists and maps modules implement this interface.

This interface is defined in the [the `Dict` module](/docs/stable/elixir/Dict.html) module which also provides an API that delegates to the underlying implementations:

```iex
iex> keyword = []
[]
iex> map = %{}
%{}
iex> Dict.put(keyword, :a, 1)
[a: 1]
iex> Dict.put(map, :a, 1)
%{a: 1}
```

The `Dict` module allows any developer to implement their own variation of `Dict`, with specific characteristics, and hook into existing Elixir code. The `Dict` module also provides functions that are meant to work across dictionaries. For example, `Dict.equal?/2` can compare two dictionaries of any kind.

That said, you may be wondering, which of `Keyword`, `Map` or `Dict` modules should you use in your code? The answer is: it depends.

If your code is expecting one specific data structure as argument, use the respective module as it leads to more assertive code. For example, if you expect a keyword as an argument, explicitly use the `Keyword` module instead of `Dict`. However, if your API is meant to work with any dictionary, use the `Dict` module (and make sure to write tests that pass different dict implementations as arguments).

This concludes our introduction to associative data structures in Elixir. You will find out that given keyword lists and maps, you will always have the right tool to tackle problems that require associative data structures in Elixir.
