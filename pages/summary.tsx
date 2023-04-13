import InputForm from "@/components/InputForm";
import Head from "next/head";
import React, { createContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import styles from "@/styles/Summary.module.css";
import ProgressBar from "@/components/ProgressBar";

function Summary() {
  const [_, setLoading] = useState(false);
  const [text, setText] = useState("");

  const [progVisible, setProgVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const maxTokens = 1000;

  const generateSummary = async (
    e: any,
    url: string,
    file: File | undefined,
    acc: string
  ) => {
    e.preventDefault();
    setLoading(true);
    setText("");

    setProgress(0);
    setProgVisible(true);
    setStatus("Downloading video");

    let response;
    if (file) {
      const body = new FormData();
      body.append("file", file);
      response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "x-accuracy": acc,
          "x-fast": "true",
        },
        body,
      });
    } else {
      response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-accuracy": acc,
          "x-fast": "true",
        },
        body: JSON.stringify({
          vidURL: url,
        }),
      });
    }

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    let data = response.body;
    if (!data) {
      return;
    }

    let reader = data.getReader();
    let decoder = new TextDecoder();
    let done = false;

    let firstChunk = true;

    let audioDuration = 0;
    let messageLength = 0;
    let audioDownload = 0;

    let audio_download_start = url ? 10 : undefined;
    let transcript_start = audio_download_start ? 30 : 10;
    let transcript_end = 70;

    setProgress(audio_download_start || transcript_start);

    let total = "";
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      let chunkValue = decoder.decode(value);
      if (/^info: /g.test(chunkValue)) {
        setStatus(chunkValue.replace(/^info: /g, ""));
        continue;
      }
      if (/\|\|backend: (.*?)\|\|/g.test(chunkValue)) {
        let params = new URLSearchParams(
          chunkValue.match(/\|\|backend: (.*?)\|\|/)![1]
        );
        if (params.get("audio_duration"))
          audioDuration = parseFloat(params.get("audio_duration")!);
        if (params.get("message_length"))
          messageLength = parseInt(params.get("message_length")!);
        if (params.get("audio_download")) {
          audioDownload = parseFloat(params.get("audio_download")!);
          setProgress((prev) =>
            Math.min(
              parseFloat(
                (
                  prev +
                  audioDownload * (transcript_start - audio_download_start!)
                ).toFixed(2)
              ),
              transcript_start
            )
          );
        }
        chunkValue = chunkValue.replace(/\|\|backend: (.*?)\|\|/g, "");
      }

      if (!chunkValue) continue;

      if (audioDuration && messageLength)
        setProgress((prev) =>
          Math.min(
            parseFloat(
              (
                prev +
                (chunkValue.length / messageLength) *
                  (30 / audioDuration) *
                  (transcript_end - transcript_start)
              ).toFixed(2)
            ),
            transcript_end
          )
        );
      if (firstChunk) {
        firstChunk = false;
        chunkValue = chunkValue.trimStart();
      }

      total += chunkValue;
    }

    // setTranscript(total);

    setStatus("Generating summary");
    const summaryPrompt = `I want you to summarize a video for me based on its transcript. Structure your response into a bulleted list. The longer the video transcript, the more summary points I want you to include. The transcript for the video is as follows: "${total}"`;
    response = await fetch("/api/summarize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: summaryPrompt,
        maxTokens: maxTokens,
      }),
    });
    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    data = response.body;
    if (!data) {
      return;
    }

    reader = data.getReader();
    decoder = new TextDecoder();
    done = false;
    let priorChunk = "";
    firstChunk = true;

    let summary_start = transcript_end;
    let summary_end = 100;

    setProgress(summary_start);

    let interval = setInterval(
      () =>
        setProgress(
          (prev) =>
            prev +
            Math.floor(
              ((summary_end - prev) / summary_end) * (summary_end - prev)
            )
        ),
      500
    );

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      let chunkValue = decoder.decode(value);
      if (firstChunk || priorChunk.substring(priorChunk.length - 1) == "\n")
        chunkValue = chunkValue.replace("-", "\u2022");
      setText((prev) => prev + chunkValue);
      priorChunk = chunkValue;
      firstChunk = false;
    }

    clearInterval(interval);
    setProgress(summary_end);
    setStatus("Finished");
    setLoading(false);
  };
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className="flex w-9/12 flex-col mx-auto py-2 min-h-screen">
          <InputForm onSubmit={generateSummary} submitText="Summarize" />
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{ duration: 2000 }}
          />
          {progVisible ? (
            <ProgressBar progress={progress} status={status} />
          ) : null}
          <div className="space-y-10 my-10">
            {text && (
              <>
                <div>
                  <h1 className="flex justify-center mt-32 w-full mb-2 text-5xl mx-auto font-medium leading-tight text-primary">
                    Summary
                  </h1>
                </div>
                <div className="space-y-8 flex flex-col items-center justify-center mx-auto max-w-full whitespace-pre">
                  <div
                    className="bg-white rounded-xl shadow-md p-4 hover:bg-gray-100 transition cursor-copy border"
                    onClick={() => {
                      navigator.clipboard.writeText(text.toString());
                      toast("Summary copied to clipboard", {
                        icon: "✂️",
                      });
                    }}
                  >
                    <p className={styles.transcription}>{text}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default Summary;
