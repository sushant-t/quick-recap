import React, { useState } from "react";

function ProgressBar(props: { progress: number; status: string }) {
  const { progress, status } = props;

  return (
    <div className="relative pt-1">
      <div className="flex mb-2 items-center justify-between">
        <div>
          <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-cyan-600 bg-cyan-200">
            {status}
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold inline-block text-cyan-600">
            {`${progress}%`}
          </span>
        </div>
      </div>
      <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-cyan-200">
        <div
          style={{ width: `${progress}% `, transition: "width 800ms ease" }}
          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-cyan-500"
        ></div>
      </div>
    </div>
  );
}

export default ProgressBar;
