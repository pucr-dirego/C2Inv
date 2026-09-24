import { cn } from "../../lib/cn";
export function Skeleton({className}:{className?:string}){return <div className={cn("animate-pulse rounded-[12px] bg-gradient-to-r from-black/[0.045] via-black/[0.07] to-black/[0.045]",className)}/>}
