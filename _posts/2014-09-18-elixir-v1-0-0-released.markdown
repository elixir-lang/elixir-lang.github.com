---
layout: post
title: Elixir v1.0.0 released
author: José Valim
category: Releases
excerpt: Elixir v1.0.0 is finally out!
---

Hello everyone!

We are glad to announce Elixir v1.0.0 is finally out. It has been 8005 commits [by 189 contributors](https://github.com/elixir-lang/elixir/graphs/contributors), including the initial commit on [January 9th, 2011](https://github.com/elixir-lang/elixir/commit/337c3f2d569a42ebd5fcab6fef18c5e012f9be5b)!

## What's Elixir?

Elixir is a dynamic, functional language designed for building scalable and maintainable applications.

Elixir leverages the Erlang VM, known for running low-latency, distributed and fault-tolerant systems, while also being successfully used in web development and the embedded software domain.

## What's new?

This release is the consolidation of all the work done through the years. With v1.0.0, we have reached a stable milestone for the growth of software and projects written in Elixir.

Elixir will follow [semantic versioning](http://semver.org), which means code written for Elixir v1.0.0 will continue to compile and run correctly for all versions under the v1 branch (e.g. v1.0.1, v1.1.0, v1.2.0).

Elixir is composed of 6 applications, all under the same versioning constraints:

  * [Elixir](/docs/stable/elixir) - the Elixir compiler, runtime and the standard library
  * [EEx](/docs/stable/eex) - Elixir's templating library, useful for generating any kind of document dynamically
  * [ExUnit](/docs/stable/ex_unit) - Elixir's unit test library, with support for concurrent testing, custom formatters, filters and much more
  * [IEx](/docs/stable/iex) - Elixir's interactive shell with code reloading, auto-complete, and easy access to documentation, typespecs and more
  * [Logger](/docs/stable/logger) - the latest addition to the group, Logger provides reliable logging and configurable backends (with syslog, file and many other backends provided by the community)
  * [Mix](/docs/stable/mix) - Elixir's build tool that generates, compiles and test projects as well as manages your dependencies

With v1.0.0, we are providing a stable platform for the community to leverage and extend, and we are extremely excited with the projects and possibilities that are ahead of us!

We hope the [Hex package manager](http://hex.pm) will be the home of many of those projects and remember the whole Erlang ecosystem is also available to Elixir developers.

## Expectations

We would like to elaborate on the expectations regarding Elixir v1.0.0. Although we expect that the vast majority of programs will remain compatible over time, it is impossible to guarantee that no future change will break any program.

Under some unlikely circumstances, we may introduce changes that break existing code:

  * Security: a security issue in the implementation may arise whose resolution requires backwards incompatible changes. We reserve the right to address such security issues.

  * Bugs: if an application has undesired behaviour, a program that depends on the buggy behavior may break if the bug is fixed. We reserve the right to fix such bugs.

  * Compiler front-end: improvements may be done to the compiler, introducing new warnings for ambiguous modes and providing more detailed error messages. Those can lead to compilation errors (when running with `--warning-as-errors`) or tooling failures when expecting specific messages (although one should avoid such). We reserve the right to do such improvements.

  * Imports: new functions may be added to the Kernel module, which is auto-imported. They may collide with local functions defined in your modules. Collisions can be resolved in a backwards compatible fashion using `import Kernel, except: [...]` with a list of all functions you don't want imported from Kernel. We reserve the right to do such additions.

These expectations also apply to future releases under the v1 branch, except for experimental features, which will be explicitly marked as such and not provide any compatibility guarantee until they are stabilized.

## Learn more

You can get started with Elixir via our [Getting Started guide](/getting_started/1.html). There are quite some Elixir books out there too, now getting sent to the presses, quite a few can be found in the sidebar, which also includes screencasts and other resources.

You can also learn more about Elixir by checking out [the videos from ElixirConf 2014](http://www.confreaks.com/events/elixirconf2014), the first (and so far the best) Elixir conference ever! You can learn more about [the language history](http://www.confreaks.com/videos/4134-elixirconf2014-keynote-elixir), [how Elixir can change the way you code](http://www.confreaks.com/videos/4119-elixirconf2014-opening-keynote-think-different) or [even hear stories of how Elixir is being used in production](http://www.confreaks.com/videos/4131-elixirconf2014-otp-in-production-the-nitty-gritty-details-of-game-servers).

Finally, by popular demand, we have [released some Elixir stickers](http://www.stickermule.com/user/1070631438/stickers), which are available with a discounted price to celebrate v1.0.0!
