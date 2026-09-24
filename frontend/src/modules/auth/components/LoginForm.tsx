import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight,Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { loginSchema,type LoginFormValues } from "../schemas/auth.schema";
export function LoginForm({loading,error,onSubmit}:{loading:boolean;error?:string|null;onSubmit:(values:LoginFormValues)=>Promise<void>}){const{register,handleSubmit,formState:{errors}}=useForm<LoginFormValues>({resolver:zodResolver(loginSchema),defaultValues:{correo:"",password:""}});return <form onSubmit={handleSubmit(onSubmit)} className="space-y-4"><Input label="Correo electrónico" type="email" autoComplete="email" placeholder="nombre@empresa.com" leftIcon={<Mail size={17}/>} error={errors.correo?.message} {...register("correo")}/><PasswordInput autoComplete="current-password" placeholder="Tu contraseña" error={errors.password?.message} {...register("password")}/>{error&&<InlineMessage tone="danger">{error}</InlineMessage>}<Button type="submit" size="lg" loading={loading} rightIcon={<ArrowRight size={17}/>} className="mt-2 w-full">Iniciar sesión</Button></form>}
