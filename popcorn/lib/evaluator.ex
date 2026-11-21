defmodule WebsiteExamples.Evaluator do
  use GenServer

  def start_link(_args), do: GenServer.start_link(__MODULE__, nil, name: :evaluator)

  @impl true
  def init(_args), do: {:ok, nil}

  @impl true
  def handle_call(["eval", source], _from, state) do
    task = Task.async(fn -> evaluate(source) end)

    result =
      case Task.yield(task, 10_000) || Task.shutdown(task, :brutal_kill) do
        {:ok, result} -> result
        nil -> %{error: "Execution timed out after 10 seconds."}
      end

    {:reply, result, state}
  end

  defp evaluate(source) do
    {value, _bindings} = Code.eval_string(source, [], file: "example.exs")
    %{value: inspect(value, pretty: true, width: 50)}
  rescue
    error -> %{error: Exception.format(:error, error, user_stacktrace(__STACKTRACE__))}
  catch
    kind, reason -> %{error: Exception.format(kind, reason, user_stacktrace(__STACKTRACE__))}
  end

  defp user_stacktrace(stacktrace) do
    Enum.take_while(stacktrace, fn
      {:elixir, _, _, _} -> false
      {Code, :validated_eval_string, _, _} -> false
      {__MODULE__, _, _, _} -> false
      _ -> true
    end)
  end
end
