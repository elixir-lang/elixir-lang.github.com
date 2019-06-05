---
layout: getting-started
title: Structs
redirect_from: /getting-started/struct.html
---

# {{ page.title }}

{% include toc.html %}

In [chapter 7](/getting-started/keywords-and-maps.html) we learned about maps:

```iex
iex> map = %{a: 1, b: 2}
%{a: 1, b: 2}
iex> map[:a]
1
iex> %{map | a: 3}
%{a: 3, b: 2}
```

Structs are extensions built on top of maps that provide compile-time checks and default values.

## Defining structs

To define a struct, the `defstruct` construct is used:

```iex
iex> defmodule User do
...>   defstruct name: "John", age: 27
...> end
```

The keyword list used with `defstruct` defines what fields the struct will have along with their default values.

Structs take the name of the module they're defined in. In the example above, we defined a struct named `User`.

We can now create `User` structs by using a syntax similar to the one used to create maps (if you have defined the struct in a separate file, you can compile the file inside IEx before proceeding by running `c "file.exs"`; be aware you may get an error saying `the struct was not yet defined` if you try the below example in a file directly due to when definitions are resolved):

```iex
iex> %User{}
%User{age: 27, name: "John"}
iex> %User{name: "Jane"}
%User{age: 27, name: "Jane"}
```

Structs provide *compile-time* guarantees that only the fields (and *all* of them) defined through `defstruct` will be allowed to exist in a struct:

```iex
iex> %User{oops: :field}
** (KeyError) key :oops not found in: %User{age: 27, name: "John"}
```

## Accessing and updating structs

When we discussed maps, we showed how we can access and update the fields of a map. The same techniques (and the same syntax) apply to structs as well:

```iex
iex> john = %User{}
%User{age: 27, name: "John"}
iex> john.name
"John"
iex> jane = %{john | name: "Jane"}
%User{age: 27, name: "Jane"}
iex> %{jane | oops: :field}
** (KeyError) key :oops not found in: %User{age: 27, name: "Jane"}
```

When using the update syntax (`|`), the <abbr title="Virtual Machine">VM</abbr> is aware that no new keys will be added to the struct, allowing the maps underneath to share their structure in memory. In the example above, both `john` and `jane` share the same key structure in memory.

Structs can also be used in pattern matching, both for matching on the value of specific keys as well as for ensuring that the matching value is a struct of the same type as the matched value.

```iex
iex> %User{name: name} = john
%User{age: 27, name: "John"}
iex> name
"John"
iex> %User{} = %{}
** (MatchError) no match of right hand side value: %{}
```

## Structs are bare maps underneath

In the example above, pattern matching works because underneath structs are bare maps with a fixed set of fields. As maps, structs store a "special" field named `__struct__` that holds the name of the struct:

```iex
iex> is_map(john)
true
iex> john.__struct__
User
```

Notice that we referred to structs as **bare** maps because none of the protocols implemented for maps are available for structs. For example, you can neither enumerate nor access a struct:

```iex
iex> john = %User{}
%User{age: 27, name: "John"}
iex> john[:name]
** (UndefinedFunctionError) function User.fetch/2 is undefined (User does not implement the Access behaviour)
             User.fetch(%User{age: 27, name: "John"}, :name)
iex> Enum.each john, fn({field, value}) -> IO.puts(value) end
** (Protocol.UndefinedError) protocol Enumerable not implemented for %User{age: 27, name: "John"}
```

However, since structs are just maps, they work with the functions from the `Map` module:

```iex
iex> jane = Map.put(%User{}, :name, "Jane")
%User{age: 27, name: "Jane"}
iex> Map.merge(jane, %User{name: "John"})
%User{age: 27, name: "John"}
iex> Map.keys(jane)
[:__struct__, :age, :name]
```

Structs alongside protocols provide one of the most important features for Elixir developers: data polymorphism. That's what we will explore in the next chapter.

## Default values and required keys

If you don't specify a default key value when defining a struct, `nil` will be assumed:

```iex
iex> defmodule Product do
...>   defstruct [:name]
...> end
iex> %Product{}
%Product{name: nil}
```

You can define a structure combining both fields with explicit default values, and implicit `nil` values. In this case you must first specify the fields which implicitly default to nil:

```iex
iex> defmodule User do
...>   defstruct [:email, name: "John", age: 27]
...> end
iex> %User{}
%User{age: 27, email: nil, name: "John"}
```

Doing it in reverse order will raise a syntax error:

```
iex> defmodule User do                          
...>   defstruct [name: "John", age: 27, :email]
...> end
** (SyntaxError) iex:107: syntax error before: email
```

You can also enforce that certain keys have to be specified when creating the struct:

```iex
iex> defmodule Car do
...>   @enforce_keys [:make]
...>   defstruct [:model, :make]
...> end
iex> %Car{}
** (ArgumentError) the following keys must also be given when building struct Car: [:make]
    expanding struct: Car.__struct__/1
```
