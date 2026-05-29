---
title: Elixir Documentation
section: docs
layout: default
image: /images/social/elixir-og-card.jpg
---

# Documentation

The Elixir programming language is broken into 6 applications. The links below
reference the documentation for the modules and functions in each of those
applications. See also [our Getting Started guide](https://elixir.hexdocs.pm/introduction.html)
and [the Learning page](/learning.html) for books, courses, videos, and more.

{% assign stable = site.data.elixir-versions[site.data.elixir-versions.stable] %}

{% for version in site.data.elixir-versions %}
  {% if version[0] == 'stable' %}
    {% continue %}
  {% endif %}

<h3 id="{{ version[1].name }}">
  {{ version[1].name }}
  {% if version[1].version == stable.version %}<small>(stable)</small>{% endif %}
  <small>(<a href="https://github.com/elixir-lang/elixir/releases/download/v{{ version[1].version }}/Docs.zip">download</a>)</small>
</h3>

{% if version[1].otp_versions %}
Supported Erlang/OTP versions: {% for otp in version[1].otp_versions reversed %}{{ otp }}{% if forloop.last %}{% else %}, {% endif %}{% endfor %}.
{% endif %}

* [Elixir](https://elixir.hexdocs.pm/{{ version[1].version }}/) - standard library
* [EEx](https://eex.hexdocs.pm/{{ version[1].version }}/) - templating library
* [ExUnit](https://ex-unit.hexdocs.pm/{{ version[1].version }}/) - unit test library
* [IEx](https://iex.hexdocs.pm/{{ version[1].version }}/) - interactive shell
* [Logger](https://logger.hexdocs.pm/{{ version[1].version }}/) - built-in Logger
* [Mix](https://mix.hexdocs.pm/{{ version[1].version }}/) - build tool

<div style="margin-top: 40px"></div>
{% endfor %}

#### Development

* [Elixir](https://elixir.hexdocs.pm/main/) - standard library
* [EEx](https://eex.hexdocs.pm/main/) - templating library
* [ExUnit](https://ex-unit.hexdocs.pm/main/) - unit test library
* [IEx](https://iex.hexdocs.pm/main/) - interactive shell
* [Logger](https://logger.hexdocs.pm/main/) - built-in Logger
* [Mix](https://mix.hexdocs.pm/main/) - build tool
