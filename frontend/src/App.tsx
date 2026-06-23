import { Show, createSignal } from "solid-js";
import { store } from "./state/store";
import PrivacyBadge from "./components/PrivacyBadge";
import Toolbar from "./components/Toolbar";
import InputPanel from "./components/InputPanel";
import MessageList from "./components/MessageList";
import SearchBar from "./components/SearchBar";
import ValidationPanel from "./components/ValidationPanel";
import RawView from "./components/RawView";
import StructuredView from "./components/StructuredView";
import FieldInspector from "./components/FieldInspector";
import DeidentifyDialog from "./components/DeidentifyDialog";

export default function App() {
  const [deidOpen, setDeidOpen] = createSignal(false);
  const hasMessages = () => store.messageCount() > 0;

  return (
    <div class="flex h-full flex-col bg-slate-50 text-slate-900">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        <div class="flex items-center gap-3">
          <h1 class="text-base font-semibold text-slate-800">
            HL7 <span class="text-sky-600">Viewer &amp; Editor</span>
          </h1>
          <PrivacyBadge />
        </div>
        <Show when={hasMessages()}>
          <Toolbar onOpenDeidentify={() => setDeidOpen(true)} />
        </Show>
      </header>

      <Show when={hasMessages()} fallback={<InputPanel />}>
        <main class="flex min-h-0 flex-1">
          <aside class="flex w-72 shrink-0 flex-col overflow-auto border-r border-slate-200 bg-white">
            <Show when={store.messageCount() > 1}>
              <div class="border-b border-slate-200 py-1">
                <MessageList />
              </div>
            </Show>
            <div class="border-b border-slate-200 py-1">
              <SearchBar />
            </div>
            <div class="py-1">
              <ValidationPanel />
            </div>
          </aside>

          <section class="flex min-w-0 flex-1 flex-col">
            <div class="flex min-h-0 flex-1">
              <div class="flex min-w-0 flex-1 flex-col border-r border-slate-200">
                <div class="border-b border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Structure
                </div>
                <div class="min-h-0 flex-1">
                  <Show when={store.activeMessage()}>
                    {(m) => <StructuredView message={m()} />}
                  </Show>
                </div>
              </div>
              <div class="flex w-[42%] min-w-0 flex-col">
                <div class="border-b border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Raw
                </div>
                <div class="min-h-0 flex-1">
                  <Show when={store.activeMessage()}>
                    {(m) => <RawView message={m()} />}
                  </Show>
                </div>
              </div>
            </div>
            <FieldInspector />
          </section>
        </main>
      </Show>

      <DeidentifyDialog open={deidOpen()} onClose={() => setDeidOpen(false)} />
    </div>
  );
}
