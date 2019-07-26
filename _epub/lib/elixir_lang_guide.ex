defmodule ElixirLangGuide do
  @moduledoc """
  Generate EPUB documents for Elixir guides.
  """

  @type config :: %{
          guide: String.t(),
          homepage: String.t(),
          output: Path.t(),
          root_dir: Path.t(),
          scripts: [Path.t()],
          styles: [Path.t()],
          images: [Path.t()]
        }

  @doc "Generate all guides"
  @spec run(Path.t()) :: :ok
  def run(source) do
    config = %{
      guide: nil,
      homepage: "http://elixir-lang.org",
      output: ".",
      root_dir: source,
      scripts: [],
      styles: assets("priv/app-*.css"),
      images: []
    }

    for guide <- ~w(getting_started meta mix_otp) do
      config |> Map.put(:guide, guide) |> to_epub() |> log()
    end

    :ok
  end

  defp assets(path) do
    :elixir_lang_guide
    |> Application.app_dir(path)
    |> Path.wildcard()
  end

  defp log(file) do
    Mix.shell().info([:green, "Generated guide at #{inspect(file)}"])
  end

  @spec to_epub(config) :: String.t()
  defp to_epub(options) do
    nav =
      options.root_dir
      |> Path.expand()
      |> Path.join("_data/getting-started.yml")
      |> YamlElixir.read_from_file()
      |> generate_nav(options)

    elixir_versions =
      options.root_dir
      |> Path.expand()
      |> Path.join("_data/elixir-versions.yml")
      |> YamlElixir.read_from_file()

    options = Map.put(options, :elixir_versions, elixir_versions)

    nav
    |> convert_markdown_pages(options)
    |> to_epub(nav, options)
  end

  defp generate_nav(yaml, options) do
    yaml =
      case options.guide do
        "getting_started" -> Enum.at(yaml, 0)
        "mix_otp" -> Enum.at(yaml, 1)
        "meta" -> Enum.at(yaml, 2)
        _ -> raise "invalid guide, allowed: `mix_otp`, `meta` or `getting_started`"
      end

    for section <- List.wrap(yaml),
        %{"slug" => slug, "title" => title} <- section["pages"] do
      %{
        id: slug,
        label: title,
        content: slug <> ".xhtml",
        dir: section["dir"],
        scripts: List.wrap(options.scripts),
        styles: List.wrap(options.styles)
      }
    end
  end

  defp convert_markdown_pages(config, options) do
    config
    |> Enum.map(&Task.async(fn -> to_xhtml(&1, options) end))
    |> Enum.map(&Task.await(&1, :infinity))
  end

  defp to_xhtml(%{content: path, dir: dir} = nav, options) do
    content =
      options.root_dir
      |> Path.expand()
      |> Path.join("#{dir}#{path}")
      |> String.replace(".xhtml", ".markdown")
      |> File.read!()
      |> clean_markdown(options)
      |> Earmark.to_html()
      |> apply_makeup()
      |> to_page(nav)

    unless File.exists?(Path.join(options.output, dir)) do
      File.mkdir_p(Path.join(options.output, dir))
    end

    file_path = "#{options.output}#{dir}#{path}"
    File.write!(file_path, content)
    file_path
  end

  defp to_epub(files, nav, options) do
    title =
      case options.guide do
        "getting_started" -> "Elixir Getting Started Guide"
        "meta" -> "Meta-programming in Elixir"
        "mix_otp" -> "Mix and OTP"
        _ -> raise "invalid guide, allowed: `mix_otp`, `meta` or `getting_started`"
      end

    images =
      case options.guide do
        "getting_started" ->
          [
            Path.join(options.root_dir, "images/contents/kv-observer.png"),
            Path.join(options.root_dir, "images/contents/debugger-elixir.png")
          ]

        "mix_otp" ->
          [
            Path.join(options.root_dir, "images/contents/kv-observer.png")
          ]

        "meta" ->
          []
      end

    config = %BUPE.Config{
      title: title,
      creator: "elixir-lang.org",
      unique_identifier: title_to_filename(title),
      source: "#{options.homepage}/getting-started/",
      pages: files,
      scripts: options.scripts,
      styles: options.styles,
      images: images,
      nav: nav
    }

    output_file = "#{options.output}/#{title_to_filename(title)}.epub"
    BUPE.build(config, output_file)
    delete_generated_files(files)
    Path.relative_to_cwd(output_file)
  end

  defp delete_generated_files(files) do
    Enum.map(files, &File.rm!(&1))
  end

  defp title_to_filename(title) do
    title |> String.replace(" ", "-") |> String.downcase()
  end

  defp clean_markdown(content, options) do
    content
    |> remove_includes()
    |> remove_variables(options)
    |> remove_span_hidden_hack()
    |> remove_raw_endraw_tags()
    |> remove_frontmatter()
    |> fix_backslashes()
    |> fix_images()
    |> fix_js()
    |> map_links(options)
  end

  defp remove_includes(content) do
    content
    |> String.replace("{% include toc.html %}", "")
    |> String.replace("{% include mix-otp-preface.html %}", "")
  end

  defp remove_variables(content, options) do
    %{"stable" => current_stable_version} = elixir_versions = Map.get(options, :elixir_versions)
    stable = elixir_versions[current_stable_version]

    content
    |> String.replace(
      "{% assign stable = site.data.elixir-versions[site.data.elixir-versions.stable] %}",
      ""
    )
    |> String.replace("{{ stable.version }}", "#{stable["version"]}")
    |> String.replace("{{ stable.minimum_otp }}", "#{stable["minimum_otp"]}")
  end

  # The <span hidden>.</span> is a hack used in pattern-matching.md
  defp remove_span_hidden_hack(content) do
    String.replace(content, ~r/# {{ page.title }}(<span hidden>.<\/span>)?/, "")
  end

  defp remove_raw_endraw_tags(content) do
    String.replace(content, ~r/{% (end)?raw %}/, "")
  end

  defp remove_frontmatter(content) do
    [_frontmatter, content] = String.split(content, ~r/\r?\n---\r?\n/, parts: 2)
    content
  end

  defp fix_backslashes(content) do
    String.replace(
      content,
      ~r/backslashes \(`\\`\) on Windows/,
      ~S"backslashes (`\\\\`) on Windows"
    )
  end

  defp fix_images(content) do
    content
    |> String.replace(
      ~s{/images/contents/kv-observer.png" width="640},
      "assets/kv-observer.png"
    )
    |> String.replace(
      ~s{/images/contents/debugger-elixir.gif" width="640},
      "assets/debugger-elixir.png"
    )
  end

  defp fix_js(content) do
    content
    |> String.replace(~r{<script[^<]*</script>}, "")
    |> String.replace(["<noscript>", "</noscript>"], "")
  end

  defp map_links(content, options) do
    Regex.replace(~r/\[([^\]]+)\]\(([^\)]+)\)/, content, fn _, text, href ->
      case URI.parse(href) do
        %URI{scheme: nil, path: "/getting-started/meta/" <> path} ->
          map_meta_links(text, path, options)

        %URI{scheme: nil, path: "/getting-started/mix-otp/" <> path} ->
          map_mix_otp_link(text, path, options)

        %URI{scheme: nil, path: "/getting-started/" <> path} ->
          map_getting_started_links(text, path, options)

        %URI{scheme: nil, path: "/" <> path} ->
          "[#{text}](#{options.homepage}/#{path})"

        _ ->
          "[#{text}](#{href})"
      end
    end)
  end

  defp map_meta_links(text, path, %{guide: "meta"}),
    do: map_section_links(text, path)

  defp map_meta_links(text, path, options),
    do: "[#{text}](#{options.homepage}/getting-started/meta/#{path})"

  defp map_mix_otp_link(text, path, %{guide: "mix_otp"}),
    do: map_section_links(text, path)

  defp map_mix_otp_link(text, path, options),
    do: "[#{text}](#{options.homepage}/getting-started/mix-otp/#{path})"

  defp map_getting_started_links(text, path, %{guide: "getting_started"}),
    do: map_section_links(text, path)

  defp map_getting_started_links(text, path, options),
    do: "[#{text}](#{options.homepage}/getting-started/#{path})"

  defp map_section_links(text, path),
    do: "[#{text}](#{String.replace(path, ".html", ".xhtml")})"

  defp apply_makeup(page) do
    Regex.replace(
      ~r/<pre><code class="(elixir|iex)">([^<]*)<\/code><\/pre>/,
      page,
      &highlight_code_block/3
    )
  end

  @makeup_options [lexer: Makeup.Lexers.ElixirLexer, formatter_options: [highlight_tag: "samp"]]

  defp highlight_code_block(_html, _tag, code) do
    highlighted =
      code
      |> unescape_html()
      |> IO.iodata_to_binary()
      |> Makeup.highlight_inner_html(@makeup_options)

    ~s(<pre><code class="makeup elixir">#{highlighted}</code></pre>)
  end

  entities = [{"&amp;", ?&}, {"&lt;", ?<}, {"&gt;", ?>}, {"&quot;", ?"}, {"&#39;", ?'}]

  for {encoded, decoded} <- entities do
    defp unescape_html(unquote(encoded) <> rest) do
      [unquote(decoded) | unescape_html(rest)]
    end
  end

  defp unescape_html(<<c, rest::binary>>) do
    [c | unescape_html(rest)]
  end

  defp unescape_html(<<>>) do
    []
  end

  require EEx
  page = Path.expand("templates/page.eex", __DIR__)
  EEx.function_from_file(:defp, :to_page, page, [:content, :config])
end
