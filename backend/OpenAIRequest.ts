export async function OpenAIRequest(completion: Response) {
  let decoder = new TextDecoder();
  let encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      function prepareChunk(chunk: Uint8Array) {
        let str = decoder.decode(chunk).trim();
        str = str.replace(/^data: /, "");
        if (str === "[DONE]") {
          str = "";
          controller.close();
          return;
        }

        try {
          let json = JSON.parse(str);
          let text = json.choices[0].delta?.content || "";
          controller.enqueue(encoder.encode(text));
        } catch (err) {
          console.error(err);
        }
      }

      let stream = completion.body!.getReader();
      while (true) {
        const { done, value } = await stream.read();
        if (done) {
          // Do something with last chunk of data then exit reader
          controller.close();
          return;
        }
        prepareChunk(value);
      }
    },
  });
}
