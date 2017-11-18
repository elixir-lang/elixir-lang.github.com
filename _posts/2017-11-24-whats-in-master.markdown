---
layout: post
author: Sean Callan
title: What's new in Elixir
category: Announcements
---

Today's post marks the first in a new series bringing you the latest changes to the Elixir language.
We'd love to hear from you about what you'd like to see in future posts so get join the conversation on Elixir Forum at [forum post placeholder](...).

So what's in master?  Let's have a look:

1. Disagreements about formatting are a thing of the past!
As part of 1.6 we've added a code formatter to Elixir.
The formatter is available as the mix task `format`.
Additional information can be found in the CHANGELOG entry for the [Code formatter](https://github.com/elixir-lang/elixir/blob/master/CHANGELOG.md#code-formatter).

1. The all new `DynamicSupervisor` behaviour is now available on master.
Unlike a traditional `Supervisor` the `DynamicSupervisor` allows children to be added dynamically via `start_child/2`.
For more on the `DynamicSupervisor` check out the [documentation](https://hexdocs.pm/elixir/master/DynamicSupervisor.html) and [CHANGELOG](https://github.com/elixir-lang/elixir/blob/master/CHANGELOG.md) for more details. 

1. Look for changes in compiler diagnostics as part of this new release that make integration with editors easier.
An all new `Mix.Task.Compiler` behaviour will ensure existing and future compiles meet a common specification and return adequate diagnostics.
These changes will enable editors to provide better support for Elixir code compilation.
Jake Becker, one of the features contributors, outlined these changes in his blog post [ElixirLS 0.2: Better builds, code formatter, and incremental Dialyzer](https://medium.com/@JakeBeckerCode/elixirls-0-2-better-builds-code-formatter-and-incremental-dialyzer-be70999ea3e7).
Additional notes can be found in CHANGELOG [compiler-diagnostics](https://github.com/elixir-lang/elixir/blob/master/CHANGELOG.md#compiler-diagnostics) section.

1. Improvements to the `mix xref` task should make it easier for developers to make sense of the output.
These improvements include the new command `graph` and a new option for all xref commands `--include-siblings`, for umbrella projects.
For more information on xref changes checkout the CHANGELOG [entry](https://github.com/elixir-lang/elixir/blob/master/CHANGELOG.md#mix-xref).

1. Steam data and property testing will be joining Elixir core as features in 1.6.
Not only will these be useful to user of Elixir but they'll be used to make Elixir itself better!
For more information on why these are being included checkout the Elixir Forum [thread](https://elixirforum.com/t/questions-about-property-testing-stream-data/9445) from José Valim.
Additional details can be found in the [CHANGELOG](https://github.com/elixir-lang/elixir/blob/master/CHANGELOG.md#stream-data-and-property-testing).

Think we missed something?  Let us know at [forum post placeholder](...).
