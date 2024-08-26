import { AIMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";

import { StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { z } from "zod";

import { StateAnnotation } from "./utils/state.js";

const tools = [
  tool(async ({ query }) => {
    const url = "https://en.wikipedia.org/w/api.php";
    const params = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: query,
      format: "json",
    });
    const response = await fetch(`${url}?${params}`);
    return await response.json();
  }, {
    name: "search_wikipedia",
    description: "Search Wikipedia for the given query and return the JSON response.",
    schema: z.object({
      query: z.string().describe("The search query to send to Wikipedia"),
    }),
  }),
];

// Define the function that calls the model
async function callModel(
  state: typeof StateAnnotation.State,
) {
  /** 
   * Call the LLM powering our agent.
   * Feel free to customize the prompt, model, and other logic!
   */
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant."],
    ["placeholder", "{messages}"],
  ]);

  const model = new ChatOpenAI({
    model: "gpt-4o",
  }).bindTools(tools);

  const response = await prompt
    .pipe(model)
    .invoke({ messages: state.messages });

  // We return a list, because this will get added to the existing list
  return { messages: [response] };
}

// Define the function that determines whether to continue or not
function routeModelOutput(state: typeof StateAnnotation.State) {
  const messages = state.messages;
  const lastMessage: AIMessage = messages[messages.length - 1];
  // If the LLM is invoking tools, route there.
  if ((lastMessage?.tool_calls?.length ?? 0) > 0) {
    return "tools";
  }
  // Otherwise end the graph.
  return "__end__";
}

// Define a new graph
const workflow = new StateGraph(StateAnnotation)
  // Define the two nodes we will cycle between
  .addNode("callModel", callModel)
  .addNode("tools", new ToolNode<typeof StateAnnotation.State>(tools))
  // Set the entrypoint as `callModel`
  // This means that this node is the first one called
  .addEdge("__start__", "callModel")
  .addConditionalEdges(
    // First, we define the edges' source node. We use `callModel`.
    // This means these are the edges taken after the `callModel` node is called.
    "callModel",
    // Next, we pass in the function that will determine the sink node(s), which
    // will be called after the source node is called.
    routeModelOutput,
  )
  // This means that after `tools` is called, `callModel` node is called next.
  .addEdge("tools", "callModel");

// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
  interruptBefore: [], // if you want to update the state before calling the tools
});
