import { cn } from "../../lib/cn";

const sizes = { sm: "h-3.5 w-3.5", md: "h-4.5 w-4.5", lg: "h-6 w-6" };
export function Spinner({ size = "md", className }: { size?: keyof typeof sizes; className?: string }) {
  return <span role="status" aria-label="Cargando" className={cn("inline-block animate-spin rounded-full border-2 border-current border-r-transparent", sizes[size], className)} />;
}
