import { cn } from "../../lib/cn";
type Tone="success"|"warning"|"danger"|"neutral";
const tones:Record<Tone,string>={success:"bg-(--success)",warning:"bg-(--warning)",danger:"bg-(--danger)",neutral:"bg-black/25"};
export function StatusIndicator({label,tone="success",pulse=false}:{label:string;tone?:Tone;pulse?:boolean}){return <span className="inline-flex items-center gap-2 text-xs font-medium text-(--text-secondary)"><span className="relative inline-flex h-2.5 w-2.5">{pulse&&<span className={cn("absolute inset-0 animate-ping rounded-full opacity-25",tones[tone])}/>}<span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full",tones[tone])}/></span>{label}</span>}
