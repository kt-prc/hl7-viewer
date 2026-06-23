/**
 * A vertical drag handle between two columns. Reports the pointer's clientX
 * during a drag; the parent decides how to translate that into a column width.
 */
export default function Splitter(props: { onResize: (clientX: number) => void; title?: string }) {
  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    const move = (ev: PointerEvent) => props.onResize(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      title={props.title}
      class="relative w-px shrink-0 cursor-col-resize bg-slate-200 transition-colors hover:bg-prc-400 dark:bg-slate-700 dark:hover:bg-prc-300"
      onPointerDown={onPointerDown}
    >
      {/* Widened, transparent hit area so the 1px line is easy to grab. */}
      <div class="absolute inset-y-0 -left-1.5 -right-1.5 z-20" />
    </div>
  );
}
