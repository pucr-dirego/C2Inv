import { Search, X } from "lucide-react";
import { Input } from "./Input";
import { IconButton } from "./IconButton";
export function SearchField({value,onChange,placeholder="Buscar"}:{value:string;onChange:(value:string)=>void;placeholder?:string}){return <Input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} leftIcon={<Search size={16}/>} rightSlot={value?<IconButton label="Limpiar búsqueda" size="sm" onClick={()=>onChange("")} className="border-transparent bg-transparent shadow-none"><X size={15}/></IconButton>:null}/>}
