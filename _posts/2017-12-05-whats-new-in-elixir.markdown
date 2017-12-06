---
layout: post
author: Sean Callan
title: What's new in Elixir - Dec/17
category: Announcements
---

Today's post marks the first in a new series bringing you the latest changes to the Elixir language.
We'd love to hear from you about what you'd like to see in future posts so join the conversation on [the Elixir Forum thread](https://elixirforum.com/t/whats-new-in-elixir-discussion-dec-17/10605).

So what's in master?  Let's have a look:

1. Disagreements about formatting are a thing of the past!
As part of 1.6 we've added [a code formatter to Elixir](https://hexdocs.pm/elixir/master/Code.html#format_string!/2).
The formatter is available in projects via [the mix task `format`](https://hexdocs.pm/mix/master/Mix.Tasks.Format.html#content). [The community already helped format all files in the Elixir codebase](https://github.com/elixir-lang/elixir/issues/6643) and you can [give the formatter a try now](https://hashrocket.com/blog/posts/format-your-elixir-code-now).

1. The all new `DynamicSupervisor` behaviour is now available on master.
Unlike the traditional `Supervisor` strategies, the `DynamicSupervisor` allows children to be added dynamically via `start_child/2`.
For more on the `DynamicSupervisor` check out the [documentation](https://hexdocs.pm/elixir/master/DynamicSupervisor.html). 

1. Look for changes in compiler diagnostics as part of this new release that make integration with editors easier.
An all new `Mix.Task.Compiler` behaviour will ensure existing and future compilers meet a common specification and return adequate diagnostics.
These changes will enable editors to provide better support for Elixir code compilation.
Jake Becker, one of the features contributors, outlined these benefits in his blog post [ElixirLS 0.2: Better builds, code formatter, and incremental Dialyzer](https://medium.com/@JakeBeckerCode/elixirls-0-2-better-builds-code-formatter-and-incremental-dialyzer-be70999ea3e7).

1. Improvements to the `mix xref` task should make it easier for developers to make sense of the output.
These improvements include the new `graph --format stats` command and a new option for all xref commands `--include-siblings`, for umbrella projects.
For more information on xref changes checkout the CHANGELOG [entry](https://github.com/elixir-lang/elixir/blob/0e72d4839cda97edce75ca0c537555ce4ead7a6a/CHANGELOG.md#mix-xref).

1. Stream data and property testing will be joining Elixir core in a future release. Not only will these be useful to users of Elixir but they'll be used to make Elixir itself better! [See our previous announcement for more information](https://elixir-lang.org/blog/2017/10/31/stream-data-property-based-testing-and-data-generation-for-elixir/) and give the [stream_data library](https://github.com/whatyouhide/stream_data) a try.

Think we missed something? Let us know [at the Elixir Forum](https://elixirforum.com/t/whats-new-in-elixir-discussion-dec-17/10605).
