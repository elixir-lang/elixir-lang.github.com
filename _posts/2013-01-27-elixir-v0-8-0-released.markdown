---
layout: post
title: Elixir v0.8.0 released
author: José Valim
category: Releases
excerpt: On the last 9th January, we celebrated two years since Elixir's first commit and to celebrate this occasion we have prepared a big release. Elixir v0.8 is out, with documentation, optimizations, bug fixes and shiny new features. Let's take a look at them!
---

On the last 9th January, we celebrated [two years since Elixir's first commit](https://github.com/elixir-lang/elixir/commit/337c3f2d569a42ebd5fcab6fef18c5e012f9be5b) and to celebrate this occasion we have prepared a big release. Elixir v0.8 is out, with documentation, optimizations, bug fixes and shiny new features. Let's take a look at them!

## OTP applications

One of the goals for the v0.8 release was better integration with OTP applications. By passing the `--sup` option to Mix, you can start a new OTP Application containing application callbacks and a supervisor:

    mix new my_app --sup

And applications can be started directly from the command line as well:

    elixir --app my_app

We have written a whole [guide chapter about creating OTP applications, supervisors and servers](https://hexdocs.pm/elixir/supervisor-and-application.html). Give it a try!

## Improved Unicode support

Elixir favors the use of UTF-8 binaries since its first release. In the latest releases, we took it up a notch by adding Unicode support, built upon the Unicode Standard 6.2.0. Elixir v0.8 takes this even further, adding more convenience functions and better support to named sequences:

```elixir
String.capitalize("ﬁN") #=> "Fin"
```

The example above contains a string with only two codepoints, [the codepoint ﬁ](http://www.fileformat.info/info/unicode/char/FB01/index.htm) and [the codepoint n](http://www.fileformat.info/info/unicode/char/006E/index.htm). Look how Elixir properly capitalizes the string, returning a new string made of three codepoints (all ascii letters).

Learn more about [Unicode support with the String module](https://hexdocs.pm/elixir/String.html).

## AST metadata

As per this release, Elixir AST nodes can contain metadata. This metadata is compilation time only but may allow macros to annotate important information in AST nodes, like line numbers, file and other library specific information. If you quote an Elixir expression, we can see the metadata slot:

```elixir
quote do: hello("world")
{ :hello, [], ["world"] }
```

In the example above, we can see the AST representation of the expression `hello("world")`. It is made of a tuple of three elements, the first one is the function name represented by the atom `:hello`, the second one is a keyword list containing metadata (in this case, no metadata is available) and the third is a list of arguments, containing the string "world".

By default, `quote` does not annotate line numbers, but we can pass it as an option:

```elixir
quote line: __ENV__.line, do: hello("world")
{ :hello, [line: 9], ["world"] }
```

Now, we can see the metadata spot being used to annotate the line number. This change allowed us to take our macros one step further...

## Macros expansion

Prior to this release, Elixir had limited expansion of imports and aliases. We decided this would be an important issue to tackle in this release, as people are building more and more projects on top of Elixir.

Imagine you manually implemented `unless` as a macro, that does the opposite of `if`:

```elixir
defmacro unless(expr, opts) do
  quote do
    if(!unquote(expr), unquote(opts))
  end
end
```

When some code call the `unless` macro above, in previous Elixir versions, it would expect the `if` macro to be available at the caller. This may not be necessarily true and, even worse, another implementation of the `if` macro, not compatible to the one above, could be available.

Elixir v0.8 ensures that the `unless` macro above will expand to the same `if` macro available when quoted, guaranteeing different libraries can integrate easily without imposing hidden requirements.

You can read more about [macros in the getting started guide](https://hexdocs.pm/elixir/case-cond-and-if.html) or [go deep into the quote macro docs](https://hexdocs.pm/elixir/Kernel.SpecialForms.html#quote/2).

## A new way to manipulate pathnames

Elixir v0.8 contains a bit of house cleaning too. We have created [the Path module](https://hexdocs.pm/elixir/Path.html) to accommodate functions used to manipulate filesystem paths and have also added functions like [`System.tmp_dir` and `System.user_home`](https://hexdocs.pm/elixir/System.html) which are meant to work across different operating systems and are very handy when scripting.

## The new HashDict

For last but not least, Elixir ships with a [new HashDict implementation](https://github.com/elixir-lang/elixir/blob/main/lib/elixir/lib/hash_dict.ex). In Erlang, there are different key-value store implementations and often you need to pick which one is the best for you based on the average size of the dictionary. Generally speaking, [orddicts](http://www.erlang.org/doc/man/orddict.html) are efficient and fast when you want to hold a handful of items, otherwise you should consider [gb_trees](http://www.erlang.org/doc/man/gb_trees.html) unless you want to hold thousands of items, when then [dict](http://www.erlang.org/doc/man/dict.html) becomes your best option. The fact those implementations do not provide the same API, makes it harder to change your code when you realize another implementation would be better fit.

For Elixir, we decided to have a single dictionary implementation that would scale as needed. It would start as a compact representation for a handful of items and expand and rehash accordingly as new items are added or removed, providing fast access and modification times on all ranges. We are glad to say our goals were reached and a new `HashDict` implementation ships with Elixir v0.8.

Let's take a look at some benchmarks:

![Comparison of fetch times with string keys](/images/contents/hash-dict-fetch.png)

![Comparison of update times with string keys](/images/contents/hash-dict-update.png)

For each number of keys, we have measured and normalized those values against `HashDict` results. This way it is easy to see which implementation takes more or less time compared to Elixir's implementation.

`orddict` is still the faster representation for small ranges since it is a simple list. However, `HashDict` is able to be relatively fast compared to `orddict` for those small ranges and the fastest solution once you have dozens of keys. [Those results can be verified when using other types as keys as well](https://gist.github.com/436a9d2bca5051a6dfab).

Finally, given `HashDict` starts with a compact representation, it also takes less memory. Compared to the `dict` implementation, an empty `HashDict` takes only 5 words, while `dict` takes 47.

## Wrapping up

We continue actively working on Elixir and this release is the [result of our efforts on different areas](https://github.com/elixir-lang/elixir/blob/v0.8.0/CHANGELOG.md)! We have exciting plans and newer possibilities to explore, as a new release of Erlang OTP also comes out in a couple weeks.

Also, we previously announced Elixir is going to be released frequently, every 2 to 4 weeks. We have made a small detour to get v0.8.0 out of the door, but we are back to our regular schedule as of today!

[Celebrate with us and give Elixir a try](https://hexdocs.pm/elixir/introduction.html)!
