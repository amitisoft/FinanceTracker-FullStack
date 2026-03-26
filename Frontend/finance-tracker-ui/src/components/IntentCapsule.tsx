import { motion, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Props = {
  label: string;
  loadingLabel?: string;
  disabled?: boolean;
  onComplete: () => void;
};

export default function IntentCapsule({
  label,
  loadingLabel = "Entering...",
  disabled,
  onComplete,
}: Props) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleStart = () => {
    if (disabled) return;

    clearTimer();
    intervalRef.current = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev + 6;
        if (next >= 100) {
          clearTimer();
          onComplete();
          return 100;
        }
        return next;
      });
    }, 18);
  };

  const handleEnd = () => {
    if (progress >= 100) return;
    clearTimer();
    animate(progress, 0, {
      duration: 0.28,
      onUpdate: (value) => setProgress(Number(value.toFixed(0))),
    });
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      className="relative w-full overflow-hidden rounded-full border border-white/10 bg-white/10 px-4 py-4 text-white transition disabled:opacity-50"
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400/40 via-violet-500/35 to-fuchsia-500/40"
        animate={{ width: `${progress}%` }}
        transition={{ ease: "easeOut", duration: 0.12 }}
      />

      <div className="absolute inset-0 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.12)]" />

      <span className="relative z-10 text-base font-medium">
        {progress > 0 && progress < 100 ? loadingLabel : label}
      </span>
    </button>
  );
}