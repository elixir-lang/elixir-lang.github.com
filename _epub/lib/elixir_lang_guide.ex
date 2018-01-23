defmodule ElixirLangGuide do
  @moduledoc """
  Generate EPUB documents for Elixir guides.
  """

  @type config :: %{
    guide: String.t,
    homepage: String.t,
    output: Path.t,
    root_dir: Path.t,
    scripts: [Path.t],
    styles: [Path.t],
    images: [Path.t]
  }

  @doc "Generate all guides"
  @spec run(Path.t) :: :ok
  def run(source) do
    config = %{
      guide: nil,
      homepage: "http://elixir-lang.org",
      output: ".",
      root_dir: source,
      scripts: assets("priv/app-*.js"),
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
    Mix.shell.info [:green, "Generated guide at #{inspect file}"]
  end

  @spec to_epub(config) :: String.t
  defp to_epub(options) do
    nav =
      options.root_dir
      |> Path.expand()
      |> Path.join("_data/getting-started.yml")
      |> YamlElixir.read_from_file()
      |> generate_nav(options)

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

    Enum.flat_map(List.wrap(yaml), fn(section) ->
      Enum.map(section["pages"], fn(%{"slug" => slug, "title" => title}) ->
        %{id: slug, label: title, content: "#{slug}.xhtml", dir: section["dir"],
          scripts: List.wrap(options.scripts), styles: List.wrap(options.styles)}
      end)
    end)
  end

  defp convert_markdown_pages(config, options) do
    config
    |> Enum.map(&Task.async(fn ->
        to_xhtml(&1, options)
       end))
    |> Enum.map(&Task.await(&1, :infinity))
  end

  defp to_xhtml(%{content: path, dir: dir} = nav, options) do
    content =
      options.root_dir
      |> Path.expand()
      |> Path.join("#{dir}#{path}")
      |> String.replace(~r/(.*)\.xhtml/, "\\1.markdown")
      |> File.read!()
      |> clean_markdown(options)
      |> Earmark.to_html()
      |> wrap_html(nav)

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
      if options.guide == "mix_otp" do
        [options.root_dir |> Path.join("images/contents/kv-observer.png")]
      else
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
    |> remove_span_hidden_hack()
    |> remove_raw_endraw_tags()
    |> remove_frontmatter()
    |> fix_backslashes()
    |> fix_images()
    |> map_links(options)
  end

  defp remove_includes(content) do
    content
    |> String.replace("{% include toc.html %}", "")
    |> String.replace("{% include mix-otp-preface.html %}", "")
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
    String.replace(content, ~r/backslashes \(`\\`\) on Windows/, ~S"backslashes (`\\\\`) on Windows")
  end

  defp fix_images(content) do
    String.replace(content, ~r{/images/contents/kv-observer.png" width="640}, "assets/kv-observer.png")
  end

  defp map_links(content, options) do
    Regex.replace(~r/\[([^\]]+)\]\(([^\)]+)\)/, content, fn(_, text, href) ->
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

  defp map_meta_links(text, path, %{guide: "meta"}), do: map_section_links(text, path)
  defp map_meta_links(text, path, options), do: "[#{text}](#{options.homepage}/getting-started/meta/#{path})"

  defp map_mix_otp_link(text, path, %{guide: "mix_otp"}), do: map_section_links(text, path)
  defp map_mix_otp_link(text, path, options), do: "[#{text}](#{options.homepage}/getting-started/mix-otp/#{path})"

  defp map_getting_started_links(text, path, %{guide: "getting_started"}), do: map_section_links(text, path)
  defp map_getting_started_links(text, path, options), do: "[#{text}](#{options.homepage}/getting-started/#{path})"

  defp map_section_links(text, path), do: "[#{text}](#{String.replace(path, "html", "xhtml")})"

  require EEx
  EEx.function_from_file(:defp, :wrap_html,
                         Path.expand("templates/page.eex", __DIR__),
                         [:content, :config])
end
