---
layout: post
title: Elixir v0.7.2 released
author: Yurii Rashkovskii
category: Releases
excerpt: Elixir v0.7.2 is released, new, improved type specifications syntax and many other improvements.

---

Hot out of the oven! We just released Elixir v0.7.2 with a number of delicious improvements.

One of the most important changes in this minor release is a partial rehaul of
the type specification syntax.

Here's the gist:

```elixir
@spec myfun(integer), do: integer
# becomes
@spec myfun(integer) :: integer

@type a :: fun
# becomes
@type a :: (... -> any) or ((...) -> any) or (fun(...) -> any)

@type a :: fun(do: integer)
# becomes
@type a :: (() -> integer) or (fun() -> integer)

@type a :: fun(integer, do: integer)
# becomes
@type a :: (integer -> integer) or ((integer) -> integer) or (fun(integer) -> integer)

@type a :: fun(integer, integer, do: integer)
# becomes
@type a :: (integer, integer -> integer) or ((integer, integer) -> integer) or (fun(integer, integer) -> integer)
```

Another change is that Mix now echoes the output of external tools
such as git and rebar, and handles exit status correctly. This have previously
led to some less-than-perfect workflows.

We've also added a more compact and visual form of the `function` helper. Now,
instead of `function(Enum, :all?, 2)` you can use `function(Enum.all?/2)`.

We've also figured out how to achieve an up to 6x [performance increase](https://github.com/elixir-lang/elixir/blob/v0.7.2/lib/elixir/lib/kernel.ex#L1386-L1417)
under some circumstances when using records.

...and [many other fixes & improvements](https://github.com/elixir-lang/elixir/blob/v0.7.2/CHANGELOG.md).

Lastly, but not least importantly, I'd like to mention that we're very excited about how the community around Elixir is building up. Thank you all for being around and supporting us!

[Learn more about Elixir](https://hexdocs.pm/elixir/introduction.html)!
