import { ArrowLeft, FilePlus2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { BrandMark } from "../components/brand/BrandMark";
import { Button } from "../components/ui/Button";
import { Surface } from "../components/ui/Surface";

export function FormsPlaceholderPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-xl">
        <div className="mb-6"><BrandMark /></div>
        <Surface material="floating" radius="large" className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-blue-500/[0.09] text-blue-600"><FilePlus2 size={24} strokeWidth={1.6} /></div>
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em]">Forms es el siguiente paso.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-(--text-secondary)">El Landing ya está listo para llevarte a Alta de Equipo y Alta de Proveedor. Aquí construiremos ese módulo a continuación.</p>
          <Button variant="secondary" className="mt-6" onClick={() => navigate("/")} leftIcon={<ArrowLeft size={15} />}>Volver al inicio</Button>
        </Surface>
      </motion.div>
    </main>
  );
}
