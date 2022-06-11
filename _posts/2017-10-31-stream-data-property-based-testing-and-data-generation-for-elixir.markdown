---
layout: post
title: "StreamData: Property-based testing and data generation"
author: Andrea Leopardi
category: Announcements
excerpt: We are working on data generation and property-based testing for the next versions of Elixir.
---

In this blog post, we'll talk about property-based testing and sample data generation. We'll cover what these are, why we want them in Elixir, and what are are plans for the future. If you want to use the features discussed here or you want to read more formal documentation, head over to [stream_data][], which is a library that currently provides both features (albeit in beta form) and which is where we are focusing our efforts.

## Sample data generation

The core of the [stream_data][] library is `StreamData`: this module provides all the functionalities related to generating sample data of many kinds. It includes both data generators for data types (like integers or booleans) as well as tools to combine other generators (such as `one_of(list_of_generators)`).

Developers are not supposed to create generators from scratch, but use the provided generators and the provided combinator functions to compose them. An example of a generator is the one returned by `StreamData.integer()`: this function returns a generator that generates integers. Generators are infinite streams of terms that implement the `Enumerable` protocol. This means we can do operations such as taking terms out of a generator through functions from `Enum` and `Stream`:

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

`StreamData.map/2` is encouraged over `Stream.map/2` because generators return values that can shrink, which is something property-based testing takes advantage of as we'll see later on. When treated as enumerables, generators return normal values that cannot be shrunk.

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

This test is written using an *example-based approach*. We are writing both the input to the piece of software we are testing as well as the expected output, and the testing tool is verifying that running the software on the given input results in the expected output. This style of testing is common and useful because it lets you get up and running easily and also lets you test known corner cases in an explicit way. However, it's hard to test many cases this way and even harder to uncover *unknown* corner cases that may reveal bugs in your code.

Property-based testing is an intuitive way to fix some of the problems mentioned above.

```elixir
property "length/1 is always >= 0" do
  check all list <- list_of(term()) do
    assert length(list) >= 0
  end
end
```

With property-based testing, you specify a set of valid inputs (lists in the example above) for your code and verify that your code holds some property for values taken at random from the valid inputs. In the example above, the test takes many (usually around 100) values at random from the `list_of(term())` *generator* and verifies a property of `length/1`, that is, that `length/1` always returns a non-negative integer. A generator is just a `StreamData` generator, as we discussed in the previous section.

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

The core of property-based testing in stream_data is the `check all` macro. In this macro, you list a bunch of generators and filters (very similarly to how you would in `for` comprehensions) and then pass a body where you can verify that a property holds for the generated data.

To make the `check all` macro available in your test, alongside importing all functions from `StreamData`, you can `use ExUnitProperties`:

```elixir
defmodule MyPropertyTest do
  use ExUnit.Case, async: true
  use ExUnitProperties

  test "the in/2 operator works with lists" do
    check all list <- list_of(term()),
              list != [],
              elem <- member_of(list) do
      assert elem in list
    end
  end
end
```

As you can see, we can filter generated data (`list != []`) directly in the `check all` macro. We can also do simple assignments. The example above uses the `check all` macro inside a regular `test`. If you want that your properties are reported as "property" at the end of an ExUnit test run, you can use the `property` macro instead:

```elixir
defmodule MyPropertyTest do
  use ExUnit.Case, async: true
  use ExUnitProperties

  property "the in/2 operator works with lists" do
    check all list <- list_of(term()),
              list != [],
              elem <- member_of(list) do
      assert elem in list
    end
  end
end
```

By doing this your properties will also be tagged with the `:property` tag, which means you will be able to do things like:

```bash
mix test --only property
```

to run only properties.

There's not much more to the mechanics of stream_data. Most of the work you will have to do revolves around finding good properties to test for your code and writing good generators for the data over which you want to test. Head over to [stream_data][]'s documentation for detailed documentation.

### Advantages of property-based testing

Using property-based testing has some advantages. First of all, it lets you test properties of your code over many more values than you otherwise would with example-based testing. While it's true that random data generation can't cover all the possible values that a piece of code can deal with, the confidence in your codebase can still increase over time because the property-based tests will likely generate different values on each run. Example-based testing means your test data will not change over time.

Property-based testing however can also have a more powerful impact on the way you design software. When you start writing property-based tests, you will start thinking about what guarantees your code provides and what properties it satisfies. If you write properties before writing code, this can easily influence the way you write that code.

### Learning resources

Property-based testing is not something specific to Elixir. While having its roots in Haskell (check out the [original QuickCheck paper][quickcheck-paper] if you're interested), nowadays many languages have stable and usable implementations of it: Clojure has [test.check][], Python has [Hypothesis][], and many more. One of the most famous and complete tools for property-based testing exists for Erlang itself: [QuickCheck][] by Quviq is a complete commercial solution for property-based testing in Erlang of both stateless as well as stateful systems, and Quviq even provides a custom Erlang scheduler to test race conditions in your concurrent programs.

A young but awesome book about property-based testing written by Fred Hebert is also available at [propertesting.com][]. This book is a *proper* (pun intended) guide to property-based testing and uses an Erlang library called [PropEr][]. However, the concepts and techniques perfectly apply to Elixir and stream_data as well.

## Why include property-based testing in Elixir (and rewriting from scratch)

The community has expressed some concern regarding two main things: why do we want to include a property-based testing tool in Elixir's standard library? And why write such a tool from scratch instead of using one of the existing Erlang or Elixir solutions?

The answer to the first question is that we believe providing such a tool in the standard library will encourage developers to use property-based testing and ultimately improve their software and the way they write it. At the same time, we want to be able to use property-based testing to test the Elixir codebase itself (which already turned out great [in the past][quickcheck-pr]).

The reasons for writing a new property-based testing library from scratch are best explained by José in [this ElixirForum post][elixirforum-post]:

> * Since we want to bundle it as part of Elixir, the code should be open source with an appropriate license.
> * We wanted to add both data generation and property testing to Elixir. That's why the library is called stream_data instead of something named after property tests. The goal is to reduce the learning curve behind property testing by exposing the data generation aspect as streams, which is a known construct to most Elixir developers. We had this approach in mind for a while and the first library we saw leveraging this in practice was [@pragdave's pollution][pollution].
> * Finally, since the core team are taking the responsibility of maintaining property testing as part of Elixir for potentially the rest of our lives, we want to have full understanding of every single line of code. This is non-negotiable as it guarantees we can continue to consistently improve the code as we move forward.
>
> We understand rolling our own implementation has its downsides, especially since it lacks maturity compared to alternatives, but we balance it by actively seeking input from knowledgeable folks and by listening to the feedback that comes from the community, which we are very thankful for.

## Roadmap

`stream_data` and the functionalities it includes are scheduled to be included in one of the next two Elixir releases, likely 1.6 but possibly 1.7. We have used the names `StreamData` and `ExUnitProperties` to avoid conflicts when those modules are eventually merged into Elixir. When merged, they will be renamed to the proper `Stream.Data` and `ExUnit.Properties` modules. Right now, all development is happening in the [stream_data][] repository, where we are discussing features and giving users a chance to try out the functionalities early on. We'd love for anyone to get involved in trying stream_data and we'd love feedback!

**Update Jun/2020:** after careful consideration, the Elixir team decided to not include `StreamData` in Elixir itself, and keep it as package, as it is able to provide all of the necessary features without a need for direct integration with the language.

[stream_data]: https://github.com/whatyouhide/stream_data
[quickcheck-paper]: http://www.cs.tufts.edu/~nr/cs257/archive/john-hughes/quick.pdf
[test.check]: https://github.com/clojure/test.check
[Hypothesis]: https://github.com/HypothesisWorks/hypothesis-python
[QuickCheck]: http://quviq.com
[propertesting.com]: http://propertesting.com
[PropEr]: https://github.com/manopapad/proper
[quickcheck-pr]: https://github.com/elixir-lang/elixir/pull/5022#issuecomment-233195478
[pollution]: https://github.com/pragdave/pollution
[elixirforum-post]: https://elixirforum.com/t/questions-about-property-testing-stream-data/9445/47
