---
layout: post
title: "Strong arrows: a new approach to gradual typing"
author: José Valim
category: Announcements
excerpt: An introduction to strong arrows and how it leverages the Erlang VM to provide sound gradual typing.
---

*This is article expands on the topic of gradual set-theoretic typing discussed during my keynote at [ElixirConf US 2023](https://www.youtube.com/watch?v=giYbq4HmfGA).*

There is an on-going effort [to research and develop a type system for Elixir](https://elixir-lang.org/blog/2023/06/22/type-system-updates-research-dev/), lead by [Giuseppe Castagna](https://www.irif.fr/~gc/), CNRS Senior Researcher, and taken by [Guillaume Duboc](https://www.irif.fr/users/gduboc/index) as part of his PhD studies.

In this article, we will discuss how the proposed type system will tackle gradual typing and how it relates to set-theoretic types, with the goal of providing an introduction to the ideas [presented in our paper](https://arxiv.org/abs/2306.06391).

## Set-theoretic types

The type system we are currently researching and developing for Elixir is based on set-theoretic types, which is to say its operations are based on the fundamental set operations of union, intersection, and negation.

For example, the atom `:ok` is a value in Elixir, that can be represented by the type `:ok`. All atoms in Elixir are represented by themselves in the type system. A function that returns either `:ok` or `:error` is said to return `:ok or :error`, where the `or` operator represents the union.

The types `:ok` and `:error` are contained by the type `atom()`, which is an infinite set representing all atoms. The union of the types `:ok` and `atom()` can be written as `:ok or atom()`, and is equivalent to `atom()` (as `:ok` is a subset of `atom()`). The intersection of the types `:ok` and `atom()` can be written as `:ok and atom()`, and is equivalent to `:ok`.

Similarly, `integer()` is another infinite set representing all integers. `integer() or atom()` is the union of all integers and atoms. The intersection `integer() and atom()` is an empty set, which we call `none()`. The union of all types that exist in Elixir is called `term()`.

The beauty of set-theoretic types is that we can model many interesting properties found in Elixir programs on top of those fundamental set operations, which in turn we hope to make typing in Elixir both more expressive and accessible. Let's see an example of how a type system feature, called bounded quantification (or bounded polymorphism), can be implemented with set-theoretic types.

## Upper and lower bounds

The `identity` function is a function that receives an argument and returns it as is. In Java, it would be written as follows:

```java
static <T> T identity(T arg) {
    return arg;
}
```

In TypeScript:

```typescript
function identity<T>(arg: T): T {
  return arg;
}
```

Or in Haskell:

```haskell
id :: a -> a
id arg = arg
```

In all of the examples above, we say the function receives an argument of type variable `T` (or type variable `a` in Haskell's case) and return a value of the same type `T`. We call this parametric polymorphism, because the function parameter - its argument - can take many (poly) shapes (morphs). In Elixir, we could then support:

```elixir
$ a -> a
def identity(arg), do: arg
```

Sometimes we may want to further constrain those type variables. As example, let's constraint the identity function in Java to numbers:

```java
static <T extends Number> T identity(T arg) {
    return arg;
}
```

Or in TypeScript:

```typescript
function identity<T extends number>(arg: T): T {
    return arg;
}
```

In Haskell, we can constrain to a typeclass, such as `Ord`:

```haskell
id :: Ord a => a -> a
id x = x
```

In other words, these functions can accept any type as long as they fulfill a given constraint. This in turn is called bounded polymorphism, because we are putting bounds on the types we can receive.

With all that said, how can we implement bounded polymorphism in set-theoretic types? Imagine we have a type variable `a`, how can we ensure it is bounded or constrained to another type?

With set-theoretic types, this operation is an intersection. If you have `a and atom()`, `a` can be the type `:foo`. `a` can also be the type `atom()`, which represents all atom types, but `a` cannot be `integer()`, as `integer() and atom()` will return an empty set. In other words, there is no need to introduce a new semantic construct, as intersections can be used to place upper bounds in type variables! Therefore, we could restrict Elixir's identity function to numbers like this:

```elixir
$ a and number() -> a and number()
def identity(arg), do: arg
```

Of course, we can provide syntax sugar for those constraints:

```elixir
$ a -> a when a: number()
def identity(arg), do: arg
```

But at the end of the day it will simply expand to intersections. The important bit is that, at the semantic level, there is no need for additional constructs and representations.

> Note: for the type-curious readers, set-theoretic types implement [a limited form of bounded quantification *à la* Kernel Fun](http://lucacardelli.name/Papers/OnUnderstanding.pdf). In a nutshell, it means we can only compare functions if they have the same bounds. For example, our type system states `a -> a when a: integer() or boolean()` is not a subtype of `a -> a when a: integer()`.

We also get lower bounds for free. If intersections allow us to place an upper bound on a type variable, a union is equivalent to a lower bound as it specifies the type variable will always be augmented by the union-ed type. For example, `a or atom()` says the result will always include atoms plus whatever else specified by `a` (which may be an atom, `atom()` itself, or a completely disjoint type such as `integer()`).

Elixir protocols, which is an Elixir construct equivalent to Haskell Typeclasses or Java interfaces, is another example of functionality that can be modelled and composed with set-theoretic types without additional semantics. The exact mechanism to do so is left as an exercise to the reader (or the topic of a future blog post).

## Enter gradual typing

Elixir is a functional dynamic programming language. Existing Elixir programs are untyped, which means that a type system needs mechanisms to interface existing Elixir code with future statically typed Elixir code. We can achieve this with gradual typing.

A gradual type system is a type system that defines a `dynamic()` type. It is sometimes written as `?` and sometimes known as the `any` type (but I prefer to avoid `any` because it is too short and too lax in languages like TypeScript).

In Elixir, the `dynamic()` type means the type is only known at runtime, effectively disabling static checks for that type. More interestingly, we can also place upper and lower bounds on the dynamic type using set operations. As we will soon learn, this will reveal interesting properties about our type system.

It is often said that gradual typing is the best of both words. Perhaps ironically, that's true and false at the same time. If you use a gradual type system but you never use the `dynamic()` type, then it behaves exactly like a static type system. However, the more you use the `dynamic()` type, the fewer guarantees the type system will give you, the more the `dynamic()` type propagates through the system. Therefore, it is in our interest to reduce the occurrences of the `dynamic()` type as much as possible, and that's what we set out to do.

## Interfacing static and dynamic code: the trouble with `dynamic()`

Let's go back to our constrained identity function that accepts only numbers:

```elixir
$ a -> a when a: number()
def identity(arg), do: arg
```

Now imagine that we have some untyped code that calls this function:

```elixir
def debug(arg) do
  "we got: " <> identity(arg)
end
```

Since `debug/1` is untyped, its argument will receive the type `dynamic()`.

`debug/1` proceeds to call `identity` with an argument and then uses the string concatenation operator (`<>`) to concatenate `"we got: "` to the result of `identity(arg)`. Since `identity/1` is meant to return a number and string concatenation requires two strings as operands, there is a typing error in this program. On the other hand, if you call `debug("hello")` at runtime, the code will work and won't raise any exceptions.

In other words, the static typing version of the program and its runtime execution do not match in behaviour. So how do we tackle this?

One option is to say that's all behaving as expected. If `debug/1` is untyped, its `arg` has the `dynamic()` type. To type check this program, we specify that `identity(dynamic())` returns the `dynamic()` type, the concatenation of a string with `dynamic()` also returns `dynamic()`, and consequently `debug/1` gets the type `dynamic() -> dynamic()`, with no type errors emitted.

The trouble is: this is not a very useful choice. Once `dynamic()` enters the system, it _spreads everywhere_, we perform fewer checks, effectively discarding the information that `identity/1` returns a number, and the overall type system becomes less useful.

Another option would be for us to say: once we call a statically typed function with `dynamic()`, we will ignore the `dynamic()` type. If the function says it returns a `number()`, then it will surely be a number! In this version, `identity(dynamic())` returns `number()` and the type system will catch a type error when concatenating a string with a number.

This is similar to the approach taken by TypeScript. This means we can perform further static checks, but it also means we can call `debug("foobar")` and that will return the string `"we got: foobar"`! But how can that be possible when the type system told us that `identity` returns a `number()`? This can lead to confusion and surprising results at runtime. We say this system is unsound, because the types at runtime do not match our compile-time types.

None of our solutions so far attempted to match the static and runtime behaviors, but rather, they picked one in favor of the other.

But don't despair, there is yet another option. We could introduce runtime checks whenever we cross the "dynamic <-> static" boundaries. In this case, we could say `identity(dynamic())` returns a `number()`, but we will introduce a runtime check into the code to guarantee that's the case. This means we get static checks, we ensure the value is correct at runtime, with the cost of introducing additional checks at runtime. Unfortunately, those checks may affect performance, depending on the complexity of the data structure and on how many times we cross the "dynamic <-> static" boundary.

> Note: there is [recent research in using the runtime checks introduced by a gradual type system to provide compiler optimizations](https://arxiv.org/abs/2206.13831). Some of these techniques are already leveraged by the Erlang VM to optimize code based on patterns and guards.

To summarize, we have three options:

  * Calling static code from dynamic code returns `dynamic()`, dropping the opportunity of further static typing checks (this is sound)

  * Calling static code from dynamic code returns the static types, potentially leading to mismatched types at runtime (this is unsound)

  * Calling static code from dynamic code returns the static types with additional runtime checks, unifying both behaviours but potentially impacting performance (this is sound)

## Introducing strong arrows

I have always said that Elixir, thanks to Erlang, is an assertive language. For example, if our identity function is restricted to only numbers, in practice we would most likely write it as:

```elixir
$ a -> a when a: number()
def identity(arg) when is_number(arg), do: arg
```

In the example above, `identity` will fail if given any value that is not a number. We often rely on pattern matching and guards and, in turn, they helps us assert on the types we are working with. Not only that, Erlang's JIT compiler already relies on this information to [perform optimizations](https://www.erlang.org/blog/type-based-optimizations-in-the-jit/) whenever possible.

We also say Elixir is strongly typed because its functions and operators avoid implicit type conversions. The following functions also fail when their input does not match their type:

```elixir
$ binary() -> binary()
def debug(string), do: "we got: " <> string

$ (integer() -> integer()) and (float() -> float())
def increment(number), do: number + 1
```

`<>` only accepts binaries as arguments and will raise otherwise. `+` only accepts numbers (integers or floats) and will raise otherwise. `+` does not perform implicit conversions of non-numeric types, such as strings to number, as we can see next:

```elixir
iex(1)> increment(1)
2
iex(2)> increment(13.0)
14.0
iex(3)> increment("foobar")
** (ArithmeticError) bad argument in arithmetic expression: "foobar" + 1
```

In other words, Elixir's runtime consistently checks the values and their types at runtime. If `increment` fails when given something else than a number, then it will fail when the `dynamic()` type does not match its input at runtime. This guarantees `increment` returns its declared type and therefore we do not need to introduce runtime type checks when calling said function from untyped code.

When we look at the `identity`, `debug`, and `increment` functions above, we - as developers - can state that these functions raise when given a value that does not match their input. However, how can we generalize this property so it is computed by the type system itself? To do so, we introduce a new concept called **strong arrows**, which relies on set-theoretical types to derive this property.

The idea goes as follows: a strong arrow is a function that can be statically proven that, when evaluated on values outside of its input types (i.e. its domain), it will error. For example, in our `increment` function, if we pass a `string()` as argument, it won't type check, because `string() + integer()` is not a valid operation. Thanks to set-theoretic types, we can compute all values outside of the domain by computing the negation of a set. Given `increment/1` will fail for all types which are `not number()`, the function is strong.

By applying this rule to all typed functions, we will know which functions are strong and which ones are not. If a function is strong, the type system knows that calling it with a `dynamic()` type will always evaluate to its return type! Therefore we say the return type of `increment(dynamic())` is `number()`, which is sound and does not need further runtime checks!

Going back to our `debug` function, when used with a guarded identity, it will be able to emit warnings at compile-time, errors at runtime, without introducing any additional runtime check:

```elixir
$ a -> a when a: number()
def identity(arg) when is_number(arg), do: arg

def debug(arg) do
  "we got: " <> identity(arg)
end
```

However, if the `identity` function is not strong, then we must fallback to one of the strategies in the previous section.

Another powerful property of strong arrows is that they are composable. Let's pick an example from the paper:

```elixir
$ number(), number() -> number()
def subtract(a, b) do
  a + negate(b)
end

$ number() -> number()
def negate(int), do: -int
```

In the example above, `negate/1`'s type is a strong arrow, as it raises for any input outside of its domain. `subtract/2`'s type is also a strong arrow, because both `+` and our own `negate` are strong arrows too. This is an important capability as it limits how `dynamic()` types spread throughout the system.

> Errata: my presentation used the type `integer()` instead of `number()` for the example above. However, that was a mistake in the slide. Giving the type `integer(), integer() -> integer()` to `subtract` and `integer() -> integer()` to `negate` does not make `subtract` a strong arrow. Can you tell why?

Luckily, other gradually typed languages can also leverage strong arrows. However, the more polymorphic a language and its functions are, the more unlikely it is to conclude that a given function is strong. For example, in other gradually typed languages such as Python or Ruby, the `+` operator is extensible and the user can define custom types where the operation is valid. In TypeScript, `"foobar" + 1` is also a valid operation, which expands the function domain. In both cases, an `increment` function restricted to numbers would not have a strong arrow type, as the operator won't fail for all types outside of `number()`. Therefore, to remain sound, they must either restrict the operands with further runtime checks or return `dynamic()` (reducing the number of compile-time checks).

There is one last scenario to consider, which I did not include during my keynote for brevity. Take this function:

```elixir
$ integer() -> :ok
def receives_integer_and_returns_ok(_arg), do: :ok
```

The function above can receive any type and return `:ok`. Is its type a strong arrow? Well, according to our definition, it is not. If we negate its input, type checking does not fail, it returns `:ok`.

However, given the return type is always the same, it should be a strong arrow! To do so, let's amend and rephrase our definition of strong arrows: we negate the domain (i.e. the inputs) of a function and then type check it. If the function returns `none()` (i.e. it does not type check) or a type which is a subset of its codomain (i.e. its output), then it is a strong arrow.

## Gradual typing and false positives

There is one last scenario we must take into consideration when interfacing dynamic and static code. Imagine the following code:

```elixir
def increment_and_remainder(numerator, denominator) do
  rem(numerator, increment(denominator))
end

$ (integer() -> integer()) and (float() -> float())
def increment(number), do: number + 1
```

The `increment_and_remainder/2` function is untyped, therefore both of its arguments receive type `dynamic()`. The function then computes the remainder of the numerator by the denominator incremented by one. For this example, let's assume all uses of `increment_and_remainder/2` in our program passes two integers as arguments.

Given `increment/1` has a strong arrow type, according to our definition, `increment(dynamic())` will return `integer() or float()` (also known as `number()`). Here lies the issue: if `increment(dynamic())` returns `integer() or float()`, the program above won't type check because `rem/2` does not accept floats.

When faced with this problem, there are two possible reactions:

1. It is correct for the function to not type check given `increment` may return a float

2. It is incorrect for the function to not type check because the error it describes never occurs in the codebase

Another interesting property of gradual set-theoretic types is that we can also place upper bounds on the `dynamic()` type. If a function returns `number()`, it means the caller needs to handle both `integer()` and `float()`. However, if a function returns `dynamic() and number()`, it means the type is defined at runtime, but it must still verify it is one of `integer()` or `float()` at compile time.

Therefore, `rem/2` will type check if its second argument has the type `dynamic() and number()`, as there is one type at runtime (`integer()`) that satisfies type checking. On the other hand, if you attempt to use the string concatenation operator (`<>`) on `dynamic() and number()`, then there is no acceptable runtime type and you'd still get a typing violation!

Going back to strong arrows, there are two possible return types from a strong arrow:

1. A strong arrow, when presented with a dynamic type, returns its codomain

2. A strong arrow, when presented with a dynamic type, returns the intersection of the codomain with the `dynamic()` type

The second option opens up the possibility for existing codebases to gradually migrate to static types without dealing with false positives. Coming from a dynamic background, false positives can be seen as noisy or as an indication that static types are not worth the trouble. With strong arrows and gradual set-theoretic types, we will be able to explore different trade-offs on mixed codebases. Which of the two choices above we will adopt as a default and how to customize them is yet to be decided. It will depend on the community feedback as we experiment and integrate the type system.

Erlang and Elixir developers who use Dialyzer will be familiar with these trade-offs, as the second option mirrors Dialyzer's behaviour of no false positives. The difference here is that our semantics are integrated into a complete type system. If no type signature is present, the `dynamic()` type is used, and we will leverage the techniques described here to interface dynamic and static code. If a function has a type signature, and no `dynamic()` type is present, then it will behave as statically typed code when called with statically typed arguments. Migrating to static types will naturally reduce the interaction points between dynamic and static code, removing the reliance on the `dynamic()` type.

## Summary

Set-theoretic types allow us to express many typing features based on set operations of union, intersection, and negation.

In particular, we have been exploring a gradual set-theoretic type system for Elixir, paying special attention to how the type system will integrate with existing codebases and how it can best leverage the semantics of the Erlang Virtual Machine. The type system will also perform limited inference based on patterns and guards (as described in the paper), which - in addition to strong arrows - we hope to bring some of the benefits of static typing to codebases without changing a single line of code.

While our efforts have officially moved from research into development, and [we have outlined an implementation plan](https://elixir-lang.org/blog/2023/06/22/type-system-updates-research-dev/), we haven't yet fully implemented nor assessed the usability of set-theoretic types in existing Elixir codebases, either large or small. There is much to implement and validate, and we don't rule the possibility of finding unforeseen deal breakers that could send us back to square one. Yet we are pleased and cautiously excited with the new developments so far.

The development of Elixir's type system is sponsored by [Fresha](https://www.fresha.com) ([they are hiring!](https://www.fresha.com/careers/openings?department=engineering)),
[Starfish*](https://starfish.team) ([they are hiring!](https://starfish.team/jobs/experienced-elixir-developer)),
and [Dashbit](https://dashbit.co).
