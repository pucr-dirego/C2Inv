import { createContext,useCallback,useContext,useMemo,useState,type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import { Toast,type ToastData } from "./Toast";
interface Ctx{pushToast:(toast:Omit<ToastData,"id">)=>void}
const ToastContext=createContext<Ctx|null>(null);
export function ToastProvider({children}:{children:ReactNode}){const[toasts,setToasts]=useState<ToastData[]>([]);const removeToast=useCallback((id:string)=>setToasts(c=>c.filter(t=>t.id!==id)),[]);const pushToast=useCallback((toast:Omit<ToastData,"id">)=>{const id=crypto.randomUUID();setToasts(c=>[...c,{id,...toast}]);window.setTimeout(()=>removeToast(id),4200)},[removeToast]);const value=useMemo(()=>({pushToast}),[pushToast]);return <ToastContext.Provider value={value}>{children}<div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2"><AnimatePresence initial={false}>{toasts.map(t=><div key={t.id} className="pointer-events-auto"><Toast {...t} onClose={removeToast}/></div>)}</AnimatePresence></div></ToastContext.Provider>}
export function useToast(){const c=useContext(ToastContext);if(!c)throw new Error("useToast debe usarse dentro de ToastProvider.");return c}
