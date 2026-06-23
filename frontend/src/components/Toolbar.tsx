import { Show, createSignal } from "solid-js";
import { store } from "../state/store";
import { serializeMessage, LineEnding } from "../hl7/serializer";
import { profileOptions } from "../hl7/dictionary";

/** Top-bar actions: dictionary profile, copy, download, de-identify, clear. */
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

  return (
    <div class="flex flex-wrap items-center gap-2">
      <select
        class="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none"
        title="Dictionary profile"
        value={store.state.profileId}
        onChange={(e) => store.setProfile(e.currentTarget.value)}
      >
        {profileOptions().map((p) => (
          <option value={p.id}>{p.label}</option>
        ))}
      </select>

      <div class="mx-1 h-5 w-px bg-slate-200" />

      <button
        class="rounded-md border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
        onClick={copy}
      >
        {copied() ? "Copied ✓" : "Copy"}
      </button>

      <div class="flex items-center overflow-hidden rounded-md border border-slate-300">
        <button
          class="px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={download}
        >
          Download
        </button>
        <select
          class="border-l border-slate-300 bg-slate-50 px-1.5 py-1 text-xs text-slate-600 focus:outline-none"
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
        class="rounded-md bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
        onClick={props.onOpenDeidentify}
      >
        De-identify…
      </button>

      <button
        class="rounded-md px-3 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100"
        onClick={() => store.clearAll()}
      >
        Clear
      </button>

      <Show when={store.state.lastDeid}>
        <span class="rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
          De-identified {store.state.lastDeid!.length} field(s)
          <button class="ml-1 underline" onClick={() => store.clearDeidReport()}>
            dismiss
          </button>
        </span>
      </Show>
    </div>
  );
}
