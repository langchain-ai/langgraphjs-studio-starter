# LangGraph Studio TypeScript Starter (Beta)

This is a sample project to help you get started with developing [LangGraph.js](https://github.com/langchain-ai/langgraphjs) projects in [LangGraph Studio](https://github.com/langchain-ai/langgraph-studio).

It contains a simple example graph exported from `src/agent.ts` that implements a basic ReAct pattern where the model can use tools for more information before responding to a user query, as well as the required `langgraph.json` for opening the agent in LangGraph Studio.

## Getting Started

0. Clone this repository.
1. Rename the existing `.env.example` file `.env` and fill in your `OPENAI_API_KEY`.
2. Download the latest release of LangGraph Studio [from here](https://github.com/langchain-ai/langgraph-studio/releases).
3. Open the enclosing folder in LangGraph Studio.
4. Start testing your app!

While iterating on your app, you can edit past state and rerun your app from past states to debug specific nodes. Local changes will be automatically applied via hot reload. It also integrates with [LangSmith](https://smith.langchain.com/) for more in-depth tracing and collaboration with teammates.

You can swap in other models if you'd like by using [the proper LangChain.js integration package](https://js.langchain.com/v0.2/docs/integrations/chat/) or the appropriate SDK directly.
