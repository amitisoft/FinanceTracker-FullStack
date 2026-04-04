import { motion, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  loadingLabel?: string;
  disabled?: boolean;
  onComplete: () => void;
  tone?: "dark" | "light";
};

export default function IntentCapsule({
  label,
  loadingLabel = "Entering...",
  disabled,
  onComplete,
  tone = "dark",
}: Props) {
  const [progress, setProgress] = useState(0);
  const completedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const holdingRef = useRef(false);

  const clearRaf = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const tick = () => {
    if (!holdingRef.current || disabled) {
      clearRaf();
      return;
    }

    const now = performance.now();
    const start = startRef.current ?? now;
    startRef.current = start;

    const holdDurationMs = 380;
    const next = Math.min(100, Math.round(((now - start) / holdDurationMs) * 100));
    setProgress(next);

    if (next >= 100) {
      holdingRef.current = false;
      clearRaf();
      completedRef.current = true;
      onComplete();
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  };

  const handleStart = () => {
    if (disabled) return;
    if (completedRef.current) return;
    if (holdingRef.current) return;

    holdingRef.current = true;
    startRef.current = performance.now() - (progress / 100) * 650;
    clearRaf();
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleEnd = () => {
    if (completedRef.current) return;
    holdingRef.current = false;
    clearRaf();
    animate(progress, 0, {
      duration: 0.2,
      onUpdate: (value) => setProgress(Number(value.toFixed(0))),
      onComplete: () => {
        startRef.current = null;
      },
    });
  };

  useEffect(() => {
    return () => clearRaf();
  }, []);

  useEffect(() => {
    if (!disabled && progress >= 100) {
      setProgress(0);
      startRef.current = null;
    }
  }, [disabled, progress]);

  useEffect(() => {
    if (progress === 0) {
      completedRef.current = false;
    }
  }, [progress]);

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLButtonElement).setPointerCapture?.(e.pointerId);
        handleStart();
      }}
      onPointerUp={(e) => {
        (e.currentTarget as HTMLButtonElement).releasePointerCapture?.(e.pointerId);
        handleEnd();
      }}
      onPointerCancel={(e) => {
        (e.currentTarget as HTMLButtonElement).releasePointerCapture?.(e.pointerId);
        handleEnd();
      }}
      onBlur={handleEnd}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleStart();
        }
      }}
      onKeyUp={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleEnd();
        }
      }}
      className={
        tone === "light"
          ? "relative w-full overflow-hidden rounded-full border border-slate-900/10 bg-slate-900/5 px-4 py-4 text-slate-900 transition disabled:opacity-50"
          : "relative w-full overflow-hidden rounded-full border border-white/10 bg-white/10 px-4 py-4 text-white transition disabled:opacity-50"
      }
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400/40 via-violet-500/35 to-fuchsia-500/40"
        animate={{ width: `${progress}%` }}
        transition={{ ease: "easeOut", duration: 0.12 }}
      />

      <div
        className={
          tone === "light"
            ? "absolute inset-0 rounded-full shadow-[0_0_28px_rgba(34,211,238,0.10)]"
            : "absolute inset-0 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.12)]"
        }
      />

      <span className="relative z-10 text-base font-medium">
        {progress > 0 && progress < 100 ? loadingLabel : label}
      </span>
    </button>
  );
}
