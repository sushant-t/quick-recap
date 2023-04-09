// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { downloadAudio, transcribeAudioLocal } from "@/backend/AudioUtils";
import {
  OpenAIAudioTranscriptionPayload,
  OpenAIAudioTranscriptionRequest,
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
  const { vidURL, vidStream, acc } = req.body;

  if (!vidURL && !vidStream && !acc) {
    return new Response("No vid in the request", { status: 400 });
  }

  let path = "";
  if (vidURL) {
    path = await downloadAudio(vidURL, SAVE_FILE);
    console.log("video downloaded");
  }

  const stream = await transcribeAudioLocal(path, acc);

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
