import { createSignal } from "solid-js";
import { store } from "../state/store";
import { ADT_A01, ORU_R01 } from "../sampleData";

/** Drop zone + paste box for getting HL7 into the app. No upload — read locally. */
export default function InputPanel() {
  const [dragging, setDragging] = createSignal(false);
  const [text, setText] = createSignal("");

  const readFiles = async (files: FileList) => {
    const contents = await Promise.all(Array.from(files).map((f) => f.text()));
    store.loadText(contents.join("\r"));
  };

  return (
    <div class="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <div
        classList={{
          "rounded-2xl border-2 border-dashed p-10 text-center transition-colors": true,
          "border-sky-400 bg-sky-50": dragging(),
          "border-slate-300 bg-white": !dragging(),
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer?.files?.length) void readFiles(e.dataTransfer.files);
        }}
      >
        <p class="text-lg font-medium text-slate-700">Drop an HL7 file here</p>
        <p class="mt-1 text-sm text-slate-500">
          .hl7 / .txt — files are read locally and never leave this tab
        </p>
        <label class="mt-4 inline-block cursor-pointer rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700">
          Choose file…
          <input
            type="file"
            class="hidden"
            accept=".hl7,.txt,text/plain"
            multiple
            onChange={(e) => {
              const files = e.currentTarget.files;
              if (files?.length) void readFiles(files);
            }}
          />
        </label>
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-slate-600">…or paste a message</label>
        <textarea
          class="h-48 w-full resize-y rounded-lg border border-slate-300 p-3 font-mono text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          placeholder="MSH|^~\&|..."
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
        />
        <div class="flex flex-wrap gap-2">
          <button
            class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-40"
            disabled={!text().trim()}
            onClick={() => store.loadText(text())}
          >
            Parse message
          </button>
          <button
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => store.loadText(ADT_A01 + "\r" + ORU_R01)}
          >
            Load example
          </button>
        </div>
      </div>
    </div>
  );
}
