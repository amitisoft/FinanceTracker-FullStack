import type { ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function GlassCard({ children, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={clsx(
        "glass-card rounded-[28px]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}