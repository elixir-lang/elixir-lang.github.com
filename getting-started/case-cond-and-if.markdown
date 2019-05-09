---
layout: getting-started
title: case, cond, and if
---

# {{ page.title }}

{% include toc.html %}

In this chapter, we will learn about the `case`, `cond`, and `if` control flow structures.

## `case`

`case` allows us to compare a value against many patterns until we find a matching one:

```iex
iex> case {1, 2, 3} do
...>   {4, 5, 6} ->
...>     "This clause won't match"
...>   {1, x, 3} ->
...>     "This clause will match and bind x to 2 in this clause"
...>   _ ->
...>     "This clause would match any value"
...> end
"This clause will match and bind x to 2 in this clause"
```

If you want to pattern match against an existing variable, you need to use the `^` operator:

```iex
iex> x = 1
1
iex> case 10 do
...>   ^x -> "Won't match"
...>   _ -> "Will match"
...> end
"Will match"
```

Clauses also allow extra conditions to be specified via guards:

```iex
iex> case {1, 2, 3} do
...>   {1, x, 3} when x > 0 ->
...>     "Will match"
...>   _ ->
...>     "Would match, if guard condition were not satisfied"
...> end
"Will match"
```

The first clause above will only match when `x` is positive.

Keep in mind errors in guards do not leak but simply make the guard fail:

```iex
iex> hd(1)
** (ArgumentError) argument error
iex> case 1 do
...>   x when hd(x) -> "Won't match"
...>   x -> "Got #{x}"
...> end
"Got 1"
```

If none of the clauses match, an error is raised:

```iex
iex> case :ok do
...>   :error -> "Won't match"
...> end
** (CaseClauseError) no case clause matching: :ok
```

Consult [the full documentation for guards](https://hexdocs.pm/elixir/guards.html) for more information about guards, how they are used, and what expressions are allowed in them.

Note anonymous functions can also have multiple clauses and guards:

```iex
iex> f = fn
...>   x, y when x > 0 -> x + y
...>   x, y -> x * y
...> end
#Function<12.71889879/2 in :erl_eval.expr/5>
iex> f.(1, 3)
4
iex> f.(-1, 3)
-3
```

The number of arguments in each anonymous function clause needs to be the same, otherwise an error is raised.

```iex
iex> f2 = fn
...>   x, y when x > 0 -> x + y
...>   x, y, z -> x * y + z
...> end
** (CompileError) iex:1: cannot mix clauses with different arities in anonymous functions
```

## `cond`

`case` is useful when you need to match against different values. However, in many circumstances, we want to check different conditions and find the first one that evaluates to true. In such cases, one may use `cond`:

```iex
iex> cond do
...>   2 + 2 == 5 ->
...>     "This will not be true"
...>   2 * 2 == 3 ->
...>     "Nor this"
...>   1 + 1 == 2 ->
...>     "But this will"
...> end
"But this will"
```

This is equivalent to `else if` clauses in many imperative languages (although used way less frequently here).

If none of the conditions return true, an error (`CondClauseError`) is raised. For this reason, it may be necessary to add a final condition, equal to `true`, which will always match:

```iex
iex> cond do
...>   2 + 2 == 5 ->
...>     "This is never true"
...>   2 * 2 == 3 ->
...>     "Nor this"
...>   true ->
...>     "This is always true (equivalent to else)"
...> end
"This is always true (equivalent to else)"
```

Finally, note `cond` considers any value besides `nil` and `false` to be true:

```iex
iex> cond do
...>   hd([1, 2, 3]) ->
...>     "1 is considered as true"
...> end
"1 is considered as true"
```

## `if` and `unless`

Besides `case` and `cond`, Elixir also provides the macros `if/2` and `unless/2` which are useful when you need to check for only one condition:

```iex
iex> if true do
...>   "This works!"
...> end
"This works!"
iex> unless true do
...>   "This will never be seen"
...> end
nil
```

If the condition given to `if/2` returns `false` or `nil`, the body given between `do/end` is not executed and instead it returns `nil`. The opposite happens with `unless/2`.

They also support `else` blocks:

```iex
iex> if nil do
...>   "This won't be seen"
...> else
...>   "This will"
...> end
"This will"
```

> Note: An interesting note regarding `if/2` and `unless/2` is that they are implemented as macros in the language; they aren't special language constructs as they would be in many languages. You can check the documentation and the source of `if/2` in [the `Kernel` module docs](https://hexdocs.pm/elixir/Kernel.html). The `Kernel` module is also where operators like `+/2` and functions like `is_function/2` are defined, all automatically imported and available in your code by default.

## `do/end` blocks

At this point, we have learned four control structures: `case`, `cond`, `if`, and `unless`, and they were all wrapped in `do/end` blocks. It happens we could also write `if` as follows:

```iex
iex> if true, do: 1 + 2
3
```

Notice how the example above has a comma between `true` and `do:`, that's because it is using Elixir's regular syntax where each argument is separated by a comma. We say this syntax is using *keyword lists*. We can pass `else` using keywords too:

```iex
iex> if false, do: :this, else: :that
:that
```

`do/end` blocks are a syntactic convenience built on top of the keywords one. That's why `do/end` blocks do not require a comma between the previous argument and the block. They are useful exactly because they remove the verbosity when writing blocks of code. These are equivalent:

```iex
iex> if true do
...>   a = 1 + 2
...>   a + 10
...> end
13
iex> if true, do: (
...>   a = 1 + 2
...>   a + 10
...> )
13
```

One thing to keep in mind when using `do/end` blocks is they are always bound to the outermost function call. For example, the following expression:

```iex
iex> is_number if true do
...>  1 + 2
...> end
** (CompileError) iex:1: undefined function is_number/2
```

Would be parsed as:

```iex
iex> is_number(if true) do
...>  1 + 2
...> end
** (CompileError) iex:1: undefined function is_number/2
```

which leads to an undefined function error because that invocation passes two arguments, and `is_number/2` does not exist. The `if true` expression is invalid in itself because it needs the block, but since the arity of `is_number/2` does not match, Elixir does not even reach its evaluation.

Adding explicit parentheses is enough to bind the block to `if`:

```iex
iex> is_number(if true do
...>  1 + 2
...> end)
true
```

Keyword lists play an important role in the language and are quite common in many functions and macros. We will explore them a bit more in a future chapter. Now it is time to talk about "Binaries, strings, and char lists".
