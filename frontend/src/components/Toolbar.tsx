import { Show, createSignal } from "solid-js";
import { Copy, Check, Download, VenetianMask } from "lucide-solid";
import { store } from "../state/store";
import { serializeMessage, LineEnding } from "../hl7/serializer";
import { profileOptions } from "../hl7/dictionary";

/** Top-bar actions: dictionary profile, copy, download, de-identify. */
export default function Toolbar(props: { onOpenDeidentify: () => void }) {
  const [copied, setCopied] = createSignal(false);
  const [eol, setEol] = createSignal<LineEnding>("\r");

  const current = () => {
    const m = store.activeMessage();
    return m ? serializeMessage(m, eol()) : "";
  };

  const copy = async () => {
    await navigator.clipboard.writeText(current());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    // A local blob download — no network. The object URL is revoked after click.
    const blob = new Blob([current()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "message.hl7";
    a.click();
    URL.revokeObjectURL(url);
  };

  const btn =
    "inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800";

  return (
    <div class="flex flex-wrap items-center gap-2">
      <select
        class="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 focus:border-prc-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        title="Dictionary profile"
        value={store.state.profileId}
        onChange={(e) => store.setProfile(e.currentTarget.value)}
      >
        {profileOptions().map((p) => (
          <option value={p.id}>{p.label}</option>
        ))}
      </select>

      <button class={btn} onClick={copy}>
        <Show when={copied()} fallback={<Copy size={15} />}>
          <Check size={15} class="text-grn-700 dark:text-grn-300" />
        </Show>
        {copied() ? "Copied" : "Copy"}
      </button>

      <div class="flex items-center overflow-hidden rounded-md border border-slate-300 dark:border-slate-600">
        <button
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={download}
        >
          <Download size={15} />
          Download
        </button>
        <select
          class="border-l border-slate-300 bg-slate-50 px-1.5 py-1.5 text-xs text-slate-600 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          title="Line ending"
          value={eol()}
          onChange={(e) => setEol(e.currentTarget.value as LineEnding)}
        >
          <option value={"\r"}>CR</option>
          <option value={"\n"}>LF</option>
          <option value={"\r\n"}>CRLF</option>
        </select>
      </div>

      <button
        class="inline-flex items-center gap-1.5 rounded-md bg-warm-100 px-2.5 py-1.5 text-sm font-medium text-coral-600 ring-1 ring-warm-200 transition-colors hover:bg-warm-200 dark:bg-coral-600/15 dark:text-coral-500 dark:ring-coral-600/40 dark:hover:bg-coral-600/25"
        onClick={props.onOpenDeidentify}
      >
        <VenetianMask size={15} />
        De-identify
      </button>

      <Show when={store.state.lastDeid}>
        <span class="inline-flex items-center gap-1 rounded-md bg-grn-50 px-2 py-1 text-xs text-grn-700 dark:bg-grn-700/20 dark:text-grn-300">
          De-identified {store.state.lastDeid!.length} field(s)
          <button class="underline" onClick={() => store.clearDeidReport()}>
            dismiss
          </button>
        </span>
      </Show>
    </div>
  );
}
