defmodule ElixirLangGuide.CLI do
  @shortdoc "CLI interface to convert Elixir Guides to EPUB format"

  @moduledoc """
  Convert the Elixir Lang Guides to EPUB format. By default the "Getting
  Started" is converted, but, you can pass parameter to choose the
  "Meta-programming with Elixir" or "Mix and OTP" guides.

  ## Command line options

    * `-g`, `--guide` - Guide that you want to convert, options:
      `getting_started`, `meta` or `mix_otp`, default: `getting_started`
    * `-h`, `--help` - Show help
    * `-o`, `--output` - Output directory for the EPUB document, default: `doc`
    * `-s`, `--scripts` - List of custom JS files to include in the EPUB
      document
    * `-c`, `--styles` - List of custom CSS files to include in the EPUB
      document
    * `-v`, `--version` - Show version
  """

  @spec main(OptionParser.argv) :: String.t
  def main(args) do
    args
    |> parse_args()
    |> process()
  end

  defp parse_args(args) do
    switches = [help: :boolean, scripts: :keep, styles: :keep,
                version: :boolean]
    aliases = [g: :guide, h: :help, o: :output, v: :version]

    parse = OptionParser.parse(args, switches: switches, aliases: aliases)

    case parse do
      {[{opts, true}], _, _} -> opts
      {opts, [], []} -> {:run, opts}
      _ -> :help
    end
  end

  defp process(:help) do
    {_, more_info} = Code.get_docs(__MODULE__, :moduledoc)
    usage = ~S"""
    Usage:
      elixir_lang_guide [OPTIONS]

    Examples:
      elixir_lang_guide
      elixir_lang_guide --guide "meta"

    """
    IO.puts usage <> more_info
  end

  defp process(:version) do
    IO.puts "ElixirLangGuide v#{ElixirLangGuide.version()}"
  end

  defp process({:run, opts}) when is_list(opts) do
    opts
    |> process_keep(:styles)
    |> process_keep(:scripts)
    |> Keyword.put(:root_dir, Path.expand(".."))
    |> ElixirLangGuide.to_epub()
    |> log()
  end

  defp process_keep(options, key) do
    values = Keyword.get_values(options, key)
    if values == [], do: options, else: Keyword.put(options, key, values)
  end

  defp log(file) do
    IO.puts "EPUB successfully generated."
    IO.puts "View the document at #{inspect file}"
  end
end
