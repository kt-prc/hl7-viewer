import { createEffect, createSignal } from "solid-js";
import { Upload, Eraser, FlaskConical, PanelLeftClose } from "lucide-solid";
import { store } from "../state/store";
import { ADT_A01, ORU_R01 } from "../sampleData";

/**
 * The always-present paste box. It is the primary way messages get in (99% of
 * use is pasting) and stays editable: typing re-parses live, and edits made in
 * the Structure/Raw views flow back into the text here.
 */
export default function SourcePanel(props: { onCollapse?: () => void }) {
  const [text, setText] = createSignal(store.documentText());
  // Guards the feedback loop: when the change originated from typing here we
  // must not overwrite the user's exact text with the re-serialized version.
  let fromTextarea = false;

  createEffect(() => {
    const doc = store.documentText();
    if (fromTextarea) {
      fromTextarea = false;
      return;
    }
    setText(doc);
  });

  const onInput = (value: string) => {
    fromTextarea = true;
    setText(value);
    store.replaceDocument(value);
  };

  const readFiles = async (files: FileList) => {
    const contents = await Promise.all(Array.from(files).map((f) => f.text()));
    store.loadText(contents.join("\r"));
  };

  return (
    <div class="flex h-full flex-col bg-white dark:bg-slate-900">
      <div class="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-1.5 dark:border-slate-700">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          Source
        </span>
        <div class="flex items-center gap-2">
          <span class="text-[11px] text-slate-400 dark:text-slate-500">edits re-parse live</span>
          <button
            class="grid h-6 w-6 place-items-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Collapse source panel"
            onClick={() => props.onCollapse?.()}
          >
            <PanelLeftClose size={15} />
          </button>
        </div>
      </div>

      <textarea
        class="min-h-0 flex-1 resize-none bg-transparent p-3 font-mono text-[13px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
        spellcheck={false}
        autocomplete="off"
        autocapitalize="off"
        placeholder={"Paste an HL7 message here…\n\nMSH|^~\\&|…"}
        value={text()}
        onInput={(e) => onInput(e.currentTarget.value)}
      />

      <div class="flex flex-wrap items-center gap-1.5 border-t border-slate-200 px-3 py-2 dark:border-slate-700">
        <label class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
          <Upload size={14} />
          Upload
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
        <button
          class="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          onClick={() => store.loadText(ADT_A01 + "\r" + ORU_R01)}
        >
          <FlaskConical size={14} />
          Example
        </button>
        <button
          class="ml-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-coral-600 dark:text-slate-400 dark:hover:bg-slate-800"
          onClick={() => store.clearAll()}
        >
          <Eraser size={14} />
          Clear
        </button>
      </div>
    </div>
  );
}
