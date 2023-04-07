import { Layout, Text, Page } from "@vercel/examples-ui";
import Head from "next/head";
import styles from "@/styles/Transcribe.module.css";
import { ChangeEvent, useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";
import Select from "react-select";

function Transcribe() {
  const [loading, setLoading] = useState(false);
  const [url, setURL] = useState("");
  const [file, setFile] = useState<ReadableStream | undefined>(undefined);
  const [text, setText] = useState("");
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [transcriptIndex, setTranscriptIndex] = useState(-1);
  const TYPING_RATE = 5;
  const options = [
    { value: "tiny", label: "Weakest" },
    { value: "base", label: "Weak" },
    { value: "small", label: "Average" },
    { value: "medium", label: "Strong" },
  ];

  const generateTranscription = async (e: any) => {
    e.preventDefault();
    if (!(url || file)) return;

    setText("");
    setTranscripts([]);
    setCurrentTranscript("");
    setTranscriptIndex(-1);
    setLoading(false);

    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vidURL: url,
        vidStream: file,
      }),
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    // This data is a ReadableStream
    console.log(response.body);
    const data = response.body;
    if (!data) {
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

    let firstChunk = true;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      let chunkValue = decoder.decode(value);
      if (firstChunk) {
        firstChunk = false;
        chunkValue = chunkValue.trimStart();
      }
      console.log("setting transcripts", transcripts.length);
      setTranscripts([...transcripts, chunkValue]);
    }
    // setLoading(false);
  };

  const updateTranscriptSmooth = () => {
    console.log("t", transcripts.length);
    if (transcripts.length) {
      setLoading(true);
      setCurrentTranscript(transcripts[0] as string);
      setTranscripts(transcripts.slice(1));
      // setTranscripts(transcripts);
      setTranscriptIndex(0);
    }
  };

  useEffect(() => {
    if (!currentTranscript) return;
    setTimeout(function updateTimeout() {
      if (transcriptIndex >= currentTranscript.length) {
        setLoading(false);
        return;
      }
      setText(
        (prev) =>
          prev +
          currentTranscript.substring(
            transcriptIndex,
            Math.min(
              transcriptIndex + TYPING_RATE + 1,
              currentTranscript.length
            )
          )
      );
      setTranscriptIndex(transcriptIndex + TYPING_RATE + 1);
    }, 20);
  }, [transcriptIndex]);

  useEffect(() => {
    if (loading == false) {
      updateTranscriptSmooth();
    }
  }, [loading]);

  useEffect(() => {
    console.log(loading, transcripts.length);
    if (loading == false && transcripts.length) updateTranscriptSmooth();
  }, [transcripts]);

  const setFilePath = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList?.length == 0) return;
    const buffer = fileList![0].stream();
    setFile(buffer);
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
          <form id="transcribeForm" onSubmit={generateTranscription}>
            <div className="flex mt-10 space-x-1">
              <p className="text-left font-medium">URL</p>
            </div>
            <input
              value={url}
              onChange={(e) => setURL(e.target.value)}
              minLength={1}
              className="g-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-sky-100 focus:border-sky-100 block w-full p-2.5"
              placeholder={"e.g. https://www.youtube.com/*"}
            />
            <div className="flex mt-10 items-center space-x-1">
              <p className="text-left font-medium">Upload File</p>
            </div>
            <div className="flex justify-center">
              <div className="mb-3 w-full">
                <input
                  className="relative m-0 block w-full min-w-0 flex-auto rounded border border-solid border-neutral-300 bg-clip-padding py-[0.32rem] px-3 text-base font-normal text-neutral-700 transition duration-300 ease-in-out file:-mx-3 file:-my-[0.32rem] file:overflow-hidden file:rounded-none file:border-0 file:border-solid file:border-inherit file:bg-neutral-100 file:px-3 file:py-[0.32rem] file:text-neutral-700 file:transition file:duration-150 file:ease-in-out file:[margin-inline-end:0.75rem] file:[border-inline-end-width:1px] hover:file:bg-neutral-200 focus:border-primary focus:text-neutral-700 focus:shadow-[0_0_0_1px] focus:shadow-primary focus:outline-none dark:border-neutral-600 dark:text-neutral-200 dark:file:bg-neutral-700 dark:file:text-neutral-100"
                  type="file"
                  id="formFile"
                  onChange={setFilePath}
                />
              </div>
            </div>
            <div className="flex mt-10 items-center space-x-1">
              <p className="text-left font-medium">Accuracy Level</p>
            </div>
            <div className="flex justify-center">
              <div className="mb-3 w-full">
                <Select options={options} />
              </div>
            </div>
            <button
              type="submit"
              form="transcribeForm"
              className="flex mx-auto bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded items-center"
            >
              <svg
                className="fill-current w-4 h-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
              </svg>
              <span>Transcribe</span>
            </button>
          </form>
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{ duration: 2000 }}
          />
          <div className="space-y-10 my-10">
            {text && (
              <>
                <div>
                  <h1 className="flex justify-center mt-32 w-full mb-2 text-5xl mx-auto font-medium leading-tight text-primary">
                    Transcript
                  </h1>
                </div>
                <div className="space-y-8 flex flex-col items-center justify-center mx-auto max-w-full whitespace-pre">
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