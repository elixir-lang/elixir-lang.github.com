defmodule Mix.Tasks.Hello do
  use Mix.Task

  def run(_) do
    Mix.shell.info "Hello from task installed from elixir-lang.org!"
  end
end