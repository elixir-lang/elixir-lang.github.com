---
layout: post
title: StreamData: Property-based testing comes to Elixir
author: Andrea Leopardi
category: Releases
excerpt: StreamData is a data-generation and property-based testing library that will be included in Elixir v1.6
---

We are happy to officially announce that Elixir v1.6 will come equipped with two new features: sample data generation as well as tools for property-based testing. We will mostly talk about property-based testing in this post, as sample data generation is a feature we introduced so that it could be leveraged by property-based testing. These functionalities are available today to developers (albeit in beta form) through the [stream_data][] library.

In this blog post, we'll cover what is property-based testing and how it can benefit your programs, why we want it in Elixir, and what we are exploring for the future of it. If you want to use the features discussed below or you want to read more formal documentation, head over to [stream_data][].

## Sample data generation

The core of the [stream_data][] library is `StreamData`: this module (which will be renamed to `Stream.Data` once the library is merged into Elixir) provides all the functionalities related to generating sample data of many kinds. It includes both data generators for data types (like integers or booleans) as well as tools to combine other generators (such as `one_of(list_of_generators)`).

Developers are not supposed to create generators from scratch, but use the provided generators and the provided ways to combine them. An example of a generator is the one returned by `StreamData.integer()`: this function returns a generator that generates integers. Generators implement the `Enumerable` protocol and they are infinite streams of terms. This means we can do operations such as taking terms out of a generator through functions from `Enum` and `Stream`:

```elixir
Enum.take(StreamData.integer(), 5)
#=> [1, -1, 3, 4, 3]
```

`StreamData` contains some functions to modify generators. For example, you can build a generator of positive integers on top of `StreamData.integer()` and `StreamData.map/2`:

```elixir
generator = StreamData.map(StreamData.integer(), &abs/1)
Enum.take(generator, 5)
#=> [0, 1, 3, 3, 2]
```

`StreamData.map/2` is encouraged over `Stream.map/2` because generators only return "simple" terms when enumerated. When used in property-based testing, `StreamData` generators return wrapped values that contain the simple terms but also contain ways to *shrink* those terms, which is something property-based testing uses as we'll see later on.

We decided to separate data-generation from property-based testing because it's something that developers can take advantage of in situations outside of property-based testing. For example, data streams can be used to seed a database or to have randomly generated data available during regular tests.

## Property-based testing

We often write tests like this:

```elixir
test "length/1 calculates the length of a list" do
  assert length([]) == 0
  assert length([:one]) == 1
  assert length([1, 2, 3]) == 3
end
```

This test is written using an *example-based approach*. We are writing both the input to the piece of software we are testing as well as the expected output, and the testing tool is verifying that running the software on the given input results in the expected output. This style of testing is common and useful because it lets you get up and running easily and also lets you test known corner cases in an explicit way. However, this also means that it's hard to test many cases this way and even harder to uncover *unknown* corner cases that may reveal bugs in your code.

Property-based testing is an intuitive way to fix some of the problems mentioned above.

```elixir
property "length/1 is always >= 0" do
  check all list <- list_of(term()) do
    assert length(list) >= 0
  end
end
```

With property-based testing, you specify a set of valid inputs (lists in the example above) for your code and verify that your code holds some property for values taken at random from the valid inputs. In the example above, the test takes many (usually around 100) values at random from the `list_of(term())` *generator* and verifies that the property of `length/1` always returning a non-negative integer holds. A generator is just a `StreamData` generator, as we discussed in the previous section.

### Shrinking

Since we're generating lots of random inputs to test, inputs that cause failures are often complex and convoluted. Take this trivial example of a property:

```elixir
property "list does not contain multiples of 4" do
  check all list <- list_of(positive_integer()) do
    refute Enum.any?(list, &(rem(&1, 4) == 0))
  end
end
```

When running this property, the failure might trigger for a list like this:

```elixir
[19, 12, 6, 11, 2, 20, 10]
```

From this list, it's not easy to see why the test is failing (well, we know why because we wrote a doctored test that's supposed to fail). When running the property though, the failure that will be reported will look like this:

```
1) property list does not contain multiples of 7 (MyPropertyTest)
   my_property_test.exs:6
   Failed with generated values (after 4 attempt(s)):

       list <- list_of(positive_integer())
       #=> [4]

   Expected false or nil, got true
   code: refute Enum.any?(list, &(rem(&1, 4) == 0))
```

This error shows the minimal generated value that triggers the failure, that is, `[4]`. The process of finding the minimal generated value that triggers a failure is called *shrinking*. All generators that come with `StreamData` generate values that "bundle" a way to shrink them so that property-based testing can use this to provide the shrinking functionality. Shrinking is a fundamental part of property-based testing as it takes out the *noise* of random-generated data to reduce the failing data to focused and easier-to-understand terms.

### Using property-based testing in stream_data

As you saw in the previous section, the core of property-based testing in `StreamData` is the `check all` macro. In this macro, you list a bunch of generators and filters (very similarly to how you would in `for` comprehensions) and then pass a body where you can verify that a property holds for the generated data.

To make the `check all` macro available in your test, alongside importing all functions from `StreamData`, you can `use ExUnitProperties`:

```elixir
defmodule MyPropertyTest do
  use ExUnit.Case, async: true
  use ExUnitProperties

  test "sum of positive integer is greater than both integers" do
    check all a <- integer(),
              b <- integer(),
              a > 0 and b > 0,
              sum = a + b do
      assert sum > a
      assert sum > b            
    end
  end
end
```

As you can see, we can filter generated data (`a > 0 and b > 0`) directly in the `check all` macro. We can also do simple assignments (`sum = a + b`). The example above uses the `check all` macro inside a regular `test`. If you want that your properties are reported as "property" at the end of an ExUnit test run, you can use the `property` macro instead:

```elixir
defmodule MyPropertyTest do
  use ExUnit.Case, async: true
  use ExUnitProperties

  property "sum of positive integer is greater than both integers" do
    check all a <- integer(),
              b <- integer(),
              a > 0 and b > 0,
              sum = a + b do
      assert sum > a
      assert sum > b            
    end
  end
end
```

There's not much more to the mechanics of `StreamData`. Most of the work you will have to do revolves around finding good properties to test for your code and writing good generators for the data over which you want to test. Head over to [stream_data][]'s documentation for detailed documentation.

### Advantages of property-based testing

Using property-based testing has some advantages. First of all, it lets you test properties of your code over many more values than you otherwise would with example-based testing. While it's true that random data generation can't cover all the possible values that a piece of code can deal with, the confidence in your codebase can still increase over time because the property-based tests will likely generate different values on each run. Example-based testing means your test data will not change over time.

Property-based testing however can also have a more powerful impact on the way you design software. When you start writing property-based tests, you will start thinking about what guarantees your code provides and what properties it satisfies. If you write properties before writing code, this can easily influence the way you write that code.

### Learning resources

Property-based testing is not something specific to Elixir. While having its roots in Haskell (check out the [original QuickCheck paper] if you're interested), nowadays many languages have stable and usable implementations of it: Clojure has [test.check][], Python has [Hypothesis][], and many more. One of the most famous and complete tools for property-based testing exists for Erlang itself: [QuickCheck][] by Quviq is a complete commercial solution for property-based testing in Erlang of both stateless as well as stateful systems, and Quviq even provides a custom Erlang scheduler to test race conditions in your concurrent programs.

A young but awesome book about property-based testing written by Fred Hebert is also available at [propertesting.com][]. This book is a *proper* (pun intended) guide to property-based testing and uses an Erlang library called [PropEr][]. However, the concepts and techniques perfectly apply to Elixir and `StreamData` as well.

## Why include property-based testing in Elixir (and rewriting from scratch)

The community has expressed some concern regarding two main things: why do we want to include a property-based testing tool in Elixir's standard library? And why write such a tool from scratch instead of using one of the existing Erlang or Elixir solutions?

The answer to the first question is that we believe that providing such a tool in the standard library will encourage developers to use property-based testing and ultimately improve their software and the way they write it. At the same time, we want to be able to use property-based testing to test the Elixir codebase itself (which already turned out great [in the past][quickcheck-pr]). To do this, we can't rely on an external library, so we need to have a solution built into the standard library.

The reasons for writing a new property-based testing library from scratch are best explained by José in [this ElixirForum post][elixirforum-post]:

> * Since we want to bundle it as part of Elixir, the code should be open source with an appropriate license.
> * We wanted to add both data generation and property testing to Elixir. That's why the library is called stream_data instead of something named after property tests. The goal is to reduce the learning curve behind property testing by exposing the data generation aspect as streams, which is a known construct to most Elixir developers. We had this approach in mind for a while and the first library we saw leveraging this in practice was [@pragdave's pollution][pollution].
> * Finally, since the core team are taking the responsibility of maintaining property testing as part of Elixir for potentially the rest of our lives, we want to have full understanding of every single line of code. This is non-negotiable as it guarantees we can continue to consistently improve the code as we move forward.
>
> We understand rolling our own implementation has its downsides, especially since it lacks maturity compared to alternatives, but we balance it by actively seeking input from knowledgeable folks and by listening to the feedback that comes from the community, which we are very thankful for.

[stream_data]: https://github.com/whatyouhide/stream_data
[test.check]: https://github.com/clojure/test.check
[Hypothesis]: https://github.com/HypothesisWorks/hypothesis-python
[QuickCheck]: http://quviq.com
[propertesting.com]: http://propertesting.com
[PropEr]: https://github.com/manopapad/proper
[quickcheck-pr]: https://github.com/elixir-lang/elixir/pull/5022#issuecomment-233195478
[pollution]: https://github.com/pragdave/pollution
[elixirforum-post]: https://elixirforum.com/t/questions-about-property-testing-stream-data/9445/47
