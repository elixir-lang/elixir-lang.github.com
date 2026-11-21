defmodule WebsiteExamples.Application do
  use Application

  @impl true
  def start(_type, _args) do
    # The output pane displays plain text, not terminal escape sequences.
    Application.put_env(:elixir, :ansi_enabled, false)
    Supervisor.start_link([WebsiteExamples.Evaluator], strategy: :one_for_one)
  end
end
