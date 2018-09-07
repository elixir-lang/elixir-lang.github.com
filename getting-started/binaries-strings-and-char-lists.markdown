---
layout: getting-started
title: Binaries, strings, and charlists
---

# {{ page.title }}

{% include toc.html %}

In "Basic types", we learned about strings and used the `is_binary/1` function for checks:

```iex
iex> string = "hello"
"hello"
iex> is_binary(string)
true
```

In this chapter, we will understand what binaries are, how they associate with strings, and what a single-quoted value, `'like this'`, means in Elixir.

## UTF-8 and Unicode

A string is a UTF-8 encoded binary. In order to understand exactly what we mean by that, we need to understand the difference between bytes and code points.

The Unicode standard assigns code points to many of the characters we know. For example, the letter `a` has code point `97` while the letter `ł` has code point `322`. When writing the string `"hełło"` to disk, we need to convert this sequence of characters to bytes. If we adopted a rule that said one byte represents one code point, we wouldn't be able to write `"hełło"`, because it uses the code point `322` for `ł`, and one byte can only represent a number from `0` to `255`. But of course, given you can actually read `"hełło"` on your screen, it must be represented *somehow*. That's where encodings come in.

When representing code points in bytes, we need to encode them somehow. Elixir chose the UTF-8 encoding as its main and default encoding. When we say a string is a UTF-8 encoded binary, we mean a string is a bunch of bytes organized in a way to represent certain code points, as specified by the UTF-8 encoding.

Since we have characters like `ł` assigned to the code point `322`, we actually need more than one byte to represent them. That's why we see a difference when we calculate the `byte_size/1` of a string compared to its `String.length/1`:

```iex
iex> string = "hełło"
"hełło"
iex> byte_size(string)
7
iex> String.length(string)
5
```

There, `byte_size/1` counts the underlying raw bytes, and `String.length/1` counts characters.

> Note: if you are running on Windows, there is a chance your terminal does not use UTF-8 by default. You can change the encoding of your current session by running `chcp 65001` before entering `iex` (`iex.bat`).

UTF-8 requires one byte to represent the characters `h`, `e`, and `o`, but two bytes to represent `ł`. In Elixir, you can get a character's code point by using `?`:

```iex
iex> ?a
97
iex> ?ł
322
```

You can also use the functions in [the `String` module](https://hexdocs.pm/elixir/String.html) to split a string in its individual characters, each one as a string of length 1:

```iex
iex> String.codepoints("hełło")
["h", "e", "ł", "ł", "o"]
```

You will see that Elixir has excellent support for working with strings. It also supports many of the Unicode operations. In fact, Elixir passes all the tests showcased in the article ["The string type is broken"](http://mortoray.com/2013/11/27/the-string-type-is-broken/).

However, strings are just part of the story. If a string is a binary, and we have used the `is_binary/1` function, Elixir must have an underlying type empowering strings. And it does! Let's talk about binaries.

## Binaries (and bitstrings)

In Elixir, you can define a binary using `<<>>`:

```iex
iex> <<0, 1, 2, 3>>
<<0, 1, 2, 3>>
iex> byte_size(<<0, 1, 2, 3>>)
4
```

A binary is a sequence of bytes. Those bytes can be organized in any way, even in a sequence that does not make them a valid string:

```iex
iex> String.valid?(<<239, 191, 19>>)
false
```

The string concatenation operation is actually a binary concatenation operator:

```iex
iex> <<0, 1>> <> <<2, 3>>
<<0, 1, 2, 3>>
```

A common trick in Elixir is to concatenate the null byte `<<0>>` to a string to see its inner binary representation:

```iex
iex> "hełło" <> <<0>>
<<104, 101, 197, 130, 197, 130, 111, 0>>
```

Each number given to a binary is meant to represent a byte and therefore must go up to 255. Binaries allow modifiers to be given to store numbers bigger than 255 or to convert a code point to its UTF-8 representation:

```iex
iex> <<255>>
<<255>>
iex> <<256>> # truncated
<<0>>
iex> <<256 :: size(16)>> # use 16 bits (2 bytes) to store the number
<<1, 0>>
iex> <<256 :: utf8>> # the number is a code point
"Ā"
iex> <<256 :: utf8, 0>>
<<196, 128, 0>>
```

If a byte has 8 bits, what happens if we pass a size of 1 bit?

```iex
iex> <<1 :: size(1)>>
<<1::size(1)>>
iex> <<2 :: size(1)>> # truncated
<<0::size(1)>>
iex> is_binary(<<1 :: size(1)>>)
false
iex> is_bitstring(<<1 :: size(1)>>)
true
iex> bit_size(<<1 :: size(1)>>)
1
```

The value is no longer a binary, but a bitstring -- a bunch of bits! So a binary is a bitstring where the number of bits is divisible by 8.

```iex
iex>  is_binary(<<1 :: size(16)>>)
true
iex>  is_binary(<<1 :: size(15)>>)
false
```

We can also pattern match on binaries / bitstrings:

```iex
iex> <<0, 1, x>> = <<0, 1, 2>>
<<0, 1, 2>>
iex> x
2
iex> <<0, 1, x>> = <<0, 1, 2, 3>>
** (MatchError) no match of right hand side value: <<0, 1, 2, 3>>
```

Note each entry in the binary pattern is expected to match exactly 8 bits. If we want to match on a binary of unknown size, it is possible by using the binary modifier at the end of the pattern:

```iex
iex> <<0, 1, x :: binary>> = <<0, 1, 2, 3>>
<<0, 1, 2, 3>>
iex> x
<<2, 3>>
```

Similar results can be achieved with the string concatenation operator `<>`:

```iex
iex> "he" <> rest = "hello"
"hello"
iex> rest
"llo"
```

A complete reference about the binary / bitstring constructor `<<>>` can be found [in the Elixir documentation](https://hexdocs.pm/elixir/Kernel.SpecialForms.html#%3C%3C%3E%3E/1). This concludes our tour of bitstrings, binaries and strings. A string is a UTF-8 encoded binary and a binary is a bitstring where the number of bits is divisible by 8. Although this shows the flexibility Elixir provides for working with bits and bytes, 99% of the time you will be working with binaries and using the `is_binary/1` and `byte_size/1` functions.

## Charlists

A charlist is nothing more than a list of code points. Char lists may be created with single-quoted literals:

```iex
iex> 'hełło'
[104, 101, 322, 322, 111]
iex> is_list 'hełło'
true
iex> 'hello'
'hello'
iex> List.first('hello')
104
```

You can see that, instead of containing bytes, a charlist contains the code points of the characters between single-quotes (note that by default IEx will only output code points if any of the integers is outside the ASCII range). So while double-quotes represent a string (i.e. a binary), single-quotes represent a charlist (i.e. a list).

In practice, charlists are used mostly when interfacing with Erlang, in particular old libraries that do not accept binaries as arguments. You can convert a charlist to a string and back by using the `to_string/1` and `to_charlist/1` functions:

```iex
iex> to_charlist "hełło"
[104, 101, 322, 322, 111]
iex> to_string 'hełło'
"hełło"
iex> to_string :hello
"hello"
iex> to_string 1
"1"
```

Note that those functions are polymorphic. They not only convert charlists to strings, but also integers to strings, atoms to strings, and so on.

String (binary) concatenation uses the `<>` operator but charlists use the lists concatenation operator `++`:

```iex
iex> 'this ' <> 'fails'
** (CompileError) iex:2: invalid literal 'this ' in <<>>
    (elixir) src/elixir_bitstring.erl:19: :elixir_bitstring.expand/6
    (elixir) src/elixir_bitstring.erl:12: :elixir_bitstring.expand/4
    (elixir) expanding macro: Kernel.<>/2
    iex:2: (file)
iex> 'this ' ++ 'works'
'this works'
iex> "he" ++ "llo"
** (ArgumentError) argument error
    :erlang.++("he", "llo")
iex> "he" <> "llo"
"hello"
```

With binaries, strings, and charlists out of the way, it is time to talk about key-value data structures.
