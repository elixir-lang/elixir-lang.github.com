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
:this

# keyword lists
iex> if true, do: :this, else: :that
:this
```

Keyword lists use Elixir's regular notation for separating arguments, where we separate each key-value pair with commas, and each key is followed by `:`. In the `do`-blocks, we get rid of the colons, the commas, and separate each keyword by a newline. They are useful exactly because they remove the verbosity when writing blocks of code. Most of the time, we use the block syntax, but it is good to know they are equivalent.

Those conveniences, which we call here "optional syntax", allow the language syntax core to be small, without sacrificing the readability and expressiveness of your code.  In this brief chapter, we will review the four rules provided by the language, using a short snippet as playground.

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

That's it! Those four rules outline the optional syntax available in Elixir. Those rules apply everywhere consistently, regardless of the construct you are invoking. Whenever you have any questions, this quick walk-through has you covered.

At the end of the day, those rules are what enables us to write:

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

Finally, if you are worried about when to apply those rules, keep in mind that those concerns are handled by the Elixir formatter. In our day to day, Elixir developers use the [`mix format`](https://hexdocs.pm/mix/Mix.Tasks.Format.html) task to format our codebases according to a well-defined set of rules defined by the Elixir team and the community. For instance, `mix format` will always add parentheses to function calls unless explicitly configured to not do so. This ensures all codebases in your company and in the community follow the same standards.
