import { motion } from "framer-motion";
import clsx from "clsx";
import { forwardRef, useId, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  tone?: "dark" | "light";
};

const NeonInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, tone = "dark", ...props }, ref) => {
    const generatedId = useId();
    const inputId = props.id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div className="space-y-2">
        <label
          htmlFor={inputId}
          className={clsx(
            "block text-sm font-medium",
            tone === "light" ? "text-slate-900/80" : "text-white/80"
          )}
        >
          {label}
        </label>

        <motion.input
          ref={ref}
          whileFocus={{ scale: 1.01 }}
          {...props}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={clsx(
            "w-full rounded-2xl border px-4 py-4 text-base outline-none transition",
            tone === "light"
              ? "bg-slate-900/[0.04] text-slate-900 placeholder:text-slate-900/40 focus:bg-slate-900/[0.06] focus:shadow-[0_0_0_1px_rgba(34,211,238,0.20),0_0_22px_rgba(34,211,238,0.10)]"
              : "bg-white/8 text-white placeholder:text-white/35 focus:bg-white/10 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.18),0_0_24px_rgba(34,211,238,0.08)]",
            error
              ? "border-rose-400/50 focus:border-rose-400"
              : tone === "light"
                ? "border-slate-900/10 focus:border-cyan-600/40"
                : "border-white/10 focus:border-cyan-300/40",
            className
          )}
        />

        {error ? (
          <p id={errorId} className="text-sm text-rose-300">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

NeonInput.displayName = "NeonInput";

export default NeonInput;
