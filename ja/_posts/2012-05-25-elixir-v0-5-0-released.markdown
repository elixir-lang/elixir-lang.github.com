---
layout: post
title: Elixir v0.5.0 released
author: José Valim
category: Releases
excerpt: We have finally released Elixir v0.5.0! This marks the first release since the language was rewritten. In this blog post, we will discuss what we achieved during this time and what are the next steps!

---

We have finally released [Elixir](/) v0.5.0! This marks the first release since the language was rewritten. In this blog post, we will discuss what we achieved during this time and what are the next steps!

If you don't care about any of these, you can go straight to our [Getting Started guide](/getting-started/introduction.html). If you do, keep on reading!

## Looking back

I have started working in Elixir at the beginning of 2011. Around April that year, I had released the version v0.3.0 that was stable enough for me to start using in my own projects. However, after using it in a couple projects quickly reviewed that I was not happy with some of the design decisions taken early on.

At that time, Elixir attempted to be a considerable departure from Erlang and that revealed very fast to a bad design decision because, in order to use any Erlang module, we first would have to provide an Elixir wrapper for it. Any new function or module in new Erlang releases would have to be wrapped first in Elixir, which means we would always play catch up with Erlang.

After not feeling productive enough with that Elixir version, I have decided to take a break from Elixir to study old, new and emerging languages. The challenge was to not re-invent Erlang as a language, but how to provide the productivity and flexibility I expect from Elixir while staying a 100% compatible with Erlang.

It was around October 2011, during a short stay in San Francisco, that I came up with what would be [the foundation of Elixir's current version](https://github.com/josevalim/lego-lang) with the help of Yehuda Katz. Development of the new Elixir version started a few days before 2012 and continued steady when the new year came in.

Around February of that year, feeling confident enough about the direction the language was moving (and initial benchmarks I had made at that point), I have pitched Elixir to [my company, Plataformatec](http://plataformatec.com.br/), and they have accepted to sponsor Elixir. With their help, Elixir developed even faster and that's what we are going to take a look next.

## Where we are

One of the goals we have set was to have a good website and documentation before the next official release. With the help of the Plataformatec team, we created a logo for Elixir and put this website live.

At the same time, [we were working on pygments support](https://bitbucket.org/birkenfeld/pygments-main/pull-request/57/add-elixir-and-elixir-console-lexers), a [documentation generation tool](https://github.com/elixir-lang/ex_doc) and many others. Soon, Github was able to syntax highlight Elixir code and [our API documentation was online](/).

At the same time, people started to gather around #elixir-lang channel on irc.freenode.net and [play with Elixir](https://github.com/elixir-lang/elixir/tree/master/lib/mix), [start their](https://github.com/guedes/exdate) [own projects](https://github.com/yrashk/validatex) and [tutorials](https://github.com/alco/elixir/wiki/Erlang-Syntax:-A-Crash-Course).

Although the initial release was scheduled to April 2012, the feedback from such early developers forced us to review some design and syntax decisions and were extremely important to shape the language as it is today.

With v0.5.0 finally out, we are committing to a stable syntax and a basic standard library. In the last couple days before the release, we have been working on streamlining the documentation and ensure Elixir works on Mac, Linux and Windows machines!

## Looking forward

There are still many, many things to do! In the next months, we will continue working on growing our community, talks and other documentation material. A huge thanks to [Alexei Sholik](https://twitter.com/true_droid) who is moving this area forward.

We will also work on better integration and documentation on building Erlang systems. Erlang ships with the [Open Telecom Platform](https://en.wikipedia.org/wiki/Open_Telecom_Platform) which provides many tools to build distributed applications. In v0.5.0, all these tools are already available but we want to make the build process even simpler.

In parallel, we will improve our [documentation generation tool](https://github.com/elixir-lang/ex_doc) and [build tool](https://github.com/elixir-lang/elixir/tree/master/lib/mix) which will likely be merged into core when they are solid enough.

Finally, we will continue improving the Standard Library. Although Elixir's goal is to rely on Erlang the most as possible, we also want to provide a small Standard Library which makes better use of Elixir semantics. For the next weeks, we will focus on improving the IO and File manipulation modules. New data types may also appear, for example, ranges come to my mind.

Check out our [home page](/) and the [getting started guide](/getting-started/introduction.html) for more information. Welcome aboard and grab a cup of Elixir, because you are certainly going to enjoy the ride!
