---
layout: getting-started
title: Binaries, strings and char lists
redirect_from: /getting_started/6.html
---

# {{ page.title }}

{% include toc.html %}

In "Basic types", we learned about strings and used the `is_binary/1` function for checks:

```iex
iex> string = "hello"
"hello"
iex> is_binary string
true
```

In this chapter, we will understand what binaries are, how they associate with strings, and what a single-quoted value, `'like this'`, means in Elixir.

## UTF-8 and Unicode

A string is a UTF-8 encoded binary. In order to understand exactly what we mean by that, we need to understand the difference between bytes and code points.

The Unicode standard assigns code points to many of the characters we know. For example, the letter `a` has code point `97` while the letter `ł` has code point `322`. When writing the string `"hełło"` to disk, we need to convert this code point to bytes. If we adopted a rule that said one byte represents one code point, we wouldn't be able to write `"hełło"`, because it uses the code point `322` for `ł`, and one byte can only represent a number from `0` to `255`. But of course, given you can actually read `"hełło"` on your screen, it must be represented *somehow*. That's where encodings come in.

When representing code points in bytes, we need to encode them somehow. Elixir chose the UTF-8 encoding as its main and default encoding. When we say a string is a UTF-8 encoded binary, we mean a string is a bunch of bytes organized in a way to represent certain code points, as specified by the UTF-8 encoding.

Since we have code points like `ł` assigned to the number `322`, we actually need more than one byte to represent it. That's why we see a difference when we calculate the `byte_size/1` of a string compared to its `String.length/1`:

```iex
iex> string = "hełło"
"hełło"
iex> byte_size string
7
iex> String.length string
5
```

> Note: if you are running on Windows, there is a chance your terminal does not use UTF-8 by default. You can change the encoding of your current session by running `chcp 65001` before entering `iex`.

UTF-8 requires one byte to represent the code points `h`, `e` and `o`, but two bytes to represent `ł`. In Elixir, you can get a code point's value by using `?`:

```iex
iex> ?a
97
iex> ?ł
322
```

You can also use the functions in [the `String` module](/docs/stable/elixir/#!String.html) to split a string in its code points:

```iex
iex> String.codepoints("hełło")
["h", "e", "ł", "ł", "o"]
```

You will see that Elixir has excellent support for working with strings. It also supports many of the Unicode operations. In fact, Elixir passes all the tests showcased in the article ["The string type is broken"](http://mortoray.com/2013/11/27/the-string-type-is-broken/).

However, strings are just part of the story. If a string is a binary, and we have used the `is_binary/1` function, Elixir must have an underlying type empowering strings. And it does. Let's talk about binaries!

## Binaries (and bitstrings)

In Elixir, you can define a binary using `<<>>`:

```iex
iex> <<0, 1, 2, 3>>
<<0, 1, 2, 3>>
iex> byte_size <<0, 1, 2, 3>>
4
```

A binary is just a sequence of bytes. Of course, those bytes can be organized in any way, even in a sequence that does not make them a valid string:

```iex
iex> String.valid?(<<239, 191, 191>>)
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

Each number given to a binary is meant to represent a byte and therefore must go up to 255. Binaries allow modifiers to be given to store numbers bigger than 255 or to convert a code point to its utf8 representation:

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
iex> is_binary(<< 1 :: size(1)>>)
false
iex> is_bitstring(<< 1 :: size(1)>>)
true
iex> bit_size(<< 1 :: size(1)>>)
1
```

The value is no longer a binary, but a bitstring -- just a bunch of bits! So a binary is a bitstring where the number of bits is divisible by 8!

## Binary/Bitstring Matching

### Introduction

Binary matching is a powerful feature in Elixir that is useful for extracting information from binaries as well as pattern matching. This article serves as a short overview of the available options when pattern matching and demonstrates a few common usecases.

### Uses

Binary matching can be used by itself to extract information from binaries:

```elixir
iex> <<"Hello, ", place::binary>> = "Hello, World"
"Hello, World"
iex> place
"World"
```

Or as a part of function definitions to pattern match:

```elixir
defmodule ImageTyper
  @png_signature <<137::size(8), 80::size(8), 78::size(8), 71::size(8),
                13::size(8), 10::size(8), 26::size(8), 10::size(8)>>
  @jpg_signature <<255::size(8), 216::size(8)>>

  def type(<<@png_signature, rest::binary>>), do: :png
  def type(<<@jpg_signature, rest::binary>>), do: :jpg
  def type(_), do :unknown
end
```

### Types
There are 9 types used in binary matching:

`integer`
`float`
`bits` (alias for bitstring)
`bitstring`
`binary`
`bytes` (alias for binary)
`utf8`
`utf16`
`utf32`

When no type is specified, the default is `integer`.

#### Unit and Size

The length of the match is equal to the `unit` (a number of bits) times the `size` (the number of repeated segnments of length `unit`).

Type      | Default Unit
--------- | ------------
`integer` | 1 bit
`float`   | 1 bit
`binary`  | 8 bits

Sizes for types are a bit more nuanced. The default size for integers is 8.

For floats, it is 64. For floats, `size * unit` must result in 32 or 64, corresponding to binary32 and binary64, respectively.

For binaries, the default is the size of the binary. Only the last binary in a binary match can use the default size. All others must have their size specified explicitly, even if the match is unambiguous.

For example:

```elixir
iex> <<name::binary, " the ", species::binary>>= <<"Frank the Walrus">>
** (CompileError): a binary field without size is only allowed at the end of a binary pattern
iex> <<name::binary-size(5), " the ", species::binary>>= <<"Frank the Walrus">>
"Frank the Walrus"
iex> {name, species}
{"Frank", "Walrus"}
```

For floats, size * unit must result in 32 or 64, corresponding to binary32 and
binary64, respectively.

### Modifiers
Some types have associated modifiers to clear up ambiguity in byte representation. The following

Modifier             | Relevant Type(s)
-------------------- | ----------------
`signed`             | `integer`
`unsigned` (default) | `integer`
`little`             | `integer`, `utf16`, `utf32`
`big` (default)      | `integer`, `utf16`, `utf32`
`native`             | `integer`, `utf16`, `utf32`

#### Sign

Integers can be `signed` or `unsigned`, defaulting to `unsigned`.

```elixir
iex> <<int::integer>> =  <<-100>>
<<156>>
iex> int
156
iex> <<int::integer-signed>> =  <<-100>>
<<156>>
iex> int
-100
```

#### Endianness

Elixir has three options for endianness: `big`, `little`, and `native`. The default is `big`. `native` is determined by the VM at startup.

```
iex> <<number::little-integer-size(16)>> = <<0, 1>>
<<0, 1>>
iex> number
256
iex> <<number::big-integer-size(16)>> = <<0, 1>>
<<0, 1>>
iex> number
1
iex> <<number::native-integer-size(16)>> = <<0, 1>>
<<0, 1>>
iex> number
256
```

Similar results can be achieved with the string concatenation operator `<>`:

```iex
iex> "he" <> rest = "hello"
"hello"
iex> rest
"llo"
```

This finishes our tour of bitstrings, binaries and strings. A string is a UTF-8 encoded binary, and a binary is a bitstring where the number of bits is divisible by 8. Although this shows the flexibility Elixir provides to work with bits and bytes, 99% of the time you will be working with binaries and using the `is_binary/1` and `byte_size/1` functions.

## Char lists

A char list is nothing more than a list of characters:

```iex
iex> 'hełło'
[104, 101, 322, 322, 111]
iex> is_list 'hełło'
true
iex> 'hello'
'hello'
```

You can see that, instead of containing bytes, a char list contains the code points of the characters between single-quotes (note that IEx will only output code points if any of the chars is outside the ASCII range). So while double-quotes represent a string (i.e. a binary), single-quotes represents a char list (i.e. a list).

In practice, char lists are used mostly when interfacing with Erlang, in particular old libraries that do not accept binaries as arguments. You can convert a char list to a string and back by using the `to_string/1` and `to_char_list/1` functions:

```iex
iex> to_char_list "hełło"
[104, 101, 322, 322, 111]
iex> to_string 'hełło'
"hełło"
iex> to_string :hello
"hello"
iex> to_string 1
"1"
```

Note that those functions are polymorphic. They not only convert char lists to strings, but also integers to strings, atoms to strings, and so on.

With binaries, strings, and char lists out of the way, it is time to talk about key-value data structures.
