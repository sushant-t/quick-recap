// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  downloadAudio,
  downloadAudioLocal,
  transcribeAudioLocal,
} from "@/backend/AudioUtils";
import { NextApiRequest, NextApiResponse } from "next";
import getRawBody from "raw-body";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}

export const config = {
  api: {
    bodyParser: false,
  },
};

const SAVE_FILE = "video.mp3";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const acc = req.headers["x-accuracy"] as string;

  let path = "";
  if (req.headers["content-type"] != "application/json") {
    path = await downloadAudioLocal(req, SAVE_FILE);
    console.log("video saved");
  } else {
    const { vidURL } = JSON.parse((await getRequestBody(req)).toString());

    if (!vidURL || !acc) {
      return new Response("No vid in the request", { status: 400 });
    }

    if (vidURL) {
      path = await downloadAudio(vidURL, SAVE_FILE, res);
      console.log("video downloaded");
    }
  }

  const resWrite = (str: string, delay: number = 0) => {
    return new Promise((resolve) => {
      res.write(str, () => {
        setTimeout(() => resolve(true), delay);
      });
    });
  };

  // res.write("info: fetching model");

  await resWrite("info: fetching model");
  const stream = await transcribeAudioLocal(path, acc);

  await resWrite("info: generating transcript");

  // res.write("info: generating transcript");

  const writeFast = req.headers["x-fast"] === "true";

  const reader = stream.getReader();
  let done = false;
  const decoder = new TextDecoder();
  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    const chunkValue = decoder.decode(value);
    if (/^backend: /g.test(chunkValue)) {
      await resWrite(chunkValue, 100);
    } else {
      await resWrite(`backend: message_length=${chunkValue.length}`, 100);
      if (writeFast) {
        await resWrite(chunkValue, 50);
      } else {
        for (let i = 0; i < chunkValue.length; i++) {
          await resWrite(chunkValue[i], 5);
        }
      }
    }
  }
  res.end();
}

async function getRequestBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    getRawBody(req, function (err, buf) {
      if (err) return reject(err);
      resolve(buf);
    });
  });
}
