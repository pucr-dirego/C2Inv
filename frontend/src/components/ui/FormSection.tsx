import type { ReactNode } from "react";
import { Surface } from "./Surface";
export function FormSection({title,description,children}:{title:string;description?:string;children:ReactNode}){return <Surface material="raised" className="p-5 sm:p-6"><div className="mb-5"><h3 className="text-lg font-semibold tracking-[-0.03em]">{title}</h3>{description&&<p className="mt-1 text-sm leading-6 text-(--text-secondary)">{description}</p>}</div>{children}</Surface>}
