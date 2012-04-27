---
layout: post
title: What's New in Elixir  &#35;3
author: Alexei Sholik
category: "What's New in Elixir"
excerpt: It's been two weeks since the last edition of the series, so this one is going to be packed with information.
---

It's been two weeks since the last edition of the series, so this one is going to be packed with information.

As usual, I'm using the latest available master (`b4cc71a8351222721b0e1dce130843d7e683863e`) to compile and run the code snippets in this post.

You might have noticed that the version number has been downgraded to 0.5.0 recently. This doesn't mean that half of the features have been removed from Elixir. It simply indicates that there's still plenty of work to be done, but we're sure we're moving in the right direction.

Without further ado, let's get to it.


## Highlights ##

José has written an awesome blog post describing how the new parallel compiler allows Elixir to seamlessly resolve dependencies and improve the speed of ~~light~~ compilation by doing only the work that needs to be done. Read all about it [here][1].

  [1]: http://elixir-lang.org/blog/2012/04/24/a-peek-inside-elixir-s-parallel-compiler/


## API Changes ##


### Keyword ###

Keywords can have duplicate entries. When you `get` a value for a key from a keyword, the first entry with that key is returned. When you `put` a new value, it replaces all values for the given key:

    kv = [a: 1, a: 2, b: 3]
    #=> [{:a,1},{:a,2},{:b,3}]

    Keyword.get kv, :a
    #=> 1

    Keyword.put kv, :a, 10
    #=> [{:a,10},{:b,3}]

### New syntax for protocol declarations ###

Protocol declarations now look more like module definitions. This allows us to document each function and increases their overall visual appeal (in my view).

    defprotocol ProtoName do
      @only [Record, List]

      @doc """
      This is a doc string.
      """
      def function(arg)

      @doc """
      Another function
      """
      def another_function(list)
    end

As before, functions are only declared inside the `defprotocol` body. Their implementation is defined separately (in a `defimpl` block) for each type that wishes to support the protocol. More info can be found in the [Getting Started guide][2] (_Section 4.2_).

  [2]: http://elixir-lang.org/getting_started/4.html

### Declarations for default arguments ###

Default arguments in Elixir are shared between different clauses of the functions with the same name. This recent addition allows this fact to be expressed more clearly in the code.

    defmodule DefaultTest do
      def function(a, b // "world")

      def function(a, b) when is_binary(a) do
        a <> b
      end

      def function(a, b) when is_list(a) do
        a ++ to_char_list(b)
      end
    end

    ###

    iex> DefaultTest.function "Hello "
    "Hello world"

    iex> DefaultTest.function 'Hello '
    'Hello world'

Notice how the first declaration does not have a body, its only purpose is to define the default argument that will be used in the remaining two clauses.

### Revamped assert with smart guessing ###

Our good old `assert` macro has become a tad smarter and can be now be used in places where `assert_equals`, `assert_operator`, and `assert_access` were used before.

    # Replaces assert_equals
    assert "abc" == to_binary('abc')

    # Replaces assert_operator
    assert

    # Replaces assert_access
    assert

### Enum ###

The `Enum` module has been reworked slightly in order to add support for dicts (described below). It's still working with lists as before, but now you can also use most of its functions with dicts too.


## New Modules & Protocols ##

### Meet the new Dict protocol along with it's buddies HashDict and Orddict ###

This change has been cooking for quite a while. Now it's finally merged into master. Let's have a look:

    dict = HashDict.new [a: 1, b: 2, c: 3]
    Dict.keys dict
    #=> [:a,:b,:c]

    Dict.values dict
    #=> [1,2,3]

    dict = Dict.put dict, "hello", "world"
    Dict.get dict, "hello"
    #=> "world"

    ord = Orddict.new [{"a", []}, {"b", [1, 2, 3]}, {[nil], "cool"}]
    Dict.get ord, [nil]
    #=> "cool"

    ord = Dict.merge ord, Orddict.new([key: 'value'])
    Dict.get ord, :key
    #=> 'value'

Notice, that `Dict` is a protocol and it works with both hash dicts and orddicts. Take a look at the [source code][3] for the new modules. The protocol declaration in _common.ex_ has extensive documentation for the functions it defines.

  [3]: https://github.com/elixir-lang/elixir/tree/master/lib/dict


Let's look at how we can use `Enum` with the new dict modules.

    # ord is our orddict from the previous snippet

    # Swap keys and values
    Enum.map ord, fn({k, v}) -> {v, k} end
    #=> [{'value',:key},{"cool",[nil]},{[],"a"},{[1,2,3],"b"}]

Notice that `Enum` always returns a list even when passed a dictionary.

Some functions in `Enum` expect an ordered collection to be passed in. Since `HashDict` does not define a meaningful order for its contents, you'll get a runtime error if you try to use one of those functions with this dict. `Orddict`, on the other hand, keeps its entries sorted by keys:

    ord = Orddict.new [{'value',:key},{"cool",[nil]},{[],"a"},{[1,2,3],"b"}]
    #=> {Orddict.Record,[{[],"a"},{[1,2,3],"b"},{'value',:key},{"cool",[nil]}]}

    Enum.drop_while ord, fn({k, v}) -> is_list(k) end
    #=> [{"cool",[nil]}]

Take a look at the [source code][4] for the detailed descriptions of all the functions defined in `Enum`. Those functions that expect an ordered collection are explicitly marked as such.

  [4]: https://github.com/elixir-lang/elixir/blob/master/lib/enum.ex


## Technical Stuff ##

### Macros can now be invoked locally ###

You can also define private macros with `defmacrop`. Example:

    defmodule Obnoxious do
      defmacro swap({:*, line, args}) do
        {:+, line, args}
      end

      defmacrop priv_swap({:+, line, args}) do
        {:*, line, args}
      end

      def mul(a, b) do
        swap(a * b)
      end

      def add(a, b) do
        priv_swap(a + b)
      end
    end

    ###

    iex> Obnoxious.mul 3, 4
    7

    iex> Obnoxious.add 6, 6
    36


### Extended module info available at runtime ###

Given the definition of `Obnoxious` above, we can query some of its attributes at run time:

    # Functions exported by the module
    iex> Obnoxious.__info__(:functions)
    [{:__info__,1},{:add,2},{:mul,2}]

    # Macros exported by the module
    iex> Obnoxious.__info__(:macros)
    [{:swap,1}]

As you can see, the private macro `priv_swap` is not available outside of the module it is defined in, the same goes for private functions. They could even have been inlined by the compiler, who knows.

And don't forget that Erlang compiler provide the `module_info` function for each compiled module:

    iex> Obnoxious.module_info
    [{:exports,[{:__info__,1},{:MACRO_swap,1},{:mul,2},{:add,2},{:module_info,0},{:module_info,1}]}, ...]

---

That's it for this week. It's exciting to see Elixir evolving each day. Join the community if you don't want to end up lagging behind!

Thank you all and see you next week!
