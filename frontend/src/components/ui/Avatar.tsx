import { cn } from "../../lib/cn";
const sizes={sm:"h-8 w-8 text-[11px]",md:"h-10 w-10 text-xs",lg:"h-12 w-12 text-sm"};
function initials(name:string){return name.trim().split(/\s+/).slice(0,2).map(p=>p.charAt(0).toUpperCase()).join("")}
export function Avatar({name,size="md",className}:{name:string;size?:keyof typeof sizes;className?:string}){return <div title={name} className={cn("flex items-center justify-center rounded-full border border-white/70 bg-gradient-to-br from-white to-black/[0.06] font-semibold text-(--text-secondary) shadow-sm",sizes[size],className)}>{initials(name)}</div>}
