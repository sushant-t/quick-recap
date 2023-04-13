import { Layout, Text, Page } from "@vercel/examples-ui";
import Head from "next/head";
import styles from "@/styles/Transcribe.module.css";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import InputForm from "@/components/InputForm";
import ProgressBar from "@/components/ProgressBar";

function Transcribe() {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [transcriptIndex, setTranscriptIndex] = useState(-1);

  const [progVisible, setProgVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  const TYPING_RATE = 5;

  const generateTranscription = async (
    e: any,
    url: string,
    file: File | undefined,
    acc: string
  ) => {
    e.preventDefault();
    if (!(url || file)) return;

    setText("");
    setCurrentTranscript("");
    setTranscriptIndex(-1);
    setLoading(false);

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
        },
        body,
      });
    } else {
      response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-accuracy": acc,
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
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    let firstChunk = true;

    let audioDuration = 0;
    let messageLength = 0;
    let audioDownload = 0;

    let audio_download_start = url ? 30 : undefined;
    let transcript_start = audio_download_start ? 50 : 30;
    let transcript_end = 100;

    let transcripts: string[] = [];
    setProgress(transcript_start);
    setLoading(true);
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      let chunkValue = decoder.decode(value);
      if (/^info: /g.test(chunkValue)) {
        setStatus(chunkValue.replace(/^info: /g, ""));
        continue;
      }
      if (/^backend: /g.test(chunkValue)) {
        let params = new URLSearchParams(chunkValue.replace(/^backend: /g, ""));
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
        continue;
      }
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
      // console.log("setting transcripts", transcripts.length);
      transcripts.push(chunkValue);
      setText((prev) => prev + chunkValue);

      // setCurrentTranscript(chunkValue);
    }

    setProgress(100);
    setStatus("Finished");
    // setLoading(false);
  };
  // let inProgress = false;
  // const progressState = (state: boolean) => {
  //   if (state) inProgress = state;
  //   console.log("progrss", inProgress);
  //   return inProgress;
  // };

  // // let vars: {
  // //   transcript: string[] | undefined;
  // //   setTranscript: Function | undefined;
  // //   timeout: any;
  // // } = {
  // //   transcript: undefined,
  // //   setTranscript: undefined,
  // //   timeout: undefined,
  // // }; // mutability purposes
  // let transcript = useRef<string[] | null>(null);
  // let setTranscript = useRef<Function | null>(null);
  // let timeout = useRef<any>(null);
  // const updateTranscript = (transcripts: string[]) => {
  //   if (timeout.current) return;
  //   timeout.current = setTimeout(transcriptFunc, 500, transcripts);
  // };

  // const transcriptFunc = (transcripts: string[]) => {
  //   if (inProgress == false && transcript.current && setTranscript.current) {
  //     clearTimeout(timeout.current);
  //     setTranscript.current([
  //       ...transcript.current,
  //       ...transcripts.slice(transcript.current.length),
  //     ]);
  //     timeout.current = null;
  //   } else {
  //     setTimeout(transcriptFunc, 500);
  //   }
  // };

  // const updateTranscriptsChild = (child: any[]) => {
  //   transcript.current = child[0];
  //   setTranscript.current = child[1];
  // };

  // const updateTranscriptSmooth = () => {
  //   // console.log("t", transcripts.length);
  //   if (transcripts.length) {
  //     // console.log(transcripts[0].substring(0, 10));
  //     setLoading(true);
  //     setCurrentTranscript(transcripts[0] as string);
  //     setTranscripts(transcripts.slice(1));
  //     // setTranscripts(transcripts);
  //     setTranscriptIndex(0);
  //   }
  // };

  // useEffect(() => {
  //   if (!currentTranscript) return;
  //   setTimeout(function updateTimeout() {
  //     if (transcriptIndex >= currentTranscript.length) {
  //       setLoading(false);
  //       return;
  //     }
  //     setText(
  //       (prev) =>
  //         prev +
  //         currentTranscript.substring(
  //           transcriptIndex,
  //           Math.min(
  //             transcriptIndex + TYPING_RATE + 1,
  //             currentTranscript.length
  //           )
  //         )
  //     );
  //     setTranscriptIndex(transcriptIndex + TYPING_RATE + 1);
  //   }, 20);
  // }, [transcriptIndex]);

  // useEffect(() => {
  //   if (loading == false) {
  //     updateTranscriptSmooth();
  //   }
  // }, [loading]);

  // useEffect(() => {
  //   // console.log(loading, transcripts.length);
  //   if (loading == false && transcripts.length) updateTranscriptSmooth();
  // }, [transcripts]);

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
          <InputForm onSubmit={generateTranscription} submitText="Transcribe" />
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{ duration: 2000 }}
          />
          {progVisible ? (
            <ProgressBar
              progress={parseInt(progress.toFixed(2))}
              status={status}
            />
          ) : null}
          <div className="space-y-10 my-10">
            {text && (
              <>
                <div>
                  <h1 className="flex justify-center mt-32 w-full mb-2 text-5xl mx-auto font-medium leading-tight text-primary">
                    Transcript
                  </h1>
                </div>
                <div
                  className="bg-white rounded-xl shadow-md p-4 hover:bg-gray-100 transition cursor-copy border"
                  onClick={() => {
                    navigator.clipboard.writeText(text.toString());
                    toast("Transcript copied to clipboard", {
                      icon: "✂️",
                    });
                  }}
                >
                  <p className={styles.transcription}>{text}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

Transcribe.Layout = Layout;

export default Transcribe;
