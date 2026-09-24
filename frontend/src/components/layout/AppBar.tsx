import type { ReactNode } from "react";
import { BrandMark } from "../brand/BrandMark";
import { Surface } from "../ui/Surface";
export function AppBar({actions}:{actions?:ReactNode}){return <div className="sticky top-0 z-40 p-3"><Surface material="glass" radius="large" className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3"><BrandMark/><div className="flex items-center gap-2">{actions}</div></Surface></div>}
