---
title: Elixir Documentation
section: docs
layout: default
image: /images/social/elixir-og-card.jpg
---

# Documentation

The Elixir programming language is broken into 6 applications. The links below
reference the documentation for the modules and functions in each of those
applications. See also [our Getting Started guide](https://hexdocs.pm/elixir/introduction.html)
and [the Learning page](/learning.html) for books, courses, videos, and more.

{% assign stable = site.data.elixir-versions[site.data.elixir-versions.stable] %}

{% for version in site.data.elixir-versions %}
  {% if version[0] == 'stable' %}
    {% continue %}
  {% endif %}

<h4 id="{{ version[1].name }}">
  {{ version[1].name }}
  {% if version[1].version == stable.version %}<small>(stable)</small>{% endif %}
  <small>(<a href="https://github.com/elixir-lang/elixir/releases/download/v{{ version[1].version }}/Docs.zip">download</a>)</small>
</h4>

{% if version[1].otp_versions %}
Supported Erlang/OTP versions: {% for otp in version[1].otp_versions reversed %}{{ otp }}{% if forloop.last %}{% else %}, {% endif %}{% endfor %}.
{% endif %}

* [Elixir](https://hexdocs.pm/elixir/{{ version[1].version }}/) - standard library
* [EEx](https://hexdocs.pm/eex/{{ version[1].version }}/) - templating library
* [ExUnit](https://hexdocs.pm/ex_unit/{{ version[1].version }}/) - unit test library
* [IEx](https://hexdocs.pm/iex/{{ version[1].version }}/) - interactive shell
* [Logger](https://hexdocs.pm/logger/{{ version[1].version }}/) - built-in Logger
* [Mix](https://hexdocs.pm/mix/{{ version[1].version }}/) - build tool

<div style="margin-top: 40px"></div>
{% endfor %}

#### Development

* [Elixir](https://hexdocs.pm/elixir/main/) - standard library
* [EEx](https://hexdocs.pm/eex/main/) - templating library
* [ExUnit](https://hexdocs.pm/ex_unit/main/) - unit test library
* [IEx](https://hexdocs.pm/iex/main/) - interactive shell
* [Logger](https://hexdocs.pm/logger/main/) - built-in Logger
* [Mix](https://hexdocs.pm/mix/main/) - build tool
