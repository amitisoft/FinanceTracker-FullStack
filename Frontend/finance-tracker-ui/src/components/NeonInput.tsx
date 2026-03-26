import { motion } from "framer-motion";
import clsx from "clsx";
import { forwardRef, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const NeonInput = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/80">
          {label}
        </label>

        <motion.input
          ref={ref}
          whileFocus={{ scale: 1.01 }}
          {...props}
          className={clsx(
            "w-full rounded-2xl border bg-white/8 px-4 py-4 text-base text-white outline-none transition",
            "placeholder:text-white/35 focus:bg-white/10 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.18),0_0_24px_rgba(34,211,238,0.08)]",
            error
              ? "border-rose-400/50 focus:border-rose-400"
              : "border-white/10 focus:border-cyan-300/40",
            className
          )}
        />

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      </div>
    );
  }
);

NeonInput.displayName = "NeonInput";

export default NeonInput;