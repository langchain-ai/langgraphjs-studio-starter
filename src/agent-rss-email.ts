import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { type AIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { TokenTextSplitter } from "@langchain/textsplitters";
import FirecrawlApp from "@mendable/firecrawl-js";
import parser from "rss-url-parser";
import { z } from "zod";

// RSS Tool

const rssFeeds = [
  "https://motor1.uol.com.br/rss/news/all/",
  "https://quatrorodas.abril.com.br/feed/",
  "https://g1.globo.com/rss/g1/autoesporte",
  "https://www.flatout.com.br/feed",
  "https://www.automotivebusiness.com.br/rss.xml",
];

const rssReaderSchema = z.object({
  feedUrl: z.string(),
});

const rssReaderTool = tool(
  async (input): Promise<string> => {
    console.log("Searching RSS Feed:", input.feedUrl);
    const data = await parser(input.feedUrl);
    return JSON.stringify(data);
  },
  {
    name: "rssReader",
    description: "Read RSS feeds",
    schema: rssReaderSchema,
  }
);

// Firecrawl Scrape & Crawl Tools

const firecrawlApp = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

const firecrawlScrapeSchema = z.object({
  url: z.string().url(),
  formats: z.array(z.string()).optional(),
});

const firecrawlScrapeTool = tool(
  async (input): Promise<string[]> => {
    console.log("Scraping URL:", input.url);
    const scrapeResponse = await firecrawlApp.scrapeUrl(input.url, {
      formats: input.formats || ["markdown", "html"],
    });

    const textSplitter = new TokenTextSplitter({
      chunkSize: 2048,
      chunkOverlap: 256,
    });
    return textSplitter.splitText(JSON.stringify(scrapeResponse.data));
  },
  {
    name: "firecrawlScrape",
    description: "Scrape a website using Firecrawl",
    schema: firecrawlScrapeSchema,
  }
);

const firecrawlCrawlSchema = z.object({
  url: z.string().url(),
  limit: z.number().min(1).max(3).optional(),
  formats: z.array(z.string()).optional(),
});

const firecrawlCrawlTool = tool(
  async (input): Promise<string[]> => {
    console.log("Crawling URL:", input.url);

    const crawlResponse = await firecrawlApp.crawlUrl(input.url, {
      limit: input.limit || 1,
      scrapeOptions: {
        formats: input.formats || ["markdown", "html"],
      },
    });

    const textSplitter = new TokenTextSplitter({
      chunkSize: 2048,
      chunkOverlap: 256,
    });
    return textSplitter.splitText(crawlResponse.markdown);
  },
  {
    name: "firecrawlCrawl",
    description: "Crawl a website using Firecrawl",
    schema: firecrawlCrawlSchema,
  }
);

const tools = [
  // new TavilySearchResults({ maxResults: 3 }),
  rssReaderTool,
  firecrawlScrapeTool,
  firecrawlCrawlTool,
];

async function callKnowledgeBaseModel(state: typeof MessagesAnnotation.State) {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
  }).bindTools(tools);

  const response = await model.invoke([
    {
      role: "system",
      content: `
  Entender sobre o cliente, buscando analisá-lo para saber o que está mais compatível com ele.
  Site: https://premacar.com.br/
  Blog: https://premacar.com.br/blog/

  IMPORTANTE: Entenda realmente o contexto do cliente, mas não acesse muitas páginas por vez.
  Pesquise um site por vez.
  Garanta que fez duas pesquisas antes de encerrar a busca.
  `,
    },
    ...state.messages,
  ]);

  return { messages: response };
}

async function callCurateModel(state: typeof MessagesAnnotation.State) {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
  }).bindTools(tools);

  const response = await model.invoke([
    {
      role: "system",
      content: `
Passo 1. Use os sites disponíveis no RSS Feed para analisar a relevância nas notícias do RSS Feed com o cliente conforme o que foi pesquisado e aprendido.
RSS Feeds disponíveis:
${rssFeeds.map((feed) => `- ${feed}`).join("\n")}

Passo 2. Dentre as notícias disponíveis, selecione pelo menos uma relevante.

Caso não tenha nada relevante, informe: não encontrei algo relevante.
IMPORTANTE: Não encerre a busca sem pesquisar pela Premacar.
Faça um por vez.
`,
    },
    ...state.messages,
  ]);
  return { messages: response };
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("KnowledgeBase", callKnowledgeBaseModel)
  .addNode("Curate", callCurateModel)
  .addNode("toolsKnowledgeBase", new ToolNode(tools))
  .addNode("toolsCurate", new ToolNode(tools))

  .addEdge("__start__", "KnowledgeBase")

  .addConditionalEdges(
    "KnowledgeBase",
    (state) => {
      const messages = state.messages;
      const lastMessage: AIMessage = messages[messages.length - 1];

      if ((lastMessage?.tool_calls?.length ?? 0) > 0) {
        return "toolsKnowledgeBase";
      }

      // return "Curate";
      return "__end__";
    },
    [
      "toolsKnowledgeBase",
      // "Curate",
      "__end__",
    ]
  )
  .addEdge("toolsKnowledgeBase", "KnowledgeBase")

  .addConditionalEdges(
    "Curate",
    (state) => {
      const messages = state.messages;
      const lastMessage: AIMessage = messages[messages.length - 1];

      if ((lastMessage?.tool_calls?.length ?? 0) > 0) {
        return "toolsCurate";
      }

      return "__end__";
    },
    ["toolsCurate", "KnowledgeBase", "__end__"]
  )
  .addEdge("toolsCurate", "Curate");

export const graph = workflow.compile({});
