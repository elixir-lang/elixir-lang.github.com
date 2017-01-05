defmodule Mix.Tasks.Epub do
  use Mix.Task

  @shortdoc "Convert Elixir Guides to EPUB format"

  @moduledoc """
  Convert the Elixir Lang Guides to EPUB format.

  By default the "Getting Started" is converted, but, you can pass parameter to
  choose the "Meta-programming with Elixir" or "Mix and OTP" guides.

  ## Command line options

    * `-g`, `--guide` - Guide that you want to convert, options:
      `getting_started`, `meta` or `mix_otp`, default: `getting_started`
    * `-o`, `--output` - Output directory for the EPUB document, default: `doc`
    * `-s`, `--scripts` - List of custom JS files to include in the EPUB
      document
    * `-c`, `--styles` - List of custom CSS files to include in the EPUB
      document
  """
  def run(args) do
    ElixirLangGuide.start()

    args
    |> parse_args()
    |> process()
  end

  def parse_args(args) do
    switches = [scripts: :keep, styles: :keep]
    aliases = [g: :guide, o: :output, s: :scripts, c: :styles]

    {opts, args, _} = OptionParser.parse(args, aliases: aliases, switches: switches)

    if args != [] do
      Mix.raise "Given an invalid argument"
    end

    {:run, opts}
  end

  defp process({:run, opts}) when is_list(opts) do
    opts
    |> keep(:styles)
    |> keep(:scripts)
    |> Keyword.put(:root_dir, Path.expand(".."))
    |> ElixirLangGuide.to_epub()
    |> log()
  end

  defp keep(options, key) do
    values = Keyword.get_values(options, key)
    if values == [], do: options, else: Keyword.put(options, key, values)
  end

  defp log(file) do
    Mix.shell.info [:green, "EPUB successfully generated."]
    Mix.shell.info [:green, "View the document at #{inspect file}"]
  end
end
