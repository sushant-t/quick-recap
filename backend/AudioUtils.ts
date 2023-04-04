import ytdl from "ytdl-core";
import * as fs from "fs";
import { OpenAI } from "openai-streams/node";

export interface OpenAIAudioTranscriptionRequest {
  file: string;
  model: string;
  prompt?: string;
  response_format?: string;
  temperature?: number;
  language?: string;
}

export async function downloadAudio() {
  ytdl("https://www.youtube.com/watch?v=aqz-KE-bpKQ", {
    filter: "audioonly",
    quality: "lowestaudio",
  })
    .pipe(fs.createWriteStream("video.mp3"))
    .on("finish", () => {
      console.log("file downloaded");
    });
}

export async function sendAudioToWhisper(
  payload: OpenAIAudioTranscriptionRequest
) {
  const res = await fetch(
    "https://api.openai.com/v1/chat/audio/transcriptions",
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}
