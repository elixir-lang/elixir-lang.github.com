defmodule ElixirLangGuide do
  @moduledoc """
  The idea behind this application is to offer an efficient way to transform
  the [Elixir Lang guides](http://elixir-lang.org/getting-started/) into an
  EPUB document.

  """

  @vsn Mix.Project.config[:version]
  @app Mix.Project.config[:app]

  defmodule Config do
    @moduledoc """
    Configuration structure with all the available options for `ElixirLangGuide`

    You can find more information about this options in the `ElixirLangGuide.CLI` module.
    """
    @homepage "http://elixir-lang.org"
    @scripts Path.wildcard(Path.join(__DIR__, "../assets/dist/app-*.js"))
    @styles Path.wildcard(Path.join(__DIR__, "../assets/dist/app-*.css"))

    defstruct [
      guide: "getting_started",
      homepage: @homepage,
      output: "doc",
      root_dir: nil,
      scripts: @scripts,
      styles: @styles,
      images: []
    ]

    @type t :: %__MODULE__{
      guide: String.t,
      homepage: String.t,
      output: Path.t,
      root_dir: Path.t,
      scripts: [Path.t],
      styles: [Path.t],
      images: [Path.t]
    }
  end

  @doc false
  def start do
    {:ok, _} = Application.ensure_all_started(@app)
  end

  @doc """
  Convert a given Elixir Lang guide to EPUB format
  """
  @spec to_epub(Keyword.t) :: String.t
  def to_epub(options) do
    config = struct(Config, options)
    ElixirLangGuide.EPUB.run(config)
  end

  @doc """
  Returns the current version of this application
  """
  @spec version :: String.t
  def version, do: @vsn
end
