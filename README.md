# LangGraph Studio TypeScript Starter (Beta)

This is a sample project that will help you get started with developing [LangGraph.js](https://github.com/langchain-ai/langgraphjs) projects in [LangGraph Studio](https://github.com/langchain-ai/langgraph-studio) and deploying them to [LangGraph Cloud](https://langchain-ai.github.io/langgraph/cloud/deployment/setup_javascript/).

![](/static/studio.gif)

It contains a simple example graph exported from `src/agent.ts` that implements a basic ReAct pattern where the model can use tools for more information before responding to a user query. It also includes the required `langgraph.json` config file for opening the graph in LangGraph Studio.

## Getting Started

This demo requires an [OpenAI API key](https://openai.com/) and a [Tavily API key](https://tavily.com/) for search results.

1. Clone this repository. (git clone https://github.com/langchain-ai/langgraphjs-studio-starter.git)
2. Rename the existing `.env.example` file `.env` and fill in your `OPENAI_API_KEY` and `TAVILY_API_KEY`.
3. Download the latest release of LangGraph Studio [from here](https://github.com/langchain-ai/langgraph-studio/releases).
4. Log in/sign up for [LangSmith](https://smith.langchain.com/) if you haven't already.
5. Ensure Docker is running. You can [download Docker here](https://www.docker.com/) and install it if you don't have it already.
6. Open the enclosing folder in LangGraph Studio.
7. Start testing your app!

The graph has access to a web search tool powered by [Tavily](https://tavily.com) - you can try asking it about current events like `"What is the current conservation status of the Great Barrier Reef?"` and watch the model use the tool.

You will also need the latest versions of `@langchain/langgraph` and `@langchain/core`. If you have an existing project that you want to open in Studio, see [these instructions](https://langchain-ai.github.io/langgraphjs/how-tos/manage-ecosystem-dependencies/) for help upgrading.

You can also [click here](https://youtu.be/RB3OHqM7TFA) to see a video tour of LangGraph.js and Studio.

## Development

You must export your graph, or a function that returns a created graph, from a specified file. See [this page for more information](https://langchain-ai.github.io/langgraph/cloud/reference/cli/#configuration-file).

While iterating on your graph, you can edit past state and rerun your app from past states to debug specific nodes. Local changes will be automatically applied via hot reload. Try adding an interrupt before the agent calls tools, updating the default system message in `src/utils/state.ts` to take on a persona, or adding additional nodes and edges!

Follow up requests will be appended to the same thread. You can create an entirely new thread, clearing previous history, using the `+` button in the top right.

You can find the latest docs on [LangGraph.js](https://langchain-ai.github.io/langgraphjs/) here, including examples and other references.

### Defining state

The sample graph's state uses a prebuilt annotation called `MessagesAnnotation` to declare its state define how it handles return values from nodes. This annotation defines a state that is an object with a single key called `messages`. When a node in your graph returns messages, these returned messages are accumulated under the `messages` key in the state.

A sample pattern might look like this:

1. HumanMessage - initial user input
2. AIMessage with .tool_calls - agent picking tool(s) to use to collect information
3. ToolMessage(s) - the responses (or errors) from the executed tools
    (... repeat steps 2 and 3 as needed ...)
4. AIMessage without .tool_calls - agent responding in unstructured format to the user.
5. HumanMessage - user responds with the next conversational turn.
    (... repeat steps 2-5 as needed ... )

The graph's state will merge lists of messages or returned single messages, updating existing messages by ID.

By default, this ensures the state is "append-only", unless the new message has the same ID as an existing message.

For further reading, see [this page](https://langchain-ai.github.io/langgraphjs/how-tos/define-state/#getting-started).

## Deployment

Once you've refined your graph locally, you can easily deploy it from a Git repo to LangGraph Cloud, our scalable deployment service for agents.
See the [documentation here](https://langchain-ai.github.io/langgraph/cloud/deployment/setup_javascript/) for information on how to sign up.

## Notes

Currently in order for Studio to draw conditional edges properly, you will need to add a third parameter that manually lists the possible nodes the edge can route between. Here's an example:

```ts
.addConditionalEdges(
  // First, we define the edges' source node. We use `callModel`.
  // This means these are the edges taken after the `callModel` node is called.
  "callModel",
  // Next, we pass in the function that will determine the sink node(s), which
  // will be called after the source node is called.
  routeModelOutput,
  // List of the possible destinations the conditional edge can route to.
  // Required for conditional edges to properly render the graph in Studio
  [
    "tools",
    "__end__"
  ],
)
```

We are working to lift this requirement in the future.

LangGraph Studio also integrates with [LangSmith](https://smith.langchain.com/) for more in-depth tracing and collaboration with teammates.

You can swap in other models if you'd like by using [the appropriate LangChain.js integration package](https://js.langchain.com/docs/integrations/chat/) or the appropriate SDK directly.

## Thank you!

LangGraph.js support in Studio is currently in beta, so if you have questions or feedback, please let us know. Connect with us on X [@LangChainAI](https://x.com/langchainai).

