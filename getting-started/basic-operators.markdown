---
layout: getting-started
title: Basic operators
redirect_from: /getting_started/3.html
---

# {{ page.title }}

{% include toc.html %}

In the [previous chapter](/getting-started/basic-types.html), we saw Elixir provides `+`, `-`, `*`, `/` as arithmetic operators, plus the functions `div/2` and `rem/2` for integer division and remainder.

Elixir also provides `++` and `--` to manipulate lists:

```iex
iex> [1,2,3] ++ [4,5,6]
[1,2,3,4,5,6]
iex> [1,2,3] -- [2]
[1,3]
```

String concatenation is done with `<>`:

```iex
iex> "foo" <> "bar"
"foobar"
```

Elixir also provides three boolean operators: `or`, `and` and `not`. These operators are strict in the sense that they expect a boolean (`true` or `false`) as their first argument:

```iex
iex> true and true
true
iex> false or is_atom(:example)
true
```

Providing a non-boolean will raise an exception:

```iex
iex> 1 and true
** (ArgumentError) argument error
```

`or` and `and` are short-circuit operators. They only execute the right side if the left side is not enough to determine the result:

```iex
iex> false and raise("This error will never be raised")
false

iex> true or raise("This error will never be raised")
true
```

> Note: If you are an Erlang developer, `and` and `or` in Elixir actually map to the `andalso` and `orelse` operators in Erlang.

Besides these boolean operators, Elixir also provides `||`, `&&` and `!` which accept arguments of any type. For these operators, all values except `false` and `nil` will evaluate to true:

```iex
# or
iex> 1 || true
1
iex> false || 11
11

# and
iex> nil && 13
nil
iex> true && 17
17

# !
iex> !true
false
iex> !1
false
iex> !nil
true
```

As a rule of thumb, use `and`, `or` and `not` when you are expecting booleans. If any of the arguments are non-boolean, use `&&`, `||` and `!`.

Elixir also provides `==`, `!=`, `===`, `!==`, `<=`, `>=`, `<` and `>` as comparison operators:

```iex
iex> 1 == 1
true
iex> 1 != 2
true
iex> 1 < 2
true
```

The difference between `==` and `===` is that the latter is more strict when comparing integers and floats:

```iex
iex> 1 == 1.0
true
iex> 1 === 1.0
false
```

In Elixir, we can compare two different data types:

```iex
iex> 1 < :atom
true
```

The reason we can compare different data types is pragmatism. Sorting algorithms don't need to worry about different data types in order to sort. The overall sorting order is defined below:

    number < atom < reference < functions < port < pid < tuple < maps < list < bitstring

You don't actually need to memorize this ordering, but it is important just to know an order exists.

## Operator table

Although we have learned only a handful of operators so far, we present below the complete operator table for Elixir ordered from higher to lower precedence for reference:

Operator | Associativity
-------- | -------------
 `@` | Unary
 `.` | Left to right
 `+` `-` `!` `^` `not` `~~~` | Unary
 `*` `/` | Left to right
 `+` `-` | Left to right
 `++` `--` `..` `<>` | Right to left
 `in` | Left to right
 <code>&#124;></code> `<<<` `>>>` `~>>` `<<~` `~>` `<~` `<~>` <code>&lt;&#124;&gt;</code>  | Left to right
 `<` `>` `<=` `>=` | Left to right
 `==` `!=` `=~` `===` `!==` | Left to right
 `&&` `&&&` `and` | Left to right
 <code>&#124;&#124;</code> <code>&#124;&#124;&#124;</code> `or` | Left to right
 `=` | Right to left
 `=>` | Right to left
 <code>&#124;</code> | Right to left
 `::` | Right to left
 `when` | Right to left
 `<-`, `\\` | Left to right
 `&` | Unary

We will learn the majority of those operators as we go through the getting started guide. In the next chapter, we are going to discuss some basic functions, data type conversions and a bit of control-flow.
