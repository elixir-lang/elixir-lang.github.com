---
layout: getting-started
title: Basic types
redirect_from: /getting_started/2.html
---

# {{ page.title }}

{% include toc.html %}

In this chapter we will learn more about Elixir basic types: integers, floats, booleans, atoms, strings, lists and tuples. Some basic types are:

```iex
iex> 1          # integer
iex> 0x1F       # integer
iex> 1.0        # float
iex> true       # boolean
iex> :atom      # atom / symbol
iex> "elixir"   # string
iex> [1, 2, 3]  # list
iex> {1, 2, 3}  # tuple
```

## Basic arithmetic

Open up `iex` and type the following expressions:

```iex
iex> 1 + 2
3
iex> 5 * 5
25
iex> 10 / 2
5.0
```

Notice that `10 / 2` returned a float `5.0` instead of an integer `5`. This is expected. In Elixir, the operator `/` always returns a float. If you want to do integer division or get the division remainder, you can invoke the `div` and `rem` functions:

```iex
iex> div(10, 2)
5
iex> div 10, 2
5
iex> rem 10, 3
1
```

Notice that parentheses are not required in order to invoke a function.

Elixir also supports shortcut notations for entering binary, octal and hexadecimal numbers:

```iex
iex> 0b1010
10
iex> 0o777
511
iex> 0x1F
31
```

Float numbers require a dot followed by at least one digit and also support `e` for the exponent number:

```iex
iex> 1.0
1.0
iex> 1.0e-10
1.0e-10
```

Floats in Elixir are 64 bit double precision.

You can invoke the `round` function to get the closest integer to a given float, or the `trunc` function to get the integer part of a float.

```iex
iex> round 3.58
4
iex> trunc 3.58
3
```

## Booleans

Elixir supports `true` and `false` as booleans:

```iex
iex> true
true
iex> true == false
false
```

Elixir provides a bunch of predicate functions to check for a value type. For example, the `is_boolean/1` function can be used to check if a value is a boolean or not:

> Note: Functions in Elixir are identified by name and by number of arguments (i.e. arity). Therefore, `is_boolean/1` identifies a function named `is_boolean` that takes 1 argument. `is_boolean/2` identifies a different (nonexistent) function with the same name but different arity.

```iex
iex> is_boolean(true)
true
iex> is_boolean(1)
false
```

You can also use `is_integer/1`, `is_float/1` or `is_number/1` to check, respectively, if an argument is an integer, a float or either.

> Note: At any moment you can type `h` in the shell to print information on how to use the shell. The `h` helper can also be used to access documentation for any function. For example, typing `h is_integer/1` is going to print the documentation for the `is_integer/1` function. It also works with operators and other constructs (try `h ==/2`).

## Atoms

Atoms are constants where their name is their own value. Some other languages call these symbols:

```iex
iex> :hello
:hello
iex> :hello == :world
false
```

The booleans `true` and `false` are, in fact, atoms:

```iex
iex> true == :true
true
iex> is_atom(false)
true
iex> is_boolean(:false)
true
```

## Strings

Strings in Elixir are inserted between double quotes, and they are encoded in UTF-8:

```iex
iex> "hellö"
"hellö"
```

> Note: if you are running on Windows, there is a chance your terminal does not use UTF-8 by default. You can change the encoding of your current session by running `chcp 65001` before entering IEx.

Elixir also supports string interpolation:

```iex
iex> "hellö #{:world}"
"hellö world"
```

Strings can have line breaks in them or introduce them using escape sequences:

```iex
iex> "hello
...> world"
"hello\nworld"
iex> "hello\nworld"
"hello\nworld"
```

You can print a string using the `IO.puts/1` function from the `IO` module:

```iex
iex> IO.puts "hello\nworld"
hello
world
:ok
```

Notice the `IO.puts/1` function returns the atom `:ok` as result after printing.

Strings in Elixir are represented internally by binaries which are sequences of bytes:

```iex
iex> is_binary("hellö")
true
```

We can also get the number of bytes in a string:

```iex
iex> byte_size("hellö")
6
```

Notice the number of bytes in that string is 6, even though it has 5 characters. That's because the character "ö" takes 2 bytes to be represented in UTF-8. We can get the actual length of the string, based on the number of characters, by using the `String.length/1` function:

```iex
iex> String.length("hellö")
5
```

The [String module](/docs/stable/elixir/String.html) contains a bunch of functions that operate on strings as defined in the Unicode standard:

```iex
iex> String.upcase("hellö")
"HELLÖ"
```

## Anonymous functions

Functions are delimited by the keywords `fn` and `end`:

```iex
iex> add = fn a, b -> a + b end
#Function<12.71889879/2 in :erl_eval.expr/5>
iex> is_function(add)
true
iex> is_function(add, 2)
true
iex> is_function(add, 1)
false
iex> add.(1, 2)
3
```

Functions are "first class citizens" in Elixir meaning they can be passed as arguments to other functions just as integers and strings can. In the example, we have passed the function in the variable `add` to the `is_function/1` function which correctly returned `true`. We can also check the arity of the function by calling `is_function/2`.

Note a dot (`.`) between the variable and parenthesis is required to invoke an anonymous function.

Anonymous functions are closures, and as such they can access variables that are in scope when the function is defined:

```iex
iex> add_two = fn a -> add.(a, 2) end
#Function<6.71889879/1 in :erl_eval.expr/5>
iex> add_two.(2)
4
```

Keep in mind that a variable assigned inside a function does not affect its surrounding environment:

```iex
iex> x = 42
42
iex> (fn -> x = 0 end).()
0
iex> x
42
```

## (Linked) Lists

Elixir uses square brackets to specify a list of values. Values can be of any type:

```iex
iex> [1, 2, true, 3]
[1, 2, true, 3]
iex> length [1, 2, 3]
3
```

Two lists can be concatenated and subtracted using the `++/2` and `--/2` operators:

```iex
iex> [1, 2, 3] ++ [4, 5, 6]
[1, 2, 3, 4, 5, 6]
iex> [1, true, 2, false, 3, true] -- [true, false]
[1, 2, 3, true]
```

Throughout the tutorial, we will talk a lot about the head and tail of a list. The head is the first element of a list and the tail is the remainder of a list. They can be retrieved with the functions `hd/1` and `tl/1`. Let's assign a list to a variable and retrieve its head and tail:

```iex
iex> list = [1,2,3]
iex> hd(list)
1
iex> tl(list)
[2, 3]
```

Getting the head or the tail of an empty list is an error:

```iex
iex> hd []
** (ArgumentError) argument error
```

Sometimes you will create a list and it will return a value in single-quotes. For example:

```iex
iex> [11, 12, 13]
'\v\f\r'
iex> [104, 101, 108, 108, 111]
'hello'
```

When Elixir sees a list of printable ASCII numbers, Elixir will print that as a char list (literally a list of characters). Char lists are quite common when interfacing with existing Erlang code.

Keep in mind single-quoted and double-quoted representations are not equivalent in Elixir as they are represented by different types:

```iex
iex> 'hello' == "hello"
false
```

Single-quotes are char lists, double-quotes are strings. We will talk more about them in the ["Binaries, strings and char lists"](/getting-started/binaries-strings-and-char-lists.html) chapter.

## Tuples

Elixir uses curly brackets to define tuples. Like lists, tuples can hold any value:

```iex
iex> {:ok, "hello"}
{:ok, "hello"}
iex> tuple_size {:ok, "hello"}
2
```

Tuples store elements contiguously in memory. This means accessing a tuple element per index or getting the tuple size is a fast operation (indexes start from zero):

```iex
iex> tuple = {:ok, "hello"}
{:ok, "hello"}
iex> elem(tuple, 1)
"hello"
iex> tuple_size(tuple)
2
```

It is also possible to set an element at a particular index in a tuple with `put_elem/3`:

```iex
iex> tuple = {:ok, "hello"}
{:ok, "hello"}
iex> put_elem(tuple, 1, "world")
{:ok, "world"}
iex> tuple
{:ok, "hello"}
```

Notice that `put_elem/3` returned a new tuple. The original tuple stored in the `tuple` variable was not modified because Elixir data types are immutable. By being immutable, Elixir code is easier to reason about as you never need to worry if a particular code is mutating your data structure in place.

By being immutable, Elixir also helps eliminate common cases where concurrent code has race conditions because two different entities are trying to change a data structure at the same time.

## Lists or tuples?

What is the difference between lists and tuples?

Lists are stored in memory as linked lists, meaning that each element in a list holds its value and points to the following element until the end of the list is reached. We call each pair of value and pointer a **cons cell**:

```iex
iex> list = [1|[2|[3|[]]]]
[1, 2, 3]
```

This means accessing the length of a list is a linear operation: we need to traverse the whole list in order to figure out its size. Updating a list is fast as long as we are prepending elements:

```iex
iex> [0 | list]
[0, 1, 2, 3]
```

Tuples, on the other hand, are stored contiguously in memory. This means getting the tuple size or accessing an element by index is fast. However, updating or adding elements to tuples is expensive because it requires copying the whole tuple in memory.

Those performance characteristics dictate the usage of those data structures. One very common use case for tuples is to use them to return extra information from a function. For example, `File.read/1` is a function that can be used to read file contents and it returns tuples:

```iex
iex> File.read("path/to/existing/file")
{:ok, "... contents ..."}
iex> File.read("path/to/unknown/file")
{:error, :enoent}
```

If the path given to `File.read/1` exists, it returns a tuple with the atom `:ok` as the first element and the file contents as the second. Otherwise, it returns a tuple with `:error` and the error description.

Most of the time, Elixir is going to guide you to do the right thing. For example, there is a `elem/2` function to access a tuple item but there is no built-in equivalent for lists:

```iex
iex> tuple = {:ok, "hello"}
{:ok, "hello"}
iex> elem(tuple, 1)
"hello"
```

When "counting" the number of elements in a data structure, Elixir also abides by a simple rule: the function is named `size` if the operation is in constant time (i.e. the value is pre-calculated) or `length` if the operation is linear (i.e. calculating the length gets slower as the input grows).

For example, we have used 4 counting functions so far: `byte_size/1` (for the number of bytes in a string), `tuple_size/1` (for the tuple size), `length/1` (for the list length) and `String.length/1` (for the number of graphemes in a string). That said, we use `byte_size` to get the number of bytes in a string, which is cheap, but retrieving the number of unicode characters uses `String.length`, since the whole string needs to be traversed.

Elixir also provides `Port`, `Reference` and `PID` as data types (usually used in process communication), and we will take a quick look at them when talking about processes. For now, let's take a look at some of the basic operators that go with our basic types.
