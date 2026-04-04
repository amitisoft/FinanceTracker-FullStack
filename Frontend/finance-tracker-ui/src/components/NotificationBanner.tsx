import clsx from "clsx";
import { bannerStore } from "../store/bannerStore";

const toneStyles: Record<string, string> = {
  info: "border-cyan-400/20 bg-cyan-500/10 text-cyan-50",
  success: "border-emerald-400/20 bg-emerald-500/10 text-emerald-50",
  warning: "border-amber-400/25 bg-amber-500/10 text-amber-50",
  error: "border-rose-400/25 bg-rose-500/10 text-rose-50",
};

export default function NotificationBanner() {
  const { message, description, variant, visible, clearBanner } = bannerStore();

  if (!visible) return null;

  const style = toneStyles[variant] ?? toneStyles.info;
  const role = variant === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      aria-live={variant === "error" ? "assertive" : "polite"}
      className={clsx(
        "mb-5 flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 text-sm shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
        style
      )}
    >
      <div className="space-y-1">
        <p className="font-semibold">{message}</p>
        {description ? <p className="text-xs text-white/70">{description}</p> : null}
      </div>
      <button
        type="button"
        onClick={clearBanner}
        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/80 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
        aria-label="Dismiss notification"
      >
        Dismiss
      </button>
    </div>
  );
}
