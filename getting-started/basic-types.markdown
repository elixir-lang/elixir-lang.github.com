---
layout: getting-started
title: Basic types
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

Notice that Elixir allows you to drop the parentheses when invoking named functions. This feature gives a cleaner syntax when writing declarations and control-flow constructs.

Elixir also supports shortcut notations for entering binary, octal, and hexadecimal numbers:

```iex
iex> 0b1010
10
iex> 0o777
511
iex> 0x1F
31
```

Float numbers require a dot followed by at least one digit and also support `e` for scientific notation:

```iex
iex> 1.0
1.0
iex> 1.0e-10
1.0e-10
```

Floats in Elixir are 64-bit double precision.

You can invoke the `round` function to get the closest integer to a given float, or the `trunc` function to get the integer part of a float.

```iex
iex> round(3.58)
4
iex> trunc(3.58)
3
```

## Identifying functions and documentation

Functions in Elixir are identified by both their name and their arity. The arity of a function describes the number of arguments that the function takes. From this point on we will use both the function name and its arity to describe functions throughout the documentation. `round/1` identifies the function which is named `round` and takes `1` argument, whereas `round/2` identifies a different (nonexistent) function with the same name but with an arity of `2`.

We can also use this syntax to access documentation. The Elixir shell defines the `h` function, which you can use to access documentation for any function. For example, typing `h round/1` is going to print the documentation for the `round/1` function:

```iex
iex> h round/1
                             def round()
                             
Rounds a number to the nearest integer.
```

It also works with operators and other constructs (try `h +/2`). Invoking `h` without arguments displays the documentation for `IEx.Helpers`, which is where `h` and other functionality is defined.

## Booleans

Elixir supports `true` and `false` as booleans:

```iex
iex> true
true
iex> true == false
false
```

Elixir provides a bunch of predicate functions to check for a value type. For example, the `is_boolean/1` function can be used to check if a value is a boolean or not:

```iex
iex> is_boolean(true)
true
iex> is_boolean(1)
false
```

You can also use `is_integer/1`, `is_float/1` or `is_number/1` to check, respectively, if an argument is an integer, a float, or either.

## Atoms

An atom is a constant whose name is its own value. Some other languages call these symbols:

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

Finally, Elixir has a construct called aliases which we will explore later. Aliases start in upper case and are also atoms:

```iex
iex> is_atom(Hello)
true
```

## Strings

Strings in Elixir are delimited by double quotes, and they are encoded in UTF-8:

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

Strings can have line breaks in them. You can introduce them using escape sequences:

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

Notice that the `IO.puts/1` function returns the atom `:ok` after printing.

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

Notice that the number of bytes in that string is 6, even though it has 5 characters. That's because the character "ö" takes 2 bytes to be represented in UTF-8. We can get the actual length of the string, based on the number of characters, by using the `String.length/1` function:

```iex
iex> String.length("hellö")
5
```

The [String module](https://hexdocs.pm/elixir/String.html) contains a bunch of functions that operate on strings as defined in the Unicode standard:

```iex
iex> String.upcase("hellö")
"HELLÖ"
```

## Anonymous functions

Anonymous functions can be created inline and are delimited by the keywords `fn` and `end`:

```iex
iex> fn a, b -> a + b end
#Function<12.71889879/2 in :erl_eval.expr/5>
iex> (fn a, b -> a + b end).(1, 2)
3
iex> is_function(fn a, b -> a + b end)
true
```

Anonymous functions are "first class citizens" in Elixir, meaning they can be assigned to variables, and passed as arguments to other functions in the same way as integers and strings. In the example above, we have passed an anonymous function definition to the `is_function/1` function which correctly returned `true`. Let's assign it to a variable next:

```iex
iex> add = fn a, b -> a + b end
#Function<13.91303403/2 in :erl_eval.expr/5>
iex> add
#Function<13.91303403/2 in :erl_eval.expr/5>
iex> add.(1, 2)
3
# check if add is a function that expects exactly 2 arguments
iex> is_function(add, 2)
true
# check if add is a function that expects exactly 1 argument
iex> is_function(add, 1)
false
```

Parenthesised arguments after the anonymous function indicate that we want the function to be evaluated, not just its definition returned.  Note that a dot (`.`) between the variable and parentheses is required to invoke an anonymous function. The dot ensures there is no ambiguity between calling the anonymous function matched to a variable `add` and a named function `add/2`. In this sense, Elixir makes a clear distinction between anonymous functions and named functions.

We will explore named functions when dealing with [Modules and Functions](/getting-started/modules-and-functions.html), since named functions can only be defined within a module.

Anonymous functions are closures and as such they can access variables that are in scope when the function is defined. Let's define a new anonymous function that uses the `add` anonymous function we have previously defined:

```iex
iex> double = fn a -> add.(a, a) end
#Function<6.71889879/1 in :erl_eval.expr/5>
iex> double.(2)
4
```

Keep in mind a variable assigned inside a function does not affect its surrounding environment:

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

Two lists can be concatenated or subtracted using the `++/2` and `--/2` operators respectively:

```iex
iex> [1, 2, 3] ++ [4, 5, 6]
[1, 2, 3, 4, 5, 6]
iex> [1, true, 2, false, 3, true] -- [true, false]
[1, 2, 3, true]
```

List operators never modify the existing list. Concatenating to or removing elements from a list returns a new list. We say that Elixir data structures are *immutable*. One advantage of immutability is that it leads to clearer code. You can freely pass the data around with the guarantee no one will mutate it in memory - only transform it.

Throughout the tutorial, we will talk a lot about the head and tail of a list. The head is the first element of a list and the tail is the remainder of the list. They can be retrieved with the functions `hd/1` and `tl/1`. Let's assign a list to a variable and retrieve its head and tail:

```iex
iex> list = [1, 2, 3]
iex> hd(list)
1
iex> tl(list)
[2, 3]
```

Getting the head or the tail of an empty list throws an error:

```iex
iex> hd []
** (ArgumentError) argument error
```

Sometimes you will create a list and it will return a value in single quotes. For example:

```iex
iex> [11, 12, 13]
'\v\f\r'
iex> [104, 101, 108, 108, 111]
'hello'
```

When Elixir sees a list of printable ASCII numbers, Elixir will print that as a charlist (literally a list of characters). Charlists are quite common when interfacing with existing Erlang code. Whenever you see a value in IEx and you are not quite sure what it is, you can use the `i/1` to retrieve information about it:

```iex
iex> i 'hello'
Term
  'hello'
Data type
  List
Description
  ...
Raw representation
  [104, 101, 108, 108, 111]
Reference modules
  List
Implemented protocols
  ...
```

Keep in mind single-quoted and double-quoted representations are not equivalent in Elixir as they are represented by different types:

```iex
iex> 'hello' == "hello"
false
```

Single quotes are charlists, double quotes are strings. We will talk more about them in the ["Binaries, strings and charlists"](/getting-started/binaries-strings-and-char-lists.html) chapter.

## Tuples

Elixir uses curly brackets to define tuples. Like lists, tuples can hold any value:

```iex
iex> {:ok, "hello"}
{:ok, "hello"}
iex> tuple_size {:ok, "hello"}
2
```

Tuples store elements contiguously in memory. This means accessing a tuple element by index or getting the tuple size is a fast operation. Indexes start from zero:

```iex
iex> tuple = {:ok, "hello"}
{:ok, "hello"}
iex> elem(tuple, 1)
"hello"
iex> tuple_size(tuple)
2
```

It is also possible to put an element at a particular index in a tuple with `put_elem/3`:

```iex
iex> tuple = {:ok, "hello"}
{:ok, "hello"}
iex> put_elem(tuple, 1, "world")
{:ok, "world"}
iex> tuple
{:ok, "hello"}
```

Notice that `put_elem/3` returned a new tuple. The original tuple stored in the `tuple` variable was not modified. Like lists, tuples are also immutable. Every operation on a tuple returns a new tuple, it never changes the given one.

## Lists or tuples?

What is the difference between lists and tuples?

Lists are stored in memory as linked lists, meaning that each element in a list holds its value and points to the following element until the end of the list is reached. This means accessing the length of a list is a linear operation: we need to traverse the whole list in order to figure out its size.

Similarly, the performance of list concatenation depends on the length of the left-hand list:

```iex
iex> list = [1, 2, 3]

# This is fast as we only need to traverse `[0]` to prepend to `list`
iex> [0] ++ list
[0, 1, 2, 3]

# This is slow as we need to traverse `list` to append 4
iex> list ++ [4]
[1, 2, 3, 4]
```

Tuples, on the other hand, are stored contiguously in memory. This means getting the tuple size or accessing an element by index is fast. However, updating or adding elements to tuples is expensive because it requires creating a new tuple in memory:

```iex
iex> tuple = {:a, :b, :c, :d}
iex> put_elem(tuple, 2, :e)
{:a, :b, :e, :d}
```

Note that this applies only to the tuple itself, not its contents. For instance, when you update a tuple, all entries are shared between the old and the new tuple, except for the entry that has been replaced. In other words, tuples and lists in Elixir are capable of sharing their contents. This reduces the amount of memory allocation the language needs to perform and is only possible thanks to the immutable semantics of the language.

Those performance characteristics dictate the usage of those data structures. One very common use case for tuples is to use them to return extra information from a function. For example, `File.read/1` is a function that can be used to read file contents. It returns a tuple:

```iex
iex> File.read("path/to/existing/file")
{:ok, "... contents ..."}
iex> File.read("path/to/unknown/file")
{:error, :enoent}
```

If the path given to `File.read/1` exists, it returns a tuple with the atom `:ok` as the first element and the file contents as the second. Otherwise, it returns a tuple with `:error` and the error description.

Most of the time, Elixir is going to guide you to do the right thing. For example, there is an `elem/2` function to access a tuple item but there is no built-in equivalent for lists:

```iex
iex> tuple = {:ok, "hello"}
{:ok, "hello"}
iex> elem(tuple, 1)
"hello"
```

When counting the elements in a data structure, Elixir also abides by a simple rule: the function is named `size` if the operation is in constant time (i.e. the value is pre-calculated) or `length` if the operation is linear (i.e. calculating the length gets slower as the input grows). As a mnemonic, both "length" and "linear" start with "l".

For example, we have used 4 counting functions so far: `byte_size/1` (for the number of bytes in a string), `tuple_size/1` (for tuple size), `length/1` (for list length) and `String.length/1` (for the number of graphemes in a string). We use `byte_size` to get the number of bytes in a string -- a cheap operation. Retrieving the number of Unicode characters, on the other hand, uses `String.length`, and may be expensive as it relies on a traversal of the entire string.

Elixir also provides `Port`, `Reference`, and `PID` as data types (usually used in process communication), and we will take a quick look at them when talking about processes. For now, let's take a look at some of the basic operators that go with our basic types.
