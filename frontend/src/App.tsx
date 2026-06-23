import { Show, createSignal } from "solid-js";
import { Activity, PanelLeftOpen } from "lucide-solid";
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
import Splitter from "./components/Splitter";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
/** Min width reserved for the centre Structure column while dragging. */
const STRUCTURE_MIN = 320;

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

function CollapsedSourceRail(props: { onExpand: () => void }) {
  return (
    <div class="flex w-9 shrink-0 flex-col items-center gap-2 border-r border-slate-200 bg-white py-2 dark:border-slate-700 dark:bg-slate-900">
      <button
        class="grid h-7 w-7 place-items-center rounded text-slate-500 hover:bg-slate-100 hover:text-prc-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-prc-100"
        title="Expand source panel"
        onClick={props.onExpand}
      >
        <PanelLeftOpen size={16} />
      </button>
      <span class="select-none text-[11px] font-semibold uppercase tracking-wide text-slate-400 [writing-mode:vertical-rl] dark:text-slate-500">
        Source
      </span>
    </div>
  );
}

export default function App() {
  const [deidOpen, setDeidOpen] = createSignal(false);
  const [sourceCollapsed, setSourceCollapsed] = createSignal(false);
  const [sourceWidth, setSourceWidth] = createSignal(300);
  const [rawWidth, setRawWidth] = createSignal(400);
  const hasMessages = () => store.messageCount() > 0;

  let mainRef: HTMLElement | undefined;

  const resizeSource = (clientX: number) => {
    const rect = mainRef?.getBoundingClientRect();
    if (!rect) return;
    const max = rect.width - rawWidth() - STRUCTURE_MIN;
    setSourceWidth(clamp(clientX - rect.left, 180, Math.max(180, max)));
  };
  const resizeRaw = (clientX: number) => {
    const rect = mainRef?.getBoundingClientRect();
    if (!rect) return;
    const usedLeft = sourceCollapsed() ? 36 : sourceWidth();
    const max = rect.width - usedLeft - STRUCTURE_MIN;
    setRawWidth(clamp(rect.right - clientX, 240, Math.max(240, max)));
  };

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
        <main ref={mainRef} class="flex min-h-0 flex-1">
          <Show
            when={!sourceCollapsed()}
            fallback={<CollapsedSourceRail onExpand={() => setSourceCollapsed(false)} />}
          >
            <>
              <div class="shrink-0" style={{ width: `${sourceWidth()}px` }}>
                <SourcePanel onCollapse={() => setSourceCollapsed(true)} />
              </div>
              <Splitter title="Drag to resize the Source column" onResize={resizeSource} />
            </>
          </Show>

          <section class="flex min-w-0 flex-1 flex-col">
            <PanelHeader title="Structure" />
            <div class="min-h-0 flex-1">
              <Show when={store.activeMessage()} fallback={<EmptyHint />}>
                {(m) => <StructuredView message={m()} />}
              </Show>
            </div>
          </section>

          <Splitter title="Drag to resize the Raw column" onResize={resizeRaw} />

          <div class="flex shrink-0 flex-col" style={{ width: `${rawWidth()}px` }}>
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
