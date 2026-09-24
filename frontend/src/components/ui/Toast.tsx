import { motion } from "motion/react";
import { CheckCircle2,CircleAlert,Info,TriangleAlert,X } from "lucide-react";
import { IconButton } from "./IconButton";
export type ToastTone="info"|"success"|"warning"|"danger";
export interface ToastData{id:string;title:string;description?:string;tone?:ToastTone}
const icons={info:Info,success:CheckCircle2,warning:TriangleAlert,danger:CircleAlert};
export function Toast({id,title,description,tone="info",onClose}:ToastData&{onClose:(id:string)=>void}){const Glyph=icons[tone];return <motion.div layout initial={{opacity:0,y:-12,scale:.97}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-8,scale:.97}} transition={{duration:.2}} className="flex w-[360px] max-w-[calc(100vw-32px)] gap-3 rounded-[18px] border border-white/60 bg-white/88 p-3.5 shadow-[var(--shadow-floating)] backdrop-blur-3xl"><Glyph size={18} className="mt-0.5 shrink-0 text-(--accent)"/><div className="min-w-0 flex-1"><div className="text-sm font-semibold tracking-[-0.01em]">{title}</div>{description&&<div className="mt-0.5 text-xs leading-5 text-(--text-secondary)">{description}</div>}</div><IconButton label="Cerrar" size="sm" onClick={()=>onClose(id)} className="border-transparent bg-transparent shadow-none"><X size={15}/></IconButton></motion.div>}
