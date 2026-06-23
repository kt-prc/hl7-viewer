import { Show, createSignal } from "solid-js";
import { Activity } from "lucide-solid";
import { store } from "./state/store";
import PrivacyBadge from "./components/PrivacyBadge";
import ThemeToggle from "./components/ThemeToggle";
import Toolbar from "./components/Toolbar";
import SourcePanel from "./components/SourcePanel";
import MessageTabs from "./components/MessageTabs";
import RawPanel from "./components/RawPanel";
import StructuredView from "./components/StructuredView";
import BottomPanel from "./components/BottomPanel";
import DeidentifyDialog from "./components/DeidentifyDialog";

function EmptyHint() {
  return (
    <div class="grid h-full place-items-center p-6 text-center text-sm text-slate-400 dark:text-slate-500">
      Paste an HL7 v2.x message in the Source panel to begin.
    </div>
  );
}

function PanelHeader(props: { title: string }) {
  return (
    <div class="border-b border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500">
      {props.title}
    </div>
  );
}

export default function App() {
  const [deidOpen, setDeidOpen] = createSignal(false);
  const hasMessages = () => store.messageCount() > 0;

  return (
    <div class="flex h-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <div class="flex items-center gap-2.5">
          <div class="grid h-8 w-8 place-items-center rounded-md bg-prc-600 text-white shadow-sm">
            <Activity size={18} />
          </div>
          <div class="leading-tight">
            <div class="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
              HL7 Workbench
            </div>
            <div class="text-[11px] text-slate-400 dark:text-slate-500">Viewer &amp; Editor</div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Show when={hasMessages()}>
            <Toolbar onOpenDeidentify={() => setDeidOpen(true)} />
            <div class="mx-1 hidden h-5 w-px bg-slate-200 sm:block dark:bg-slate-700" />
          </Show>
          <PrivacyBadge />
          <ThemeToggle />
        </div>
      </header>

      <div class="flex min-h-0 flex-1 flex-col">
        <MessageTabs />
        <main class="flex min-h-0 flex-1">
          <div class="w-[26%] min-w-[240px] max-w-[440px] shrink-0 border-r border-slate-200 dark:border-slate-700">
            <SourcePanel />
          </div>

          <section class="flex min-w-0 flex-1 flex-col border-r border-slate-200 dark:border-slate-700">
            <PanelHeader title="Structure" />
            <div class="min-h-0 flex-1">
              <Show when={store.activeMessage()} fallback={<EmptyHint />}>
                {(m) => <StructuredView message={m()} />}
              </Show>
            </div>
          </section>

          <div class="flex w-[34%] min-w-[300px] shrink-0 flex-col">
            <Show
              when={store.activeMessage()}
              fallback={
                <>
                  <PanelHeader title="Raw" />
                  <EmptyHint />
                </>
              }
            >
              {(m) => <RawPanel message={m()} />}
            </Show>
          </div>
        </main>

        <Show when={hasMessages()}>
          <BottomPanel />
        </Show>
      </div>

      <DeidentifyDialog open={deidOpen()} onClose={() => setDeidOpen(false)} />
    </div>
  );
}
