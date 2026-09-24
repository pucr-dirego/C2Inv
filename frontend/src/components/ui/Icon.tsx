import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/cn";
export function Icon({icon:Glyph,size=18,strokeWidth=1.8,className}:{icon:LucideIcon;size?:number;strokeWidth?:number;className?:string}){return <Glyph size={size} strokeWidth={strokeWidth} aria-hidden="true" className={cn("shrink-0",className)}/>}
