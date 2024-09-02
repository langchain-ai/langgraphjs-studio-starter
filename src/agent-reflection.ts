import { HumanMessage, type AIMessage } from "@langchain/core/messages";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatOpenAI } from "@langchain/openai";

import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

// Reflect n times
const reflectTimes = 3;

const tools = [new TavilySearchResults({ maxResults: 3 })];

// Define the function that calls the model
async function callGenerateModel(state: typeof MessagesAnnotation.State) {
  /**
   * Call the LLM powering our agent.
   * Feel free to customize the prompt, model, and other logic!
   */
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
  }).bindTools(tools);

  const response = await model.invoke([
    {
      role: "system",
      // content: `You are a helpful assistant. The current date is ${new Date().getTime()}.`,
      //       content: `
      // You are a skilled writer tasked with creating an informative piece of content.
      // The target audience for this content is diverse, including both experts and
      // general readers. The tone should be appropriate to the purpose of the text,
      // which may vary between formal, informal, technical, or narrative. The primary
      // goal is to communicate the message clearly and engagingly. Be sure to include
      // any relevant details, such as data, examples, or arguments, as needed. The text
      // should be of a length that meets the project's requirements.`,
      content: `
You are an essay assistant tasked with writing excellent 5-paragraph essays.
Generate the best essay possible for the user's request.
If the user provides critique, respond with a revised version of your previous attempts.`,
    },
    ...state.messages,
  ]);

  // MessagesAnnotation supports returning a single message or array of messages
  return { messages: response };
}

// Define the function that calls the model
async function callReflectModel(state: typeof MessagesAnnotation.State) {
  /**
   * Call the LLM powering our agent.
   * Feel free to customize the prompt, model, and other logic!
   */
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
  }).bindTools(tools);

  const response = await model.invoke([
    {
      role: "system",
      //       // content: `You are a helpful assistant. The current date is ${new Date().getTime()}.`,
      //       content: `
      // You are a specialized editor tasked with reviewing a document to ensure its
      // quality. Your job is to analyze the content for grammatical errors, clarity,
      // cohesion, and accuracy. Additionally, evaluate whether the tone, structure,
      // and style are appropriate for the target audience and the purpose of the text.
      // Suggest any necessary changes to improve the document's effectiveness. If the
      // content is suitable, indicate your approval. If not, explain the reasons and
      // suggest specific modifications.`,
      content: `
You are a teacher grading an essay submission. Generate critique and recommendations for the user's submission.
Provide detailed recommendations, including requests for length, depth, style, etc.`,
    },
    ...state.messages,
  ]);

  // MessagesAnnotation supports returning a single message or array of messages
  return { messages: response };
}

// Define the function that determines whether to continue or not
function generateRouteModelOutput(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage: AIMessage = messages[messages.length - 1];

  // If the LLM is invoking tools, route there.
  if ((lastMessage?.tool_calls?.length ?? 0) > 0) {
    return "tools";
  }

  // Reflect
  if (messages.length < reflectTimes * 3) {
    return "Reflect";
  }

  // Otherwise end the graph.
  return "__end__";
}

// Define a new graph.
// See https://langchain-ai.github.io/langgraphjs/how-tos/define-state/#getting-started for
// more on defining custom graph states.
const workflow = new StateGraph(MessagesAnnotation)
  // Define the two nodes we will cycle between
  .addNode("Generate", callGenerateModel)
  .addNode("Reflect", callReflectModel)
  .addNode("tools", new ToolNode(tools))

  // Set the entrypoint as `callModel`
  // This means that this node is the first one called
  .addEdge("__start__", "Generate")

  .addConditionalEdges(
    // First, we define the edges' source node. We use `callModel`.
    // This means these are the edges taken after the `callModel` node is called.
    "Generate",
    // Next, we pass in the function that will determine the sink node(s), which
    // will be called after the source node is called.
    generateRouteModelOutput,
    // List of the possible destinations the conditional edge can route to.
    // Required for conditional edges to properly render the graph in Studio
    ["tools", "Reflect", "__end__"]
  )

  .addEdge("Reflect", "Generate")

  // This means that after `tools` is called, `callModel` node is called next.
  .addEdge("tools", "Generate");

// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
  // if you want to update the state before calling the tools
  // interruptBefore: [],
});

const userInput = new HumanMessage({
  content:
    "Write an essay on why the little prince is relevant in modern childhood",
});
