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
  const { vidURL, vidStream } = req.body;

  if (!vidURL && !vidStream) {
    return new Response("No vid in the request", { status: 400 });
  }

  let path = "";
  if (vidURL) {
    path = await downloadAudio(vidURL, SAVE_FILE);
    console.log("video downloaded");
  }

  // const payload: OpenAIAudioTranscriptionPayload = {
  //   file: path ? createReadStream(path) : vidStream,
  //   model: "whisper-1",
  //   responseFormat: "text",
  // };

  // const response = await OpenAIAudioTranscriptionRequest(payload);

  const stream = await transcribeAudioLocal(path);

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
