import { Check } from "lucide-react";

import { Button } from "../../../../components/ui/Button";
import { LiquidGlass } from "../../../../components/ui/LiquidGlass";
import { Progress } from "../../../../components/ui/Progress";

interface EquipmentSaveBarProps {
  complete: number;
  total: number;
  missing: string[];
  submitting: boolean;
}

export function EquipmentSaveBar({
  complete,
  total,
  missing,
  submitting,
}: EquipmentSaveBarProps) {
  const percentage = total ? (complete / total) * 100 : 0;

  return (
    <div className="sticky bottom-3 z-30 mt-7">
      <LiquidGlass
        strength="clear"
        className="flex flex-col gap-3 rounded-[22px] p-3 sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="min-w-0 flex-1 px-1 sm:px-2">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-semibold">
              {complete} de {total} datos requeridos
            </div>
            <div className="text-[10px] text-(--text-tertiary)">
              {Math.round(percentage)}%
            </div>
          </div>

          <Progress value={percentage} className="mt-2" />

          {missing.length > 0 && (
            <div className="mt-2 truncate text-[10px] text-(--text-tertiary)">
              Falta: {missing.slice(0, 4).join(" · ")}
              {missing.length > 4 ? " · …" : ""}
            </div>
          )}
        </div>

        <Button
          type="submit"
          loading={submitting}
          rightIcon={<Check size={15} />}
          className="shrink-0 rounded-full px-5"
        >
          Registrar equipo
        </Button>
      </LiquidGlass>
    </div>
  );
}
