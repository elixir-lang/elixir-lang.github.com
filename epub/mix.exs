defmodule ElixirLangGuide.Mixfile do
  use Mix.Project

  def project do
    [app: :elixir_lang_guide,
     version: "0.1.0",
     elixir: "~> 1.4",
     build_embedded: Mix.env == :prod,
     start_permanent: Mix.env == :prod,
     deps: deps(),
     aliases: [epub: &epub/1]]
  end

  def application do
    []
  end

  defp epub(_args) do
    Mix.Task.run "app.start"
    ElixirLangGuide.run("..")
  end

  defp deps do
    [{:yaml_elixir, "~> 1.3"},
     {:earmark, "~> 1.0"},
     {:bupe, "~> 0.3.0"}]
  end
end
