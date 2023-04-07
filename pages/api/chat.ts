import { type ChatGPTMessage } from "@/backend/OpenAIRequest";
import { IncomingMessage } from "http";
import {
  OpenAIChatCompletionPayload,
  OpenAIChatCompletionRequest,
} from "../../backend/OpenAIRequest";
import type { NextApiRequest, NextApiResponse } from "next";

// break the app if the API key is missing
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing Environment Variable OPENAI_API_KEY");
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const body = req.body;
  const messages: ChatGPTMessage[] = [
    {
      role: "system",
      content: `This context is about React JS and the ways to create a React app without using the official tool called Create React app. Although it is widely recommended, the video suggests that it is a trap and not a good starting point for beginners. Instead, there are several other tools that can be used for different types of React applications. Stackplits and Code Sandbox are web-based instant development environments that allow users to run React in the browser without needing to install dependencies manually. They are suitable for learning and prototyping. Vite, on the other hand, is a build tool that is faster in development and has a TypeScript template out of the box. However, it provides a starting point for building a single-page application, and does not deal with server-side rendering or routing. NX, known for building mono-repos, can also build plain React apps that have nothing to do with mono-repos. It has many useful features for scaling complexity, including task caching and distribution on the cloud. It also has generators, a NX graph command, and a CI workflow that can automate continuous integration and delivery. When building a multi-page application, React rendering frameworks, also known as Metaframeworks, such as Next.js and Remix, can be used. They provide file system-based routing, server-side data fetching, image optimization, middleware, and other features that are useful in production projects.`,
    },
  ];
  messages.push(...body?.messages);

  const payload: OpenAIChatCompletionPayload = {
    model: "gpt-3.5-turbo",
    messages: messages,
    temperature: process.env.AI_TEMP ? parseFloat(process.env.AI_TEMP) : 0.7,
    max_tokens: process.env.AI_MAX_TOKENS
      ? parseInt(process.env.AI_MAX_TOKENS)
      : 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true,
    user: body?.user,
    n: 1,
  };

  const stream = await OpenAIChatCompletionRequest(payload);

  res.status(200);

  const reader = stream.getReader();
  let done = false;
  const decoder = new TextDecoder();
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    const chunkValue = decoder.decode(value);
    res.write(chunkValue);
  }
  res.end();
};
export default handler;
