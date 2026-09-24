import type { ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { NavHomeBrand } from "../../../../components/navigation/NavHomeBrand";
import { LiquidGlass } from "../../../../components/ui/LiquidGlass";
import { IconButton } from "../../../../components/ui/IconButton";

import {
  EquipmentStepNav,
  type EquipmentStep,
} from "./EquipmentStepNav";

interface EquipmentFormShellProps {
  children: ReactNode;
  preview: ReactNode;
  steps: EquipmentStep[];
  currentStep: number;
  completedSteps?: ReadonlySet<number>;
  onStepChange?: (index: number) => void;
}

export function EquipmentFormShell({
  children,
  preview,
  steps,
  currentStep,
  completedSteps,
  onStepChange,
}: EquipmentFormShellProps) {
  const navigate = useNavigate();

  return (
    <main className="equipment-create relative min-h-screen overflow-x-hidden pb-10">
      <div className="equipment-create-grid pointer-events-none absolute inset-x-0 top-0 h-[720px] opacity-80" />

      <div className="pointer-events-none absolute left-[-14%] top-[-15%] h-[520px] w-[520px] rounded-full bg-blue-500/[0.065] blur-[100px]" />

      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-4">
        <LiquidGlass
          strength="clear"
          className="mx-auto flex max-w-[1360px] items-center justify-between rounded-[22px] px-3 py-2.5 sm:px-4"
        >
          <div className="flex items-center gap-3">
            <IconButton
              label="Volver"
              size="sm"
              onClick={() =>
                navigate("/forms")
              }
            >
              <ArrowLeft size={15} />
            </IconButton>

            <NavHomeBrand compact />

            <div className="hidden border-l border-black/[0.07] pl-3 sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-(--text-tertiary)">
                Forms
              </div>

              <div className="text-xs font-semibold">
                Alta de equipo
              </div>
            </div>
          </div>

          <IconButton
            label="Cerrar"
            size="sm"
            onClick={() =>
              navigate("/")
            }
          >
            <X size={15} />
          </IconButton>
        </LiquidGlass>
      </header>

      <div className="relative z-10 mx-auto mt-6 max-w-[1360px] px-4 sm:px-6">
        <div className="rounded-[24px] border border-black/[0.055] bg-white/62 p-4 shadow-sm backdrop-blur-xl">
          <EquipmentStepNav
            steps={steps}
            current={currentStep}
            completedSteps={
              completedSteps
            }
            onStepChange={
              onStepChange
            }
          />
        </div>

        <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="min-w-0">
            {children}
          </section>

          <aside className="hidden xl:block">
            {preview}
          </aside>
        </div>
      </div>
    </main>
  );
}
