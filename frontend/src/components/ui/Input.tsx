import { forwardRef, type InputHTMLAttributes, type ReactNode, useId } from "react";
import { cn } from "../../lib/cn";
interface Props extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; hint?: string; leftIcon?: ReactNode; rightSlot?: ReactNode }
export const Input = forwardRef<HTMLInputElement,Props>(({ label,error,hint,leftIcon,rightSlot,className,id,...props },ref) => {
  const generated = useId();
  const inputId = id ?? generated;
  return <div className="w-full">
    {label && <label htmlFor={inputId} className="mb-2 block text-[13px] font-medium tracking-[-0.01em] text-(--text-secondary)">{label}</label>}
    <div className={cn("group flex min-h-12 items-center rounded-(--radius-control) border bg-white/72 px-3.5 shadow-[0_1px_2px_rgba(0,0,0,.02)] backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-200 focus-within:bg-white/92 focus-within:ring-4", error ? "border-red-500/35 focus-within:ring-red-500/10" : "border-black/[0.07] focus-within:border-blue-500/30 focus-within:ring-(--accent-soft)")}>
      {leftIcon && <span className="mr-2.5 flex shrink-0 items-center text-(--text-tertiary)">{leftIcon}</span>}
      <input ref={ref} id={inputId} className={cn("min-w-0 flex-1 bg-transparent text-[15px] tracking-[-0.01em] text-(--text-primary) outline-none placeholder:text-black/30",className)} {...props}/>
      {rightSlot && <span className="ml-2 flex shrink-0 items-center">{rightSlot}</span>}
    </div>
    {(error||hint) && <p className={cn("mt-1.5 text-xs leading-5",error?"text-(--danger)":"text-(--text-tertiary)")}>{error??hint}</p>}
  </div>;
});
Input.displayName="Input";
