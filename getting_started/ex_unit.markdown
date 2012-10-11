---
layout: getting_started
title: ExUnit
---

# ExUnit

ExUnit is a unit test framework that ships with Elixir.

## 1 Getting started

Using ExUnit is quite easy, here is a file with the minimum required:

{% highlight ruby %}
ExUnit.start

defmodule MyTest do
  use ExUnit.Case

  test "the truth" do
    assert true
  end
end
{% endhighlight %}

In general, we just need to invoke `ExUnit.start`, define a test case using `ExUnit.Case` and our batch of tests. Assuming we saved this file as `assertion_test.exs`, we can run it directly:

    bin/elixir assertion_test.exs

In this chapter, we will discuss the most common features available in ExUnit and how to customize it further.

## 2 ExUnit

ExUnit is started using `ExUnit.start`. This function accepts a couple options, so [check its documentation](/docs/stable/ExUnit.html) for more details. For now, we will just detail the most common ones:

* `:formatter` - When you run tests with ExUnit, all the IO is done by [the formatter](https://github.com/elixir-lang/elixir/blob/master/lib/ex_unit/lib/ex_unit/formatter.ex). Developers can define their own formatters and this is the configuration that tells ExUnit to use a custom formatter;

* `:max_cases` - As we are going to see soon, ExUnit allows you to easily run tests in parallel. This is very useful to speed up your tests that have no side affects. This option allows us to configure the maximum number of cases ExUnit runs in parallel.

## 3 ExUnit.Case

After ExUnit is started, we can define our own test cases. This is done by using `ExUnit.Case` in our module:

{% highlight ruby %}
use ExUnit.Case
{% endhighlight %}

`ExUnit.Case` provides some features, so let's take a look at them.

### 3.1 Async

The first feature worth commenting in ExUnit is the ability to run test cases in parallel. All you need to do is pass the `:async` option set to true:

{% highlight ruby %}
use ExUnit.Case, async: true
{% endhighlight %}

This will run this test case in parallel with other test cases which are async too. The tests inside a particular case is still run in parallel.

### 3.2 The test macro

`ExUnit.Case` runs all functions starting with `test`. As a convenience to define such functions, `ExUnit.Case` provides a test macro, so instead of writing:

{% highlight ruby %}
def test_the_truth do
  assert true
end
{% endhighlight %}

A developer can write:

{% highlight ruby %}
test "the truth" do
  assert true
end
{% endhighlight %}

Which is more legible. The test macro accepts either a binary or an atom as name.

### 3.3 Assertions

Another convenience provided by `ExUnit.Case` is to automatically import a set of assertion macros and functions, available in [`ExUnit.Assertions`](/docs/stable/ExUnit.Assertions.html).

In the majority of tests, the only assertion macros you will need to use are `assert` and `refute`:

{% highlight ruby %}
assert 1 + 1 == 2
refute 1 + 3 == 3
{% endhighlight %}

ExUnit automatically breaks those expressions apart and attempt to provide detailed information in case the assertion fails. For example, the failing assertion:

{% highlight ruby %}
assert 1 + 1 == 3
{% endhighlight %}

Will fail as:

    Expected 2 to be equal to (==) 3

However, some extra assertions are convenient to make testing easier for some specific cases, a good example is the `assert_raise` macro:

{% highlight ruby %}
assert_raise ArithmeticError, "bad argument in arithmetic expression", fn ->
  1 + "test"
end
{% endhighlight %}

So don't forget to check [`ExUnit.Assertions`' documentation](/docs/stable/ExUnit.Assertions.html) for more examples.

### 3.4 Callbacks

`ExUnit.Case` defines four callbacks:

* `setup_all()` and `teardown_all(context)` which are executed before and after all tests respectively;
* `setup(context, test)` and `teardown(context, test)` which are executed before and after each test, receiving
the test name as argument;

Such callbacks are useful to clean up any side-effect a test may cause, as for example, state in genservers, data on filesystem, or entries in a database. Data can be passed in between such callbacks as context, the context value returned by `setup_all` is passed down to all other callbacks. The value can then be updated in `setup` which is passed down to `teardown`.

## 4 Lots To Do

ExUnit is still a work in progress. Feel free to visit [our issues tracker](https://github.com/elixir-lang/elixir/issues) to add issues for anything you'd like to see in ExUnit and feel free to contribute.