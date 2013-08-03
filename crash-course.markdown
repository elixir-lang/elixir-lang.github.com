---
section: home
layout: default
---

# Erlang/Elixir Syntax: A Crash Course

This is a quick introduction to the Elixir syntax for Erlang developers and vice-versa. It is the absolute minimum amount of knowledge you need in order to understand Elixir/Erlang code, support interoperability, read the docs, sample code, etc.

This page is divided into sections:

1. [Running Code](#running_code)
2. [Notable Differences](#notable_differences)
3. [Data Types](#data_types)
4. [Modules](#modules)
5. [Function Syntax](#function_syntax)
6. [Control Flow](#control_flow)
7. [Adding Elixir to existing Erlang programs](#interop)
8. [Further reading](#further_reading)

<div id="running_code"></div>

## 1 Running Code

### Erlang

The fastest way to run some code is to launch the Erlang shell -- `erl`. Many code snippets on this page can be pasted directly into the shell. However, when you want to define a named function, Erlang expects it to be inside of a module, and modules have to be compiled. Here's a skeleton for a module:

```erlang
-module(module_name).  % you may use some other name
-compile(export_all).

hello() ->
  io:format("~s~n", ["Hello world!"]).
```

Add your functions to it, save it to disk, run `erl` from the same directory and execute the `compile` command:

```erlang
Eshell V5.9  (abort with ^G)
1> c(module_name).
ok
1> module_name:hello().
Hello world!
ok
```

You may keep the shell running while you're editing the file. Just don't forget to execute `c(module_name)` to load the latest changes. Note that the filename has to be the same as the one declared in the `-module()` directive, plus an extension `.erl`.

### Elixir

Elixir too has an interactive shell called `iex`. Compiling Elixir code can be done with `elixirc` (which is similar to Erlang's `erlc`). Elixir also provides an executable named `elixir` to run Elixir code. The module defined above can be written in Elixir as:

```elixir
# module_name.ex
defmodule ModuleName do
  def hello do
    IO.puts "Hello World"
  end
end
```

And compiled from `iex`:

```iex
Interactive Elixir
iex> c("module_name.ex")
[ModuleName]
iex> ModuleName.hello
Hello world!
:ok
```

However notice that in Elixir you don't need to create a file only to create a new module, Elixir modules can be defined directly in the shell:

```elixir
defmodule MyModule do
  def hello do
    IO.puts "Another Hello"
  end
end
```

<div id="notable_differences"></div>

## 2 Notable Differences

This section goes over some of the syntactic differences between the two languages.

### Operator Names

Some operators are spelled differently.

    | Erlang         | Elixir         | Meaning                                 |
    -----------------------------------------------------------------------------
    | and            | NOT AVAILABLE  | Logical 'and', evaluates both arguments |
    | andalso        | and            | Logical 'and', short-circuits           |
    | or             | NOT AVAILABLE  | Logical 'or', evaluates both arguments  |
    | orelse         | or             | Logical 'or', short-circuits            |
    | =:=            | ===            | A match operator                        |
    | =/=            | !==            | A negative match                        |
    | /=             | !=             | Not equals                              |
    | =<             | <=             | Less than or equals                     |
    | !              | <-             | Send messages                           |


### Delimiters

Erlang expressions are terminated with a dot `.` and comma `,` is used to evaluates multiple expressions within one context (in a function definition, for instance). In Elixir, expressions are delimited by a line break or a colon-comma `;`.

**Erlang**

```erlang
X = 2, Y = 3.
X + Y.
```

**Elixir**
```elixir
x = 2; y = 3
x + y
```

### Variable Names

Variables in Erlang can only be assigned once. The Erlang shell provides a special command `f` that allows you to erase the binding of a variable or all variables at once.

Elixir allows you to assign to a variable more than once. If you want to match against the value of a previously assigned variable, you should use `^`:

**Erlang**

```erlang
Eshell V5.9  (abort with ^G)
1> X = 10.
10
2> X = X + 1.
** exception error: no match of right hand side value 11
3> X1 = X + 1.
11
4> f(X).
ok
5> X = X1 * X1.
121
6> f().
ok
7> X.
* 1: variable 'X' is unbound
8> X1.
* 1: variable 'X1' is unbound
```

**Elixir**

```elixir
iex> a = 1
1
iex> a = 2
2
iex> ^a = 3
** (MatchError) no match of right hand side value: 3
```

### Calling Functions

Elixir allows you to omit parentheses in function calls, Erlang does not.

    | Erlang            | Elixir         |
    --------------------------------------
    | some_function().  | some_function  |
    | sum(A, B)         | sum a, b       |

Invoking a function from a module uses different syntax. In Erlang, you would write

```erlang
orddict:new().
```

to invoke the `new` function from the `orddict` module. In Elixir, use the dot `.` in place of the colon `:`

```elixir
Kernel.self
```

**Note**. Since Erlang modules are represented by atoms, you may invoke Erlang functions in Elixir as follows:

```elixir
:lists.sort [3, 2, 1]
```

All of the Erlang built-ins reside in the `:erlang` module.

<div id="data_types"></div>

## 3 Data Types

Erlang and Elixir have the same data types for the most part, but there are a number of differences.

### Atoms

In Erlang, an `atom` is any identifier that starts with a small letter, e.g. `ok`, `tuple`, `donut`. Identifiers that start with a capital letters are always treated as variable names. Elixir, on the other hand, uses the former for naming variables, and the latter are treated as atom aliases. Atoms in Elixir always start with a colon `:`.

**Erlang**

```erlang
im_an_atom.
me_too.

Im_a_var.
X = 10.
```

**Elixir**

```elixir
:im_an_atom
:me_too

im_a_var
x = 10

Module  # this is called an atom alias; it expands to :'Elixir.Module'
```

It is also possible to create atoms that start with a character other than a lowercase letter. The syntax is different between the two languages:

**Erlang**

```erlang
is_atom(ok).                %=> true
is_atom('0_ok').            %=> true
is_atom('Multiple words').  %=> true
is_atom('').                %=> true
```

**Elixir**

```elixir
is_atom :ok                 #=> true
is_atom :'ok'               #=> true
is_atom :"Multiple words"   #=> true
```

### Tuples

The syntax for tuples is the same in both languages but the APIs are different. Elixir attempts to normalize Erlang libraries in a way that:

1. The `subject` of the function is always the first argument and
2. All data structures functions employ zero-based access.

That said, Elixir does not import the default `element` and `setelement` functions, but instead provides `elem` and `setelem`:

**Erlang**

```erlang
element(1, { a, b, c })       %=> a
setelement(1, { a, b, c }, d) %=> { d, b, c }
```

**Elixir**

```elixir
elem({ :a, :b, :c }, 0)        #=> :a
setelem({ :a, :b, :c }, 0, :d) #=> { :d, :b, :c }
```

### Lists and Binaries

Elixir has a shortcut syntax for binaries:

**Erlang**

```erlang
is_list('Hello').        %=> false
is_list("Hello").        %=> true
is_binary(<<"Hello">>).  %=> true
```

**Elixir**

```elixir
is_list 'Hello'          #=> true
is_binary "Hello"        #=> true
is_binary <<"Hello">>    #=> true
<<"Hello">> === "Hello"  #=> true
```

In Elixir, the word **string** means a utf-8 binary and there is a `String` module that works on such data. Elixir also expects your source files to be utf-8 encoded. On the other hand, **string** in Erlang refers to char lists and there is a `:string` module, that's not utf-8 aware and works mostly with char lists.

Elixir also supports multiline strings (also called heredocs):

```elixir
is_binary """
This is a binary
spawning several
lines.
"""
#=> true
```

### Regular expressions

Elixir supports a literal syntax for regular expressions. Such syntax allows regexes to be compiled at compilation time instead of runtime and does not require you to double escape special regex characters:

**Erlang**

```erlang
{ ok, Pattern } = re:compile("abc\\s").
re:run("abc ", Pattern).
%=> { match, ["abc "] }
```

**Elixir**

```elixir
Regex.run %r/abc\s/, "abc "
#=> ["abc "]
```

Regexes are also supported in heredocs, which is convenient to define multiline regexes:

```elixir
is_regex %r"""
This is a regex
spawning several
lines.
"""
```

### Keyword list

Elixir offers a literal syntax for creating a list of two-item tuples where the first item in the tuple is an atom and calls them keyword lists:

**Erlang**

```erlang
[{another_key,20},{key,10}]
```

**Elixir**

```elixir
kw = [another_key: 20, key: 10]
kw[:another_key] #=> 20
```

### Records

The syntax for records differs significantly between Erlang and Elixir. Please refer to [this section][1] in the Erlang book to read a detailed introduction to records in Erlang. And [this chapter][2] from Elixir's Getting Started guide provides a description of records in Elixir.

[1]: http://learnyousomeerlang.com/a-short-visit-to-common-data-structures#records
[2]: http://elixir-lang.org/getting_started/4.html

In order to translate Erlang records into Elixir records, use Record.extract(). For example, to use the `ec2_instance_spec` record from [erlcloud][8]:

```elixir
defrecord :ec2_instance_spec, Record.extract(:ec2_instance_spec,
                                from: "deps/erlcloud/include/erlcloud_ec2.hrl")

new_host = :ec2_instance_spec.new(
    image_id:          "ami-6d3f9704",
    instance_type:     "t1.micro",
    availability_zone: "us-east-1b"
)

IO.puts inspect(new_host)
```

[8]: https://github.com/gleber/erlcloud/blob/master/include/erlcloud_ec2.hrl#L11

<div id="modules"></div>

## 4 Modules

Each Erlang module lives in its own file which has the following structure:

```erlang
-module(hello_module).
-export([some_fun/0, fun/1]).

% A "Hello world" function
some_fun() ->
  io:format('~s~n', ['Hello world!']).

% This one works only with lists
fun(List) when is_list(List) ->
  io:format('~s~n', List).

% Non-exported functions are private
priv() ->
  secret_info.
```

Here we create a module named ``hello_module``. In it we define three functions, the first two of which are made available for other modules to call via the ``export`` directive at the top. It contains a list of functions, each of which is written in the format ``<function name>/<arity>``. Arity stands for the number of arguments.

An Elixir equivalent to the Erlang above:

```elixir
defmodule HelloModule do
  # A "Hello world" function
  def some_fun do
    IO.puts "Hello world!"
  end

  # This one works only with lists
  def some_fun(list) when is_list(list) do
    IO.inspect list
  end

  # A private function
  defp priv do
    :secret_info
  end
end
```

In Elixir, it is also possible to have multiple modules in one file, as well as nested modules:

```elixir
defmodule HelloModule do
  defmodule Utils do
    def util do
      IO.puts "Utilize"
    end

    defp priv do
      :cant_touch_this
    end
  end

  # More on this in the Records section
  defrecord State, ponies: [:sally]

  def dummy do
    :ok
  end
end

defmodule ByeModule do
end

HelloModule.dummy
#=> :ok

HelloModule.Utils.util
#=> "Utilize"

HelloModule.Utils.priv
#=> ** (UndefinedFunctionError) undefined function: HelloModule.Utils.priv/0

HelloModule.State.new
#=> HelloModule.State[ponies: [:sally]]
```

<div id="function_syntax"></div>

## 5 Function Syntax

[This chapter][3] from the Erlang book provides a detailed description of pattern matching and function syntax in Erlang. Here, I'm briefly covering the main points and provide sample code both in Erlang and Elixir.

[3]: http://learnyousomeerlang.com/syntax-in-functions

### Pattern Matching

Pattern matching in Elixir is based on Erlang's implementation and in general very similar:

**Erlang**

```erlang
loop_through([H|T]) ->
  io:format '~p~n', [H],
  loop_through(T);

loop_through([]) ->
  ok.
```

**Elixir**

```elixir
def loop_through([h|t]) do
  IO.inspect h
  loop_through t
end

def loop_through([]) do
  :ok
end
```

When defining a function with the same name multiple times, each such definition is called a **clause**. In Erlang, clauses always go side by side and are separated by a semi-colon ``;``. The last clause is terminated by a dot ``.``.

Elixir doesn't require punctuation to separate clauses, but they must be grouped together.

### Identifying functions

In both Erlang and Elixir, a function is not identified only by its name, but by its name and arity. In both examples below, we are defining four different functions (all named `sum`, but with different arity):

**Erlang**

```erlang
sum() -> 0;
sum(A) -> A;
sum(A, B) -> A + B;
sum(A, B, C) -> A + B + C.
```

**Elixir**

```elixir
def sum, do: 0
def sum(a), do: a
def sum(a, b), do: a + b
def sum(a, b, c), do: a + b + c
```

Guard expressions provide a concise way to define functions that accept a limited set of values based on some condition.

**Erlang**

```erlang
sum(A, B) when is_integer(A), is_integer(B) ->
  A + B;

sum(A, B) when is_list(A), is_list(B) ->
  A ++ B;

sum(A, B) when is_binary(A), is_binary(B) ->
  <<A/binary,  B/binary>>.

sum(1, 2).
%=> 3

sum([1], [2]).
%=> [1,2]

sum("a", "b").
%=> "ab"
```

**Elixir**

```elixir
def sum(a, b) when is_integer(a) and is_integer(b) do
  a + b
end

def sum(a, b) when is_list(a) and is_list(b) do
  a ++ b
end

def sum(a, b) when is_binary(a) and is_binary(b) do
  a <> b
end

sum 1, 2
#=> 3

sum [1], [2]
#=> [1,2]

sum "a", "b"
#=> "ab"
```

In addition, Elixir provides default values for arguments whereas Erlang does not.

```elixir
def mul_by(x, n // 2) do
  x * n
end

mul_by 4, 3 #=> 12
mul_by 4    #=> 8
```

### Anonymous Functions

Anonymous functions are defined in the following way:

**Erlang**

```erlang
Sum = fun(A, B) -> A + B end.
Sum(4, 3).
%=> 7

Square = fun(X) -> X * X end.
lists:map(Square, [1, 2, 3, 4]).
%=> [1, 4, 9, 16]
```

**Elixir**

```elixir
sum = fn(a, b) -> a + b end
sum.(4, 3)
#=> 7

square = fn(x) -> x * x end
Enum.map [1, 2, 3, 4], square
#=> [1, 4, 9, 16]
```

It is possible to use pattern matching when defining anonymous functions too.

**Erlang**

```erlang
F = fun(Tuple = {a, b}) ->
        io:format("All your ~p are belong to us~n", [Tuple]);
        ([]) ->
        "Empty"
    end.

F([]).
%=> "Empty"

F({a, b}).
%=> "All your {a,b} are belong to us"
```

**Elixir**

```elixir
f = fn
      {:a, :b} = tuple ->
        IO.puts "All your #{inspect tuple} are belong to us"
      [] ->
        "Empty"
    end

f.([])
#=> "Empty"

f.({:a, :b})
#=> "All your {:a,:b} are belong to us"
```

### First-Class Functions

Anonymous functions are first-class values, so they can be passed as arguments to other functions and also can serve as a return value. There is a special syntax to allow named functions be treated in the same manner.

**Erlang**

```erlang
-module(math).
-export([square/1]).

square(X) -> X * X.

lists:map(fun math:square/1, [1, 2, 3]).
%=> [1, 4, 9]
```

**Elixir**

```elixir
defmodule Math do
  def square(x) do
    x * x
  end
end

Enum.map [1,2,3], &Math.square/1
#=> [1, 4, 9]
```

### Partials in Elixir

Elixir supports partial application of functions which can be used to define anonymous functions in a concise way:

```elixir
Enum.map [1, 2, 3, 4], &1 * 2
#=> [2, 4, 6, 8]

List.foldl [1, 2, 3, 4], 0, &1 + &2
#=> 10
```

Partials also allow us to pass named functions as arguments.

```elixir
defmodule Math do
  def square(x) do
    x * x
  end
end

Enum.map [1,2,3], Math.square &1

#=> [1, 4, 9]
```

<div id="control_flow"></div>

## 6 Control Flow

The constructs `if` and `case` are actually expressions in both Erlang and Elixir, but may be used for control flow like in imperative languages.

### Case

The ``case`` construct provides control flow based purely on pattern matching.

**Erlang**

```erlang
case { X, Y } of
{ a, b } -> ok;
{ b, c } -> good;
Else -> Else
end
```

**Elixir**

```elixir
case { x, y } do
  { :a, :b } -> :ok
  { :b, :c } -> :good
  other -> other
end
```

### If

**Erlang**

```erlang
Test_fun = fun (X) ->
  if X > 10 ->
       greater_than_ten;
     X < 10, X > 0 ->
       less_than_ten_positive;
     X < 0; X =:= 0 ->
       zero_or_negative;
     true ->
       exactly_ten
  end
end.

Test_fun(11).
%=> greater_than_ten

Test_fun(-2).
%=> zero_or_negative

Test_fun(10).
%=> exactly_ten
```

**Elixir**

```elixir
test_fun = fn(x) ->
  cond do
    x > 10 ->
      :greater_than_ten
    x < 10 and x > 0 ->
      :less_than_ten_positive
    x < 0 or x === 0 ->
      :zero_or_negative
    true ->
      :exactly_ten
  end
end

test_fun.(44)
#=> :greater_than_ten

test_fun.(0)
#=> :zero_or_negative

test_fun.(10)
#=> :exactly_ten
```

There are two important differences between Elixir's `cond` and Erlang's `if`:

1) `cond` allows any expression on the left side while Erlang allows only guard clauses;

2) `cond` uses Elixir's concepts of truthy and falsy values (everything is truthy except `nil` and `false`), Erlang's `if` expects strictly a boolean;

Elixir also provides a `if` function that resembles more imperative languages and is useful when you need to check if one clause is true or false:

```elixir
if x > 10 do
  :greater_than_ten
else
  :not_greater_than_ten
end
```

### Sending and Receiving Messages

The syntax for sending and receiving differs only slightly between Erlang and Elixir.

**Erlang**

```erlang
Pid = self().

Pid ! { hello }.

receive
  { hello } -> ok;
  Other -> Other
after
  10 -> timeout
end.
```

**Elixir**

```elixir
pid = Kernel.self

pid <- { :hello }

receive do
  { :hello } -> :ok
  other -> other
after
  10 -> :timeout
end
```

<div id="interop"></div>

## 7 Adding Elixir to existing Erlang programs

Elixir compiles directly into BEAM byte code. This means that Elixir code can be called from Erlang and vice versa, without the need to write any bindings. All Elixir modules start with the "Elixir." prefix followed by the regular Elixir name. For example, here is how to use the UTF-8 aware String downcase from Elixir in Erlang:

```erlang
-module(bstring).
-export([downcase/1]).

downcase(Bin) ->
  'Elixir.String':downcase(Bin).
```

### Rebar integration

If you are using rebar, you should be able to include Elixir git repository as a dependency:

    https://github.com/elixir-lang/elixir.git

Elixir is structured similarly to Erlang's OTP. It is divided into applications that are placed inside the `lib` directory, as seen in its [source code repository](https://github.com/elixir-lang/elixir). Since rebar does not recognize such structure, we need to explicitly add to our `rebar.config` which Elixir apps we want to use, for example:

```erlang
{lib_dirs, [
  "deps/elixir/lib"
]}.
```

This should be enough to invoke Elixir functions straight from your Erlang code. If you are also going to write Elixir code, you can [install Elixir's rebar plugin for automatic compilation](https://github.com/yrashk/rebar_elixir_plugin).

### Manual integration

If you are not using rebar, the easiest approach to use Elixir in your existing Erlang software is to install Elixir using one of the different ways specified in the [Getting Started guide](http://elixir-lang.org/getting_started/1.html) and add the `lib` directory in your checkout to `ERL_LIBS`.

<div id="further_reading"></div>

## 8 Further Reading

Erlang's official documentation site has a nice [collection][4] of programming examples. It can be a good exercise to translate them into Elixir. [Erlang cookbook][5] offers even more useful code examples.

Elixir also provides a [Getting Started Guide][6] and has [documentation available online][7].

[4]: http://www.erlang.org/doc/programming_examples/users_guide.html
[5]: http://schemecookbook.org/Erlang/TOC
[6]: http://elixir-lang.org/getting_started/1.html
[7]: http://elixir-lang.org/docs
