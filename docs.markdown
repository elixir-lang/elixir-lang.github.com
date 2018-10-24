---
title: Elixir Documentation
section: docs
layout: default
---

# Documentation

Choose which version you want documentation for.

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

#### Master

* [Elixir](https://hexdocs.pm/elixir/master/) - standard library
* [EEx](https://hexdocs.pm/eex/master/) - templating library
* [ExUnit](https://hexdocs.pm/ex_unit/master/) - unit test library
* [IEx](https://hexdocs.pm/iex/master/) - interactive shell
* [Logger](https://hexdocs.pm/logger/master/) - built-in Logger
* [Mix](https://hexdocs.pm/mix/master/) - build tool

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
