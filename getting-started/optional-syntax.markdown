---
section: getting-started
layout: getting-started
title: Optional syntax sheet
---

In this guide so far, we learned that the Elixir syntax allows developers to omit delimiters in a few occasions to make code more readable. For example, we learned that parentheses are optional:

```elixir
iex> length([1, 2, 3]) == length [1, 2, 3]
true
```

and that `do`-`end` blocks are equivalent to keyword lists:

```elixir
# do-end blocks
iex> if true do
...>   :this
...> else
...>   :that
...> end

# keyword lists
iex> if true, do: :this, else: :that
:this
```

Those conveniences, which we call here "optional syntax", allow the language syntax core to be small, without sacrificing the readability and expressiveness of your code. This is what allows us to write:

```elixir
defmodule Math do
  def add(a, b) do
    a + b
  end
end
```

instead of:

```elixir
defmodule(Math, [
  {:do, def(add(a, b), [{:do, a + b}])}
])
```

In this brief chapter, we will review the four rules provided by the language, using a short snippet as playground.

## Walk-through

Take the following code:

```elixir
if variable? do
  Call.this()
else
  Call.that()
end
```

Now let's remove the conveniences one by one:

1. `do`-`end` blocks are equivalent to keywords:

   ```elixir
   if variable?, do: Call.this(), else: Call.that()
   ```

2. Keyword lists as last argument do not require square brackets, but let's add them:

   ```elixir
   if variable?, [do: Call.this(), else: Call.that()]
   ```

3. Keyword lists are the same as lists of two-element tuples:

   ```elixir
   if variable?, [{:do, Call.this()}, {:else, Call.that()}]
   ```

4. Finally, parentheses are optional, but let's add them:

   ```elixir
   if(variable?, [{:do, Call.this()}, {:else, Call.that()}])
   ```

That's it! Those four rules outline the optional syntax of the majority of the code we have written so far. Whenever you have any questions, this quick walk-through has you covered.

In their day to day, Elixir developers use the [`mix format`](https://hexdocs.pm/mix/Mix.Tasks.Format.html) task to format their codebase according to a well-defined set of rules defined by the Elixir team and the community. For instance, `mix format` will always add parentheses to function calls unless explicitly configured to not do so. This ensures all codebases in your company and in the community follow the same standards.
