import React, { ChangeEvent, useState } from "react";
import Select from "react-select";

type InputFormProps = {
  onSubmit: any;
  submitText: any;
};

const options = [
  { value: "tiny", label: "Weakest" },
  { value: "base", label: "Weak" },
  { value: "small", label: "Average" },
  { value: "medium", label: "Strong" },
];
function InputForm(props: InputFormProps) {
  const { onSubmit, submitText } = props;
  const [url, setURL] = useState("");
  const [file, setFile] = useState<ReadableStream | undefined>(undefined);
  const [acc, setAcc] = useState("");

  const setFilePath = async (e: ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList?.length == 0) return;
    const buffer = fileList![0].stream();
    setFile(buffer);
  };
  return (
    <form id="transcribeForm" onSubmit={(e) => onSubmit(e, url, file, acc)}>
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
          <Select
            options={options}
            onChange={(e) => setAcc(e!.value)}
            name="accSelect"
            instanceId="accSelect"
            required
          />
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
        <span>{submitText}</span>
      </button>
    </form>
  );
}

export default InputForm;
