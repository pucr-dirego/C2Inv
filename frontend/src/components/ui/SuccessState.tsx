import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
export function SuccessState({title,description}:{title:string;description?:ReactNode}){return <div className="flex flex-col items-center text-center"><motion.div initial={{scale:.7,opacity:0}} animate={{scale:1,opacity:1}} transition={{type:"spring",stiffness:360,damping:24}} className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-600"><Check size={24}/></motion.div><h3 className="mt-4 text-xl font-semibold tracking-[-0.03em]">{title}</h3>{description&&<div className="mt-2 max-w-sm text-sm leading-6 text-(--text-secondary)">{description}</div>}</div>}
