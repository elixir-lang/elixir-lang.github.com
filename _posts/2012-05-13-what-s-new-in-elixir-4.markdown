---
layout: post
title: What's New in Elixir  &#35;4
author: Alexei Sholik
category: "What's New in Elixir"
excerpt: Welcome to the new edition of our biweekly series. Elixir development has been progressing at a steady pace and there are quite a few new things we're going to have a look at today.
---
Welcome to the new edition of our biweekly series. Elixir development has been progressing at a steady pace and there are quite a few new things we're going to have a look at today.

As always, I'm using the latest master (`d28d716de0f2892e31b4bcc9f87549b125075fa5`) to compile and run the code snippets in this post.

## Highlights ##

The [online docs][1] are finally up! This means easier navigation and integrated search. The docs are generated directly from the source, so it's very easy for you to contribute. Simply hit the _Source_ link, author your patch and send a pull request to the main Elixir repo. With GitHub you can do this all without leaving the browser. Any changes improving the documentation are welcome.

The docs are generated with the help of the [exdoc][0] utility which is itself written in Elixir.

  [0]: https://github.com/elixir-lang/exdoc
  [1]: http://elixir-lang.org/docs/


## API Changes ##

### Overridable ###

Overridable is no longer a data attribute, but a macro. This makes it more straightforward to define an overridable function that has multiple clauses of the same arity.

    defmodule DefaultMod do
      defmacro __using__(_module, _opts) do
        quote do
          def test(:x) do
            IO.puts "This is X"
          end

          def test(:y) do
            IO.puts "This is Y"
          end

          defoverridable [test: 1]
        end
      end
    end

    defmodule InheritMod do
      use DefaultMod

      def test(:z) do
        IO.puts "This is Z"
      end
    end

    ###

    InheritMod.test :x
    #=> ** (FunctionClauseError) no function clause matching: InheritMod.test(:x)

    InheritMod.test :y
    #=> ** (FunctionClauseError) no function clause matching: InheritMod.test(:y)

    InheritMod.test :z
    #=> This is Z

As you can see, all clauses are being overriden with one new clause. If you want to keep the default clauses, you can use the `super` keyword that is available inside an overriden function definition. So, if we add the following definition

    def test(_) do
      super
    end

at the end of `InheritMod`, it would result in the following:

    InheritMod.test :x
    #=> This is X

    InheritMod.test :y
    #=> This is Y

    InheritMod.test :z
    #=> This is Z

Alternatively, if you wanted to keep your function extensible but not overridable, you would do away with the `defoverridable` line altogether. In this case, any new clause defined in `InheritMod` would be just that -- a new clause for the function that already has some number of clauses defined.

## Misc. Stuff ##

* The new `in` keyword has been added to simplify some common patterns. For instance, if you wanted to check for a falsey value, you had to write

      case val do
      match: nil
        # code
      match: false
        # code
      match: other
        # other_code
      end

      # or

      case val do
      match: x when x == nil or x == false
        # code
      match: other
        # other_code
      end

  Now you can write

      case val do
      match: x in [nil, false]
        # code
      match: other
        # other_code
      end

  This new syntax can be used in guards, ordinary conditions, and pattern matching.

* The new [File.exists?][2] function allows you to check if a file object exists in the file system. It can be a regular file, a directory, a socket, etc. If want to check for existence of a regular file, use [File.regular?][3] instead.

  [2]: http://elixir-lang.org/docs/File.html#exists?/1
  [3]: http://elixir-lang.org/docs/File.html#regular?/1

* The [URI][4] module has got a new function for URL query parsing: [decode_query][5].

      URI.decode_query "key=value&login=password"
      #=> {Orddict.Record,[{"key","value"},{"login","password"}]}

    Orddict is used by default. You can also pass your own dict

      d = URI.decode_query "key=value&login=password", HashDict.new
      Dict.get d, "login"
      #=> "password"

    This function also does percent-decoding for you

      d = URI.decode_query "find=a%20place%20to%20live"
      Dict.get d, "find"
      #=> "a place to live"

  [4]: http://elixir-lang.org/docs/URI.html
  [5]: http://elixir-lang.org/docs/URI.html#decode_query/2

* [OptionParser][6] now supports argument aliases:

      OptionParser.Simple.parse(["-d"], [d: :debug])
      #=> { [debug: true], [] }

  [6]: http://elixir-lang.org/docs/OptionParser.Simple.html

* Node names are now valid atoms:

      iex> :foo@bar
      :"foo@bar"

---

That's it for this edition. Don't forget to go [read the docs][1] and help us improve them :)

Thank you all and see you next time!
