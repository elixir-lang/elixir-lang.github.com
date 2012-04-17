---
layout: post
title: What's New in Elixir  &#35;2
author: Alexei Sholik
category: "What's New in Elixir"
excerpt: This week has not seen as many prominent new features as the previous one. Still, more bugs have been fixed and a number of small improvements has been made here and there, so the overall progress is quite noticeable.
---
This week has not seen as many prominent new features as the previous one. Still, more bugs have been fixed and a number of small improvements has been made here and there, so the overall progress is quite noticeable.

Let's get started with our usual overview. I'm using the latest master (`2851da4186a7e4c8e94c6ddd4e78dc7e883a31e9`) to compile and run the code snippets in this post.

* Literal support for hexadecimal, octal and binary numbers has been added.

```elixir
0xFF    #=> 255
0o10    #=> 8
0b1010  #=> 10
```

* New functions in the [List module](https://github.com/elixir-lang/elixir/blob/master/lib/list.ex): `sort`, `zip`, `unzip`.

```elixir
# Charlists are sorted in lexicographic order
List.sort ['10', '2', '4', '1', '21']
#=> ['1', '10', '2', '21', '4']

# Numerical sort for charlists using a custom function
List.sort ['10', '2', '4', '1', '21'], fn(a, b) ->
  {na, _} = :string.to_integer a
  {nb, _} = :string.to_integer b
  na <= nb
end
#=> ['1', '2', '4', '10', '21']

List.zip [[1, 2], [:a, :b], ["one", "two"]]
#=> [{1,:a,"one"},{2,:b,"two"}]
```

* The [System module](https://github.com/elixir-lang/elixir/blob/master/lib/system.ex) has been merged into master. It provides functions for communicating with OS environment, running external commands, getting the stacktrace, etc.

```elixir
System.pwd
#=> "/Users/alco/Documents/git/elixir"

System.get_env "PAGER"
#=> "less"

System.cmd 'date'
#=> "Fri Apr 13 19:35:13 EEST 2012\n"

System.stacktrace
#=> (usually long output)
```

* In other news, we're getting closer to having a dedicated site for documentation, JSON parsing/serialization is currently in the works, and there's also work being done on bringing dicts back into Elixir.

* We're also seeing new faces on the list and on the IRC channel. If you haven't already, come join us at #elixir-lang on irc.freenode.net. More fun stuff is coming in the nearest future, including new language features, projects and demos.

---

That's it for this week. Don't forget that if you have something related to Elixir cooking, be it a language feature or a project, or a demo, or whatever, please let me know so that I can highlight your thing too. I will soon start featuring the most active projects in this digest. If you prefer to pitch the thing you're working on yourself, you are welcome to do so.

Thank you all and see you next week!
