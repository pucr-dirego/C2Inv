import { SegmentedControl } from "../../../components/ui/SegmentedControl";
export type AuthMode="login"|"register";
export function AuthModeSwitch({value,onChange}:{value:AuthMode;onChange:(mode:AuthMode)=>void}){return <SegmentedControl value={value} onChange={onChange} options={[{value:"login",label:"Iniciar sesión"},{value:"register",label:"Crear cuenta"}]} className="w-full"/>}
