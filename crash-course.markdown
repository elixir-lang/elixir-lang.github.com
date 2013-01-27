---
section: home
layout: default
---

# Erlang/Elixir Syntax: A Crash Course

This is a quick introduction to the Elixir syntax for Erlang developers and vice-versa. It is the absolute minimum amount of knowledge you need in order to understand Erlang code, read the docs, sample code, etc.

## Running Erlang code

The fastest way to run some code is to launch the Erlang shell -- `erl`. Many code snippets on this page can be pasted directly into the shell. However, when you want to define a named function, Erlang expects it to be inside of a module, and modules have to be compiled. Here's a skeleton for a module:

{% highlight erlang %}
-module(module_name).  % you may use some other name
-compile(export_all).

hello() ->
  io:format("~s~n", ["Hello world!"]).
{% endhighlight %}

Add your functions to it, save it to disk, run `erl` from the same directory and execute the `compile` command:

{% highlight erlang %}
Eshell V5.9  (abort with ^G)
1> c(module_name).
ok
1> module_name:hello().
Hello world!
ok
{% endhighlight %}

You may keep the shell running while you're editing the file. Just don't forget to execute `c(module_name)` to load the latest changes. Note that the filename has to be the same as the one declared in the `-module()` directive, plus an extension `.erl`.

## Running Elixir code

Elixir too has an interactive shell called `iex`. Compiling Elixir code can be done with `elixirc` (which is similar to Erlang's `erlc`). Elixir also provides an executable named `elixir` to run Elixir code. The module defined above can be written in Elixir as:

{% highlight ruby %}
# module_name.ex
defmodule ModuleName do
  def hello do
    IO.puts "Hello World"
  end
end
{% endhighlight %}

And compiled from `iex`:

{% highlight ruby %}
Interactive Elixir
iex> c("module_name.ex")
[ModuleName]
iex> ModuleName.hello
Hello world!
:ok
{% endhighlight %}

## Notable differences

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
    | !              | <-             | Send. See section _Processes_ below     |


### Delimiters

Erlang expressions are terminated with a dot `.` and comma `,` is used to evaluates multiple expressions within one context (in a function definition, for instance). In Elixir, expressions are delimited by a line break or a colon-comma `;`.

**Erlang**

{% highlight erlang %}
X = 2, Y = 3.
X + Y.
{% endhighlight %}

**Elixir**

{% highlight ruby %}
x = 2; y = 3
x + y
{% endhighlight %}

### Variable Names

Variables in Erlang can only be assigned once. The Erlang shell provides a special command `f` that allows you to erase the binding of a variable or all variables at once.

Elixir allows you to assign to a variable more than once. If you want to match against the value of a previously assigned variable, you should use `^`:

**Erlang**

{% highlight erlang %}
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
{% endhighlight %}

**Elixir**

{% highlight ruby %}
iex> a = 1
1
iex> a = 2
2
iex> ^a = 3
** (MatchError) no match of right hand side value 11
{% endhighlight %}

### Calling Functions

Elixir allows you to omit parentheses in function calls, Erlang does not.

    | Erlang            | Elixir         |
    --------------------------------------
    | some_function().  | some_function  |
    | sum(A, B)         | sum a, b       |

### Module References

Invoking a function from a module uses different syntax. In Erlang, you would write

{% highlight erlang %}
orddict:new().
{% endhighlight %}

to invoke the `new` function from the `orddict` module. In Elixir, use the dot `.` in place of the colon `:`

{% highlight ruby %}
Process.self
{% endhighlight %}

**Note**. You may invoke Erlang functions in Elixir in one of two ways:

{% highlight ruby %}
Erlang.lists.sort [3, 2, 1]
:lists.sort [3, 2,1]
{% endhighlight %}

All of the Erlang's modules can be accessed in this manner. All of the Erlang built-ins reside in the `Erlang.erlang` (or `:erlang`) module.


## Data Types

Erlang and Elixir have the same data types for the most part, but there is a number of differences.

### Atoms

In Erlang, an `atom` is any identifier that starts with a small letter, e.g. `ok`, `tuple`, `donut`. Identifiers that start with a capital letters are always treated as variable names. Elixir, on the other hand, uses the former for naming variables, and the latter are treated as module references. Atoms in Elixir always start with a colon `:`.

**Erlang**

{% highlight erlang %}
im_an_atom.
me_too.

Im_a_var.
X = 10.
{% endhighlight %}

**Elixir**

{% highlight ruby %}
:im_an_atom
:me_too

im_a_var
x = 10

Module  # this is called an atom alias; it expands to :'__MAIN__.Module'
{% endhighlight %}

It is also possible to create atoms that start with a character other than a lowercase letter. The syntax is different between the two languages:

**Erlang**

{% highlight erlang %}
is_atom(ok).                %=> true
is_atom('0_ok').            %=> true
is_atom('Multiple words').  %=> true
is_atom('').                %=> true
{% endhighlight %}

**Elixir**

{% highlight ruby %}
is_atom :ok                 #=> true
is_atom :'ok'               #=> true
is_atom :"Multiple words"   #=> true
{% endhighlight %}

### Binaries

Elixir has a shortcut syntax for binaries.

**Erlang**

{% highlight erlang %}
is_list('Hello').        %=> false
is_list("Hello").        %=> true
is_binary(<<"Hello">>).  %=> true
{% endhighlight %}

**Elixir**
{% highlight text %}
is_list 'Hello'          #=> true
is_binary "Hello"        #=> true
is_binary <<"Hello">>    #=> true
<<"Hello">> === "Hello"  #=> true
{% endhighlight %}

### Orddicts

Orddicts in Erlang are created using either `orddict:new/0` or `orddict:from_list/1`. Elixir has a special syntax for this purpose:

**Erlang**

{% highlight erlang %}
Dict = orddict:new(),
Dict1 = orddict:store(key, 10, Dict),
Dict2 = orddict:store(another_key, 20, Dict1).
%=> [{another_key,20},{key,10}]

Dict = orddict:from_list([{key, 10}, {another_key, 20}]).
%=> [{another_key,20},{key,10}]
{% endhighlight %}

**Elixir**

{% highlight ruby %}
dict = [key: 10, another_key: 20]
#=> [{:another_key,20},{:key,10}]
{% endhighlight %}

### Records

The syntax for records differs significantly between Erlang and Elixir. Please refer to [this section][1] in the Erlang book to read a detailed introduction to records in Erlang. And [this chapter][2] from Elixir's Getting Started guide provides a description of records in Elixir.

[1]: http://learnyousomeerlang.com/a-short-visit-to-common-data-structures#records
[2]: http://elixir-lang.org/getting_started/4.html

## Modules

Each Erlang module lives in its own file which has the following structure:

{% highlight erlang %}
-module(hello_module).
-export([fun/0, fun/1]).

% A "Hello world" function
fun() ->
  io:format('~s~n', ['Hello world!']).

% This one works only with lists
fun(List) when is_list(List) ->
  io:format('~s~n', List).

% A private function
priv() ->
  secret_info.
{% endhighlight %}

Here we create a module named ``hello_module``. In it we define three functions, the first two of which are made available for other modules to call via the ``export`` directive at the top. It contains a list of functions, each of which is written in the format ``<function name>/<arity>``. Arity stands for the number of arguments.

An equivalent code in Elixir:

{% highlight ruby %}
defmodule HelloModule do
  # A "Hello world" function
  def fun do
    IO.puts "Hello world!"
  end

  # This one works only with lists
  def fun(list) when is_list(list) do
    IO.inspect list
  end

  # A private function
  defp priv do
    :secret_info
  end
end
{% endhighlight %}

In Elixir, it is also possible to have multiple modules in one file, as well as nested modules:

{% highlight ruby %}
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
#=> { HelloModule.State, [:sally] }
{% endhighlight %}

## Function Syntax

[This chapter][3] from the Erlang book provides a detailed description of pattern matching and function syntax in Erlang. Here, I'm briefly covering the main points and provide sample code both in Erlang and Elixir.

[3]: http://learnyousomeerlang.com/syntax-in-functions

### Pattern Matching

Pattern matching in Elixir is based on Erlang implementation and in general very similar:

**Erlang**

{% highlight erlang %}
loop_through([H|T]) ->
  io:format '~p~n', [H],
  loop_through(T);

loop_through([]) ->
  ok.
{% endhighlight %}

**Elixir**

{% highlight ruby %}
def loop_through([h|t]) do
  IO.inspect h
  loop_through t
end

def loop_through([]) do
  :ok
end
{% endhighlight %}

When defining a function with the same name multiple times, each such definition is called a **clause**. In Erlang, clauses always go side by side, separated by a semi-colon ``;``, the last clause is terminated by a dot ``.``.

Elixir doesn't require punctuation to separate clause, each one looks like a standalone definition in Elixir.

### Function Overloading

Functions in Erlang and Elixir can be overloaded based on arity and guard expressions.

**Erlang**

{% highlight erlang %}
sum() -> 0;
sum(A) -> A;
sum(A, B) -> A + B;
sum(A, B, C) -> A + B + C.
{% endhighlight %}

**Elixir**

{% highlight ruby %}
def sum, do: 0
def sum(a), do: a
def sum(a, b), do: a + b
def sum(a, b, c), do: a + b + c
{% endhighlight %}

Guard expressions provide a concise way to define functions that accept a limited set of values based on some condition.

**Erlang**

{% highlight erlang %}
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
{% endhighlight %}

**Elixir**

{% highlight ruby %}
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
{% endhighlight %}

In addition, Elixir provides default values for arguments whereas Erlang does not.

{% highlight text %}
def mul_by(x, n // 2) do
  x * n
end

mul_by 4, 3 #=> 12
mul_by 4    #=> 8
{% endhighlight %}

### Anonymous Functions

Anonymous functions are defined in the following way:

**Erlang**

{% highlight erlang %}
Sum = fun(A, B) -> A + B end.
Sum(4, 3).
%=> 7

Square = fun(X) -> X * X end.
lists:map(Square, [1, 2, 3, 4]).
%=> [1, 4, 9, 16]
{% endhighlight %}

**Elixir**

{% highlight ruby %}
sum = fn(a, b) -> a + b end
sum 4, 3
#=> 7

square = fn(x) -> x * x end
Enum.map [1, 2, 3, 4], square
#=> [1, 4, 9, 16]
{% endhighlight %}

Is is possible to use pattern matching when defining anonymous functions too.

**Erlang**

{% highlight erlang %}
F = fun(Tuple = {a, b}) ->
        io:format("All your ~p are belong to us~n", [Tuple]);
        ([]) ->
        "Empty"
    end.

F([]).
%=> "Empty"

F({a, b}).
%=> "All your {a,b} are belong to us"
{% endhighlight %}

**Elixir**

{% highlight ruby %}
f = fn do
      {:a, :b} = tuple ->
        IO.puts "All your #{inspect tuple} are belong to us"
      [] ->
        "Empty"
    end

f.([])
#=> "Empty"

f.({:a, :b})
#=> "All your {:a,:b} are belong to us"
{% endhighlight %}

### First-Class Functions

Anonymous functions are first-class values, so they can be passed as arguments to other functions and also can serve as a return value. There is a special syntax to allow named functions be treated in the same manner.

**Erlang**

{% highlight erlang %}
square(X) -> X * X.

lists:map(fun square/1, [1, 2, 3]).
%=> [1, 4, 9]
{% endhighlight %}

**Elixir**

{% highlight ruby %}
def square(x) do
  x * x
end

Enum.map [1,2,3], fn(:square, 1)
{% endhighlight %}

### Partials in Elixir

Elixir supports partial application of functions which can be used to define anonymous functions in a concise way:

{% highlight ruby %}
Enum.map [1, 2, 3, 4], &1 * 2
#=> [2, 4, 6, 8]

List.foldl [1, 2, 3, 4], 0, &1 + &2
#=> 10
{% endhighlight %}

Partials also allow us to pass named functions as arguments.

{% highlight ruby %}
def square(x) do
  x * x
end

Enum.map [1, 2, 3], square &1
#=> [1, 4, 9]
{% endhighlight %}

## Control Flow

The constructs `if` and `case` are actually expressions in both Erlang and Elixir, but may be used for control flow like in imperative languages.

### If

**Erlang**

{% highlight erlang %}
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
{% endhighlight %}

**Elixir**

{% highlight ruby %}
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
{% endhighlight %}

Elixir also provides a `if` function that resembles more imperative languages and is useful when you need to check if one clause is true or false:

{% highlight ruby %}
if x > 10 do
  :greater_than_ten
else
  :not_greater_than_ten
end
{% endhighlight %}

### Case

The ``case`` construct provides control flow based purely on pattern matching.

**Erlang**

{% highlight erlang %}
case { X, Y } of
{ a, b } -> ok;
{ b, c } -> good;
Else -> Else
end
{% endhighlight %}

**Elixir**

{% highlight ruby %}
case { x, y } do
  { :a, :b } -> :ok
  { :b, :c } -> :good
  other -> other
end
{% endhighlight %}

### Loop

Elixir provides a convenient construct for loops which Erlang does not have. In
general, it is better to use one of the functions provided by the ``Enum`` module
or a list comprehension.

{% highlight ruby %}
loop [1, 2, 3, 4, 5], [] do
  [h|t], acc ->
    recur t, [h*h|acc]
  [], acc ->
    List.reverse acc
end
#=> [1, 4, 9, 16, 25]

Enum.map [1, 2, 3, 4, 5], &1 * &1
#=> [1, 4, 9, 16, 25]

lc x in [1, 2, 3, 4, 5], do: x * x
#=> [1, 4, 9, 16, 25]
{% endhighlight %}

### Sending and Receiving Messages

The syntax for sending and receiving differs only slightly between Erlang and Elixir.

**Erlang**

{% highlight erlang %}
Pid = self().

Pid ! { hello }.

receive
  { hello } -> ok;
  Other -> Other
after
  10 -> timeout
end.
{% endhighlight %}

**Elixir**

{% highlight ruby %}
pid = Process.self

pid <- { :hello }

receive do
  { :hello } -> :ok
  other -> other
after
  10 -> :timeout
end
{% endhighlight %}

## A Few Notes On Interoperability

Elixir compiles directly into BEAM byte code. This means that Elixir code can be called from Erlang and vice versa, without the need to write any bindings. What follows is a number of observations with regard to the syntax in both cases.

**Erlang**

{% highlight erlang %}
% Suppose we have compiled the module written in Elixir below.

% Elixir modules live in the __MAIN__ namespace. We can save typing
% by assigning the module name to a variable or defining a macro.
-module(erlang_contrived).
-export([prettify/1]).
-define(ExContrived, __MAIN__.Contrived).

pretiffy(Bin) ->
  ?ExContrived:pretty_binary(Bin).

uglify(Bin) ->
  Contrived = '__MAIN__.Contrived',
  Contrived:ugly_binary(Bin).
{% endhighlight %}

**Elixir**

{% highlight ruby %}
defmodule Contrived do
  def pretty_binary(bin) do
    "Pretty " <> bin
  end

  def ugly_binary(bin) do
    "Ugly " <> bin
  end
end
{% endhighlight %}

An example of calling Erlang code from Elixir is shown in the Notable Differences section above.

## Further Reading

Erlang's official documentation site has a nice [collection][4] of programming examples. It can be a good exercise to translate them into Elixir. [Erlang cookbook][5] offers even more useful code examples.

Elixir also provides a [Getting Started Guide][6] and has [documentation available online][7].

[4]: http://www.erlang.org/doc/programming_examples/users_guide.html
[5]: http://schemecookbook.org/Erlang/TOC
[6]: http://elixir-lang.org/getting_started/1.html
[7]: http://elixir-lang.org/docs
