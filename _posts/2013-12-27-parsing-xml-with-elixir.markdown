---
layout: post
title: Parsing XML With Elixir
author: Josh Adams
category: examples
excerpt: An example of interoperating with Erlang's built-in `xmerl` library to parse XML.
---

In the latest free video, [ElixirSips](http://www.elixirsips.com) [Episode
028](http://elixirsips.com/episodes/028_parsing_xml.html) provides an example of
parsing XML via the built in `xmerl` library in Erlang.

<iframe src="//fast.wistia.net/embed/iframe/pi407o195d" allowtransparency="true" frameborder="0" scrolling="no" class="wistia_embed" name="wistia_embed" allowfullscreen mozallowfullscreen webkitallowfullscreen oallowfullscreen msallowfullscreen width="640" height="360"></iframe>

[Here is the project built in this episode, for you to download.](http://elixirsips.com/downloads/028_parsing_xml.tar.gz)

You can watch the video for a complete rundown where we use tests to explore the
`xmerl` library and how we can use it from Elixir.  If you just want to see the
results, here's the test file we ended up with, commented for clarity:

```elixir
# If you want to pattern-match on a record defined in an erlang library, you
# need to use Record.extract to turn it into an Elixir record data structure.
# Here, we extract xmlElement and xmlText from xmerl.
defrecord :xmlElement, Record.extract(:xmlElement, from_lib: "xmerl/include/xmerl.hrl")
defrecord :xmlText, Record.extract(:xmlText, from_lib: "xmerl/include/xmerl.hrl")

defmodule XmlParsingTest do
  use ExUnit.Case

  # Here we define some simple XML that we'll work with in our tests.
  def sample_xml do
    """
    <html>
      <head>
        <title>XML Parsing</title>
      </head>
      <body>
        <p>Neato</p>
        <ul>
          <li>First</li>
          <li>Second</li>
        </ul>
      </body>
    </html>
    """
  end

  test "parsing the title out" do
    { xml, _rest } = :xmerl_scan.string(bitstring_to_list(sample_xml))
    [ title_element ] = :xmerl_xpath.string('/html/head/title', xml)
    [ title_text ] = title_element.content
    title = title_text.value

    assert title == 'XML Parsing'
  end

  test "parsing the p tag" do
    { xml, _rest } = :xmerl_scan.string(bitstring_to_list(sample_xml))
    [ p_text ] = :xmerl_xpath.string('/html/body/p/text()', xml)

    assert p_text.value == 'Neato'
  end

  test "parsing the li tags and mapping them" do
    { xml, _rest } = :xmerl_scan.string(bitstring_to_list(sample_xml))
    li_texts = :xmerl_xpath.string('/html/body/ul/li/text()', xml)
    texts = li_texts |> Enum.map(fn(x) -> x.value end)

    assert texts == ['First', 'Second']
  end
end
```

## Resources
- [xmerl user guide](http://www.erlang.org/doc/apps/xmerl/xmerl_ug.html)
- [xmerl manual](http://www.erlang.org/doc/man/xmerl_scan.html)
- [erlsom](https://github.com/willemdj/erlsom)
- [exml](https://github.com/paulgray/exml)
- [Differences between Erlang and Elixir records](http://elixir-lang.org/crash-course.html#notable_differences) - See the 'Records' section.
- [Dave Thomas on parsing XML in Erlang](http://pragdave.pragprog.com/pragdave/2007/04/a_first_erlang_.html)
- [`xmlElement` record](https://github.com/erlang/otp/blob/maint/lib/xmerl/include/xmerl.hrl#L73-L85)
