import { ShieldCheck } from "lucide-solid";

/** A subtle, persistent reassurance that nothing is uploaded. */
export default function PrivacyBadge() {
  return (
    <div
      class="inline-flex items-center gap-1.5 rounded-md bg-grn-50 px-2 py-1 text-xs font-medium text-grn-700 ring-1 ring-grn-200 dark:bg-grn-700/20 dark:text-grn-300 dark:ring-grn-700/40"
      title="This app is a static page. It makes no network requests with your HL7 data — parsing, editing and de-identification all happen in this browser tab."
    >
      <ShieldCheck size={14} />
      <span class="hidden sm:inline">Stays in your browser</span>
    </div>
  );
}
