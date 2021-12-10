---
title: Elixir Documentation
section: docs
layout: default
---

# Documentation

The Elixir programming language is broken into 6 applications. The links below
reference the documentation for the modules and functions in each of those
applications. For a general introduction to the language, see our [guides](/getting-started/introduction.html).

{% assign stable = site.data.elixir-versions[site.data.elixir-versions.stable] %}

<h4 id="stable">Stable
  {% if stable.docs_zip == true %}
    <small>(<a href="https://github.com/elixir-lang/elixir/releases/download/v{{ stable.version }}/Docs.zip">download</a>)</small>
  {% endif %}
</h4>

* [Elixir](https://hexdocs.pm/elixir/) - standard library
* [EEx](https://hexdocs.pm/eex/) - templating library
* [ExUnit](https://hexdocs.pm/ex_unit/) - unit test library
* [IEx](https://hexdocs.pm/iex/) - interactive shell
* [Logger](https://hexdocs.pm/logger/) - built-in Logger
* [Mix](https://hexdocs.pm/mix/) - build tool

#### Development

* [Elixir](https://hexdocs.pm/elixir/main/) - standard library
* [EEx](https://hexdocs.pm/eex/main/) - templating library
* [ExUnit](https://hexdocs.pm/ex_unit/main/) - unit test library
* [IEx](https://hexdocs.pm/iex/main/) - interactive shell
* [Logger](https://hexdocs.pm/logger/main/) - built-in Logger
* [Mix](https://hexdocs.pm/mix/main/) - build tool

{% for version in site.data.elixir-versions %}
  {% if version[0] == 'stable' %}
    {% continue %}
  {% endif %}

<h4 id="{{ version[1].name }}">{{ version[1].name }}
  {% if version[1].docs_zip == true %}<small>(<a href="https://github.com/elixir-lang/elixir/releases/download/v{{ version[1].version }}/Docs.zip">download</a>)</small>{% endif %}
</h4>

* [Elixir](https://hexdocs.pm/elixir/{{ version[1].version }}/) - standard library
* [EEx](https://hexdocs.pm/eex/{{ version[1].version }}/) - templating library
* [ExUnit](https://hexdocs.pm/ex_unit/{{ version[1].version }}/) - unit test library
* [IEx](https://hexdocs.pm/iex/{{ version[1].version }}/) - interactive shell
* [Logger](https://hexdocs.pm/logger/{{ version[1].version }}/) - built-in Logger
* [Mix](https://hexdocs.pm/mix/{{ version[1].version }}/) - build tool
{% endfor %}
