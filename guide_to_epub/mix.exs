defmodule ElixirLangGuide.Mixfile do
  use Mix.Project

  def project do
    [app: :elixir_lang_guide,
     version: "0.1.0",
     elixir: "~> 1.3",
     build_embedded: Mix.env == :prod,
     start_permanent: Mix.env == :prod,
     deps: deps(),
     escript: escript(),
     docs: docs()]
  end

  def application do
    [applications: [:yaml_elixir]]
  end

  defp deps do
    [{:yaml_elixir, "~> 1.3"},
     {:earmark, "~> 1.0"},
     {:bupe, "~> 0.3.0"},
     {:ex_doc, "~> 0.14", only: :dev}]
  end

  defp escript do
    [main_module: ElixirLangGuide.CLI]
  end

  defp docs do
    [main: "readme", extras: ["README.md"]]
  end
end
