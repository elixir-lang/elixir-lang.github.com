---
layout: post
title: What's New in Elixir  &#35;1
author: Alexei Sholik
category: "What's New in Elixir"
excerpt: Last week Elixir has seen a lot of new features, improvements, and bug fixes. In this little post I'm going to highlight some of the most prominent ones.
---

Last week Elixir has seen a lot of new features, improvements, and bug fixes. In this little post I'm going to highlight some of the most prominent ones.

* Access protocol has been added for tuples, lists, strings, and whatnot. It allows us to easily access elements of a collection. We can also use a regex to find the first match in a string or a list. Examples follow: 


    dict = [a: 1, b: 2, c: 3]
    dict[:a]   #=> 1
    dict[:d]   #=> nil

    tuple = {5, 4, 3, 2, 1}
    tuple[1]   #=> 5
    tuple[0]   #=> nil
    tuple[-1]  #=> 1

    defrecord TestRec, red: 0, green: 0, blue: 0
    r = TestRec[red: 255, blue: 80]  #=> new record
    s = "The quick brown fox jumps over the lazy dog."
    s[%r/[a-z]+o[a-z]+/]  #=> "brown"

* Access protocol also makes it possible to pattern-match records:


    defrecord TestRec, red: 0, green: 0, blue: 0
    r = TestRec[red: 255, blue: 80]  #=> new record
    case r do
    match: TestRec[red: 0]
      :no_match
    match: TestRec[red: red, blue: 80]
      :ok
    end
    #=> :ok
    red === 255  #=> true

* The `Orddict` module is no longer with us, it has been renamed to `Keyword`. The new module only allows atoms to be used as keys. A general purpose module for dicts will be added sooner or later. 

* The [`Enum` module](https://github.com/elixir-lang/elixir/blob/6f5611317a3d3102f60dbb319f88f2ca1d561c11/lib/enum.ex) has been cleaned up a bit and got new functions, namely `drop_while`, `take_while`, and `split_with`.

* The [`List` module](https://github.com/elixir-lang/elixir/blob/28eaff894e527643ba58b85fb975b5963679542b/lib/list.ex) has also seen some improvements. It now supports access protocol, the `append` function was renamed to `concat`, and a new `range` function has been implemented. 

* Support for nested modules has been added.

    defmodule Father do
      defmodule Child do
        def child_fun(str) do
          IO.puts str
        end
      end
      def fun do
        Child.child_fun "some argument"
      end
    end
    Father.Child.child_fun "hello!"

* The `Regex` module has received new functions, namely, `source` and `opts`. It can also be `inspect`ed now.

    reg = %r/[a-z]+o[a-z]+/im
    Regex.source reg  #=> "[a-z]+o[a-z]+"
    Regex.opts reg    #=> "im"
    inspect reg       #=> "%r\"[a-z]+o[a-z]+\"im"

* A new `read_info` function has been added to the [`File` module](https://github.com/elixir-lang/elixir/blob/35b22c598defd8be07d46d2e7e8fc0ddf9ec4e80/lib/file.ex) allowing 
users to query for file attributes.

---

That's it for this week. I think it's been a great one! If anyone of you has something in the works in a separate fork or branch, please let me know so that I can highlight your contributions too.

Thank you all and see you next week.
