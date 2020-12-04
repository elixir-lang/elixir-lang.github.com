---
layout: getting-started
title: Sigils
redirect_from: /getting_started/18.html
---

# {{ page.title }}

{% include toc.html %}

We have already learned that Elixir provides double-quoted strings and single-quoted char lists. However, this only covers the surface of structures that have textual representation in the language. Atoms, for example, are mostly created via the `:atom` representation.

One of Elixir's goals is extensibility: developers should be able to extend the language to fit any particular domain. Computer science has become such a wide field that it is impossible for a language to tackle many fields as part of its core. Our best bet is to rather make the language extensible, so developers, companies and communities can extend the language to their relevant domains.

In this chapter, we are going to explore sigils, which are one of the mechanisms provided by the language for working with textual representations. Sigils start with the tilde (`~`) character which is followed by a letter (which identifies the sigil) and then a delimiter; optionally, modifiers can be added after the final delimiter.

## Regular expressions

The most common sigil in Elixir is `~r`, which is used to create [regular expressions](https://en.wikipedia.org/wiki/Regular_Expressions):

```iex
# A regular expression that matches strings which contain "foo" or "bar":
iex> regex = ~r/foo|bar/
~r/foo|bar/
iex> "foo" =~ regex
true
iex> "bat" =~ regex
false
```

Elixir provides Perl-compatible regular expressions (regexes), as implemented by the [PCRE](http://www.pcre.org/) library. Regexes also support modifiers. For example, the `i` modifier makes a regular expression case insensitive:

```iex
iex> "HELLO" =~ ~r/hello/
false
iex> "HELLO" =~ ~r/hello/i
true
```

Check out the [`Regex` module](/docs/stable/elixir/#!Regex.html) for more information on other modifiers and the supported operations with regular expressions.

So far, all examples have used `/` to delimit a regular expression. However sigils support 8 different delimiters:

```
~r/hello/
~r|hello|
~r"hello"
~r'hello'
~r(hello)
~r[hello]
~r{hello}
~r<hello>
```

The reason behind supporting different delimiters is that different delimiters can be more suited for different sigils. For example, using parentheses for regular expressions may be a confusing choice as they can get mixed with the parentheses inside the regex. However, parentheses can be handy for other sigils, as we will see in the next section.

## Strings, char lists and words sigils

Besides regular expressions, Elixir ships with three other sigils.

### Strings

The `~s` sigil is used to generate strings, like double quotes are. The `~s` sigil is useful, for example, when a string contains both double and single quotes:

```iex
iex> ~s(this is a string with "double" quotes, not 'single' ones)
"this is a string with \"double\" quotes, not 'single' ones"
```

### Char lists

The `~c` sigil is used to generate char lists:

```iex
iex> ~c(this is a char list containing 'single quotes')
'this is a char list containing \'single quotes\''
```

### Word lists

The `~w` sigil is used to generate lists of words (*words* are just regular strings). Inside the `~w` sigil, words are separated by whitespace.

```iex
iex> ~w(foo bar bat)
["foo", "bar", "bat"]
```

The `~w` sigil also accepts the `c`, `s` and `a` modifiers (for char lists, strings and atoms, respectively) which specify the data type of the elements of the resulting list:

```iex
iex> ~w(foo bar bat)a
[:foo, :bar, :bat]
```

## Interpolation and escaping in sigils

Besides lowercase sigils, Elixir supports uppercase sigils to deal with escaping characters and interpolation. While both `~s` and `~S` will return strings, the former allows escape codes and interpolation while the latter does not:

```iex
iex> ~s(String with escape codes \x26 #{"inter" <> "polation"})
"String with escape codes & interpolation"
iex> ~S(String without escape codes and without #{interpolation})
"String without escape codes and without \#{interpolation}"
```

The following escape codes can be used in strings and char lists:

* `\"` – double quote
* `\'` – single quote
* `\\` – single backslash
* `\a` – bell/alert
* `\b` – backspace
* `\d` - delete
* `\e` - escape
* `\f` - form feed
* `\n` – newline
* `\r` – carriage return
* `\s` – space
* `\t` – tab
* `\v` – vertical tab
* `\0` - null byte
* `\xDD` - character with hexadecimal representation DD (e.g., `\x13`)
* `\x{D...}` - character with hexadecimal representation with one or more hexadecimal digits (e.g., `\x{abc13}`)

Sigils also support heredocs, that is, three double-quotes or single-quotes as separators:

```iex
iex> ~s"""
...> this is
...> a heredoc string
...> """
```

The most common use case for heredoc sigils is when writing documentation. For example, writing escape characters in documentation would soon become error prone because of the need to double-escape some characters:

```elixir
@doc """
Converts double-quotes to single-quotes.

## Examples

    iex> convert("\\\"foo\\\"")
    "'foo'"

"""
def convert(...)
```

By using `~S`, this problem can be avoided altogether:

```elixir
@doc ~S"""
Converts double-quotes to single-quotes.

## Examples

    iex> convert("\"foo\"")
    "'foo'"

"""
def convert(...)
```

## Custom sigils

As hinted at the beginning of this chapter, sigils in Elixir are extensible. In fact, using the sigil `~r/foo/i` is equivalent to calling the `sigil_r` function with a binary and a char list as argument:

```iex
iex> sigil_r(<<"foo">>, 'i')
~r"foo"i
```

We can access the documentation for the `~r` sigil via the `sigil_r` function:

```iex
iex> h sigil_r
...
```

We can also provide our own sigils by simply implementing functions that follow the `sigil_{identifier}` pattern. For example, let's implement the `~i` sigil that returns an integer (with the optional `n` modifier to make it negative):

```iex
iex> defmodule MySigils do
...>   def sigil_i(string, []), do: String.to_integer(string)
...>   def sigil_i(string, [?n]), do: -String.to_integer(string)
...> end
iex> import MySigils
iex> ~i(13)
13
iex> ~i(42)n
-42
```

Sigils can also be used to do compile-time work with the help of macros. For example, regular expressions in Elixir are compiled into an efficient representation during compilation of the source code, therefore skipping this step at runtime. If you're interested in the subject, we recommend you to learn more about macros and check out how sigils are implemented in the `Kernel` module (where the `sigil_*` functions are defined).
