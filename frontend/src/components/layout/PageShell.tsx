import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
export function PageShell({children,className}:{children:ReactNode;className?:string}){return <div className={cn("min-h-screen bg-transparent text-(--text-primary)",className)}>{children}</div>}
