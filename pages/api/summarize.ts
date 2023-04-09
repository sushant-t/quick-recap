// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  OpenAIChatCompletionPayload,
  OpenAIChatCompletionRequest,
} from "@/backend/OpenAIRequest";
import { NextApiRequest, NextApiResponse } from "next";
if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}
const SAVE_FILE = "video.mp3";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { prompt, maxTokens } = req.body;

  if (!prompt) {
    return new Response("No vid in the request", { status: 400 });
  }

  const payload: OpenAIChatCompletionPayload = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: maxTokens,
    stream: true,
    n: 1,
  };

  console.log(payload);

  const stream = await OpenAIChatCompletionRequest(payload);

  res.status(200);

  const reader = stream.getReader();
  let done = false;
  const decoder = new TextDecoder();
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    const chunkValue = decoder.decode(value);
    console.log(chunkValue);
    res.write(chunkValue);
  }
  res.end();
}
