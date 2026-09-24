import {
  ArrowLeft,
  ArrowUpRight,
  FilePlus2,
  Laptop2,
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

import { BrandMark } from "../../../components/brand/BrandMark";
import { Button } from "../../../components/ui/Button";
import { LiquidGlass } from "../../../components/ui/LiquidGlass";

export function FormsHomePage() {
  const navigate = useNavigate();

  return (
    <main className="relative min-h-screen overflow-hidden px-5 pb-12 pt-5 sm:px-8">
      <div className="pointer-events-none absolute left-[-12%] top-[-18%] h-[560px] w-[560px] rounded-full bg-blue-500/[0.065] blur-[100px]" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-10%] h-[520px] w-[520px] rounded-full bg-violet-500/[0.045] blur-[110px]" />

      <LiquidGlass
        strength="clear"
        className="relative z-10 mx-auto flex max-w-[1180px] items-center justify-between rounded-[22px] px-4 py-3"
      >
        <BrandMark />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          leftIcon={<ArrowLeft size={15} />}
        >
          Inicio
        </Button>
      </LiquidGlass>

      <div className="relative z-10 mx-auto mt-16 max-w-[1180px]">
        <div className="max-w-3xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.17em] text-(--text-tertiary)">
            Forms
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-[clamp(3.2rem,7vw,6.5rem)] font-semibold leading-[0.91] tracking-[-0.075em]"
          >
            Alimenta el sistema
            <span className="block text-(--text-secondary)">desde el origen.</span>
          </motion.h1>

          <p className="mt-6 max-w-xl text-[16px] leading-7 text-(--text-secondary)">
            Empieza por el dato correcto. Cada alta se convierte después en visibilidad para toda la operación.
          </p>
        </div>

        <div className="mt-12 grid gap-3 lg:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate("/forms/equipos/nuevo")}
            className="group relative min-h-[430px] overflow-hidden rounded-[32px] bg-[#0b0b0d] p-8 text-left text-white shadow-[0_28px_70px_rgba(0,0,0,.12)]"
          >
            <div className="absolute right-[-60px] top-[-80px] h-72 w-72 rounded-full bg-blue-500/20 blur-[90px]" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-white/[0.09]">
                <Laptop2 size={22} strokeWidth={1.55} />
              </div>

              <div className="mt-auto">
                <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/35">
                  Disponible
                </div>

                <h2 className="mt-3 text-[42px] font-semibold leading-none tracking-[-0.055em]">
                  Alta de equipo
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-white/46">
                  Registra identificación, datos técnicos, ubicación, estado y adquisición.
                </p>

                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-400">
                  Comenzar
                  <ArrowUpRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </div>
              </div>
            </div>
          </button>

          <div className="relative min-h-[430px] overflow-hidden rounded-[32px] bg-[#f5f5f7] p-8">
            <div className="absolute right-[-50px] top-[-70px] h-72 w-72 rounded-full bg-violet-500/[0.08] blur-[90px]" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-black/[0.055]">
                <FilePlus2 size={22} strokeWidth={1.55} />
              </div>

              <div className="mt-auto">
                <div className="text-[11px] font-semibold uppercase tracking-[0.15em] text-(--text-tertiary)">
                  Siguiente
                </div>

                <h2 className="mt-3 text-[42px] font-semibold leading-none tracking-[-0.055em]">
                  Alta de proveedor
                </h2>

                <p className="mt-3 max-w-md text-sm leading-6 text-(--text-secondary)">
                  Este será el siguiente formulario que migremos.
                </p>

                <div className="mt-6 text-sm font-semibold text-(--text-tertiary)">
                  Próximamente
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
