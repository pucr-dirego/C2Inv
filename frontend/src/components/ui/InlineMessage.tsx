import type { ReactNode } from "react";
import { AlertCircle,CheckCircle2,Info,TriangleAlert } from "lucide-react";
import { cn } from "../../lib/cn";
type Tone="info"|"success"|"warning"|"danger";
const config={info:{icon:Info,classes:"border-blue-500/10 bg-blue-500/[0.06] text-blue-700"},success:{icon:CheckCircle2,classes:"border-green-500/10 bg-green-500/[0.06] text-green-700"},warning:{icon:TriangleAlert,classes:"border-amber-500/10 bg-amber-500/[0.07] text-amber-800"},danger:{icon:AlertCircle,classes:"border-red-500/10 bg-red-500/[0.06] text-red-700"}};
export function InlineMessage({children,tone="info",title}:{children:ReactNode;tone?:Tone;title?:string}){const item=config[tone];const Glyph=item.icon;return <div className={cn("flex gap-3 rounded-[16px] border p-3.5",item.classes)}><Glyph size={17} className="mt-0.5 shrink-0"/><div className="min-w-0">{title&&<div className="text-sm font-semibold">{title}</div>}<div className="text-sm leading-5 opacity-90">{children}</div></div></div>}
