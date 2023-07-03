---
layout: post
title: "Type system updates: moving from research into development"
author: José Valim
category: Announcements
excerpt: A short status update on the effort to bring a type system into Elixir.
---

A year ago, at ElixirConf EU 2022, we announced an effort to research
and develop a type system for Elixir ([video presentation](https://www.youtube.com/watch?v=Jf5Hsa1KOc8))
([written report](/blog/2022/10/05/my-future-with-elixir-set-theoretic-types/)).

This work is happening under the lead of [Giuseppe Castagna](https://www.irif.fr/~gc/),
CNRS Senior Researcher, and taken by
[Guillaume Duboc](https://www.irif.fr/users/gduboc/index) as part of his
PhD studies, with further guidance from myself (José Valim).

This article is a summary of where we are in our efforts and where we
are going.

## Out of research

Our main goal during research is to find a type system that can model
most of Elixir's functional semantics and develop brand new theory on
the areas we found to be incompatible or lacking. We believe we were
able to achieve this goal with a gradual set-theoretic type system
and we are now ready to head towards development. Over the last 2 months,
we have published plenty of resources on our results:

  * [A technical report on the design principles of the Elixir type system](https://arxiv.org/abs/2306.06391)
  * [A technical presentation by Guillaume Duboc at ElixirConf 2023 on the work above](https://youtube.com/watch?v=gJJH7a2J9O8)
  * [An informal discussion with Giuseppe Castagna, Guillaume Duboc, and José Valim on the SmartLogic podcast](https://smartlogic.io/podcast/elixir-wizards/s10-e12-jose-guillaume-giuseppe-types-elixir/)
  * [An informal Q&A with Guillaume Duboc, José Valim, and the community on Twitch](https://www.twitch.tv/videos/1841707383)

Our focus so far has been on the semantics. While we have introduced a
new syntax capable of expressing the semantics of the new set-theoretic
type system, the syntax is not final as there are still no concrete
plans for user-facing changes to the language. Once we are confident
those changes will happen, we will have plenty of discussion with the
community about the type system interface and its syntax.

The work so far has been made possible thanks to a partnership between
the [CNRS](https://www.cnrs.fr/fr) and [Remote](https://remote.com),
with sponsorships from [Fresha](https://www.fresha.com),
[Supabase](https://supabase.com), and [Dashbit](https://dashbit.co).

## Into development

While there is still on-going research, our focus for the second semester
of 2023 onwards is on development.

Incorporating a type system into a language used at scale can be a daunting
task. Our concerns range from how the community will interact and use the
type system to how it will perform on large codebases. Therefore, our plan
is to gradually introduce our gradual (pun intended) type system into the
Elixir compiler.

In the first release, types will be used just internally by the compiler.
The type system will extract type information from patterns and guards to
find the most obvious mistakes, such as typos in field names or type
mismatches from attempting to add an integer to a string, without introducing
any user-facing changes to the language. At this stage, our main goal is
to assess the performance impact of the type system and the quality of
the reports we can generate in case of typing violations. If we are
unhappy with the results, we still have time to reassess our work or drop
the initiative altogether.

The second milestone is to introduce type annotations only in structs,
which are named and statically-defined in Elixir codebases. Elixir programs
frequently pattern match on structs, which reveals information about
the struct fields, but it knows nothing about their respective types.
By propagating types from structs and their fields throughout the program,
we will increase the type system’s ability to find errors while further
straining our type system implementation.

The third milestone is to introduce the (most likely) `$`-prefixed type
annotations for functions, with no or very limited type reconstruction:
users can annotate their code with types, but any untyped parameter
will be assumed to be of the `dynamic()` type. If successful, then we
will effectively have introduced a type system into the language.

This new exciting development stage is sponsored by [Fresha](https://www.fresha.com) ([they are hiring!](https://www.fresha.com/careers/openings?department=engineering)),
[Starfish*](https://starfish.team) ([they are hiring!](https://starfish.team/jobs/experienced-elixir-developer)),
and [Dashbit](https://dashbit.co).
