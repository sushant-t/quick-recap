import ytdl from "ytdl-core";
import * as fs from "fs";
import {
  OpenAIAudioTranscriptionPayload,
  OpenAIAudioTranscriptionRequest,
  OpenAIChatCompletionPayload,
  OpenAIChatCompletionRequest,
} from "./OpenAIRequest";

import { Options, PythonShell } from "python-shell";
import { IncomingForm } from "formidable";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import PersistentFile from "formidable/PersistentFile";

export async function downloadAudio(
  url: string,
  saveFile: string,
  res: NextApiResponse
): Promise<string> {
  // if (fs.existsSync(saveFile)) return saveFile;
  return new Promise(async (resolve) => {
    console.log("dwonloading");
    try {
      ytdl(url, {
        filter: "audioonly",
        quality: "lowestaudio",
      })
        .on("progress", ({}, downloaded, total) => {
          console.log(
            `Downloading audio... ${((downloaded / total) * 100).toFixed(2)}%`
          );
          res.write(
            `backend: audio_download=${(downloaded / total).toFixed(4)}`
          );
        })
        .pipe(fs.createWriteStream(saveFile))
        .on("finish", () => {
          console.log("file downloaded");
          resolve(saveFile);
        });
    } catch (err) {
      console.log(err);
    }
  });
}

export async function downloadAudioLocal(
  req: NextApiRequest,
  saveFile: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, async function (err, fields, files) {
      if (err) reject(err);
      fs.writeFileSync(saveFile, fs.readFileSync((files.file as any).filepath));
      resolve(saveFile);
    });
  });
}

export async function transcribeAudio(
  payload: OpenAIAudioTranscriptionPayload
) {
  const response = await OpenAIAudioTranscriptionRequest(payload);

  return response;
}

export async function summarizeAudioTranscript(
  payload: OpenAIChatCompletionPayload
) {
  const response = await OpenAIChatCompletionRequest(payload);

  return response;
}

export async function transcribeAudioLocal(filePath: string, acc: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      function prepareTranscription(data: string) {
        if (!/^(backend: |\[.*?-->.*?\] )/g.test(data)) return;
        let text = data.replace(/^\[.*?\] /g, "");
        console.log(text);
        controller.enqueue(encoder.encode(text));
      }

      let options: Options = {
        mode: "text",
        pythonPath: process.env.WHISPER_PYTHON_BIN,
        pythonOptions: ["-u"], // get print results in real-time
        scriptPath: "./backend/whisper/",
        args: [`--model_size=${acc}`],
      };

      console.log(`using ${acc} model...`);
      const shell = new PythonShell("decode.py", options);
      shell.on("error", (err) => console.log(err));
      shell.on("message", function (message) {
        prepareTranscription(message);
      });

      shell.on("stderr", (err) => console.log(err));

      shell.on("close", () => {
        console.log("done");
        controller.close();
        return;
      });
    },
  });
}
