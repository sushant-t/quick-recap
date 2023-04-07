import { AxiosResponse } from "axios";
import { ReadStream } from "fs";
import { IncomingMessage } from "http";
import { Configuration, OpenAIApi } from "openai";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";

export interface OpenAIAudioTranscriptionPayload {
  file: ReadStream;
  model: string;
  prompt?: string;
  responseFormat?: string;
  temperature?: number;
  language?: string;
}

export type ChatGPTAgent = "user" | "system" | "assistant";

export interface ChatGPTMessage {
  role: ChatGPTAgent;
  content: string;
}

export interface OpenAIChatCompletionPayload {
  model: string;
  messages: ChatGPTMessage[];
  temperature: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  max_tokens: number;
  stream: boolean;
  n: number;
  user?: any;
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function OpenAIAudioTranscriptionRequest(
  payload: OpenAIAudioTranscriptionPayload
) {
  const completion = await openai.createTranscription(
    payload.file as unknown as File,
    payload.model,
    payload.prompt,
    payload.responseFormat,
    payload.temperature,
    payload.language
  );

  return completion;
}

export async function OpenAIChatCompletionRequest(
  payload: OpenAIChatCompletionPayload
) {
  console.log(payload, { responseType: "stream" });
  const completion = await openai.createChatCompletion(payload, {
    responseType: "stream",
  });

  let decoder = new TextDecoder();
  let encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      function prepareChunk(event: ParsedEvent | ReconnectInterval) {
        if (event.type == "event") {
          let str = event.data;
          // console.log("s", str);
          // console.log("final enqueue", str);
          if (str.includes("data:")) console.log(str);
          if (str === "[DONE]") {
            str = "";
            console.log("closing controller");
            controller.close();
            return;
          }

          try {
            let json = JSON.parse(str);
            let text = json.choices[0].delta?.content || "";
            // console.log(text);
            controller.enqueue(encoder.encode(text));
          } catch (err) {
            //   console.error(err);
          }
        }
      }

      const stream = completion.data as unknown as IncomingMessage;
      const parser = createParser(prepareChunk);

      stream.on("data", (value) => {
        parser.feed(decoder.decode(value));
      });

      stream.on("end", () => {
        controller.close();
        return;
      });
    },
  });
}
