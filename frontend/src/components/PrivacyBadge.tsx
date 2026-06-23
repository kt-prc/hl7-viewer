/** A persistent reassurance that nothing is uploaded. */
export default function PrivacyBadge() {
  return (
    <div
      class="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200"
      title="This app is a static page. It makes no network requests with your HL7 data — parsing, editing and de-identification all happen in this browser tab."
    >
      <span aria-hidden="true">🔒</span>
      100% in your browser — nothing is uploaded
    </div>
  );
}
