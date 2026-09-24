import { motion } from "motion/react";
import { cn } from "../../lib/cn";
export function Progress({value,className}:{value:number;className?:string}){const n=Math.max(0,Math.min(100,value));return <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-black/[0.055]",className)}><motion.div initial={false} animate={{width:`${n}%`}} transition={{duration:.35,ease:[.22,1,.36,1]}} className="h-full rounded-full bg-(--accent)"/></div>}
