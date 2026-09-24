import type { ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "../../../../lib/cn";

interface EquipmentSectionCardProps {
  id: string;
  number: string;
  title: string;
  fields: string[];
  summary?: string;
  active: boolean;
  complete: boolean;
  onOpen: () => void;
  children: ReactNode;
}

export function EquipmentSectionCard({
  id,
  number,
  title,
  fields,
  summary,
  active,
  complete,
  onOpen,
  children,
}: EquipmentSectionCardProps) {
  return (
    <motion.section
      id={id}
      layout="position"
      className={cn(
        "equipment-section-card scroll-mt-[156px] overflow-hidden rounded-[26px] border transition-[border-color,box-shadow,background-color] duration-300",
        active
          ? "border-black/[0.065] bg-white/88 shadow-[0_18px_55px_rgba(0,0,0,.07)]"
          : "border-black/[0.05] bg-white/48 hover:bg-white/68",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-expanded={active}
        className="flex w-full items-center gap-4 px-5 py-4 text-left outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-(--accent-soft) sm:px-6"
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
            complete
              ? "bg-(--accent) text-white"
              : active
                ? "bg-black text-white"
                : "bg-black/[0.05] text-(--text-tertiary)",
          )}
        >
          {complete ? <Check size={14} strokeWidth={2.2} /> : number}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold tracking-[-0.02em]">
            {title}
          </span>
          {!active && (
            <span className="mt-1 block truncate text-[11px] text-(--text-tertiary)">
              {summary || fields.join(" · ")}
            </span>
          )}
        </span>

        <motion.span
          animate={{ rotate: active ? 180 : 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-(--text-tertiary)"
        >
          <ChevronDown size={17} strokeWidth={1.7} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {active && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
              opacity: { duration: 0.18 },
            }}
          >
            <motion.div
              initial={{ y: 8 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="border-t border-black/[0.05] px-5 pb-6 pt-5 sm:px-6 sm:pb-7"
            >
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
