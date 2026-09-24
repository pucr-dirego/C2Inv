import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { Input } from "./Input";
import { IconButton } from "./IconButton";
interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>,"type"> { label?: string; error?: string; hint?: string }
export const PasswordInput = forwardRef<HTMLInputElement,Props>(({ label="Contraseña",error,hint,...props },ref) => {
  const [visible,setVisible]=useState(false);
  return <Input ref={ref} type={visible?"text":"password"} label={label} error={error} hint={hint} leftIcon={<LockKeyhole size={17} strokeWidth={1.75}/>} rightSlot={<IconButton type="button" label={visible?"Ocultar contraseña":"Mostrar contraseña"} size="sm" onClick={()=>setVisible(v=>!v)} className="border-transparent bg-transparent shadow-none hover:bg-black/[0.045]">{visible?<EyeOff size={16}/>:<Eye size={16}/>}</IconButton>} {...props}/>;
});
PasswordInput.displayName="PasswordInput";
