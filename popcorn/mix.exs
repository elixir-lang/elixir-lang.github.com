defmodule WebsiteExamples.MixProject do
  use Mix.Project

  def project do
    [
      app: :website_examples,
      version: "0.1.0",
      elixir: "~> 1.20",
      deps: [{:popcorn, "== 1.0.1"}]
    ]
  end

  def application do
    [mod: {WebsiteExamples.Application, []}]
  end
end
