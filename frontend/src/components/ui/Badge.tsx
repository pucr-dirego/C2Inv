import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
type Tone="neutral"|"accent"|"success"|"warning"|"danger";
const tones:Record<Tone,string>={neutral:"bg-black/[0.05] text-(--text-secondary)",accent:"bg-blue-500/10 text-blue-600",success:"bg-green-500/10 text-green-700",warning:"bg-amber-500/12 text-amber-700",danger:"bg-red-500/10 text-red-600"};
export function Badge({children,tone="neutral",className}:{children:ReactNode;tone?:Tone;className?:string}){return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.01em]",tones[tone],className)}>{children}</span>}
