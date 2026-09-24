import type { ReactNode } from "react";
export function FormField({label,description,children}:{label:string;description?:string;children:ReactNode}){return <div><div className="mb-2.5"><div className="text-[13px] font-medium text-(--text-secondary)">{label}</div>{description&&<div className="mt-0.5 text-xs leading-5 text-(--text-tertiary)">{description}</div>}</div>{children}</div>}
