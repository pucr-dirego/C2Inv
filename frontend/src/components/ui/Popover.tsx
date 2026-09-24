import { AnimatePresence,motion } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
export function Popover({open,children,className}:{open:boolean;children:ReactNode;className?:string}){return <AnimatePresence>{open&&<motion.div initial={{opacity:0,y:-4,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-4,scale:.98}} transition={{duration:.15}} className={cn("rounded-[16px] border border-white/60 bg-white/92 p-3 shadow-[var(--shadow-floating)] backdrop-blur-3xl",className)}>{children}</motion.div>}</AnimatePresence>}
