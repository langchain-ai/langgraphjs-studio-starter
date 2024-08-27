# LangGraph Studio TypeScript Starter (Beta)

This is a sample project to help you get started with developing [LangGraph.js](https://github.com/langchain-ai/langgraphjs) projects in [LangGraph Studio](https://github.com/langchain-ai/langgraph-studio).

![](/static/studio.png)

It contains a simple example graph exported from `src/agent.ts` that implements a basic ReAct pattern where the model can use tools for more information before responding to a user query, as well as the required `langgraph.json` for opening the graph in LangGraph Studio.

## Getting Started

This demo requires an [OpenAI API key](https://openai.com/) and a [Tavily API key](https://tavily.com/) for search results.

0. Clone this repository.
1. Rename the existing `.env.example` file `.env` and fill in your `OPENAI_API_KEY` and `TAVILY_API_KEY`.
2. Download the latest release of LangGraph Studio [from here](https://github.com/langchain-ai/langgraph-studio/releases).
3. Open the enclosing folder in LangGraph Studio.
4. Start testing your app!

The graph has access to a web search tool powered by Tavily - you can try asking it about current events like `"What is the current conservation status of the Great Barrier Reef?"` and see it use the tool.

Note that the `Deploy` button is currently not supported, but will be soon!

## Development

While iterating on your graph, you can edit past state and rerun your app from past states to debug specific nodes. Local changes will be automatically applied via hot reload. Try adding an interrupt before the agent calls tools, updating the prompt to take on a persona, or adding additional nodes and edges!

Follow up requests will be appended to the same thread. You can create an entirely new thread, clearing previous history, using the `+` button in the top right.

LangGraph Studio also integrates with [LangSmith](https://smith.langchain.com/) for more in-depth tracing and collaboration with teammates.

You can swap in other models if you'd like by using [the appropriate LangChain.js integration package](https://js.langchain.com/v0.2/docs/integrations/chat/) or the appropriate SDK directly.
