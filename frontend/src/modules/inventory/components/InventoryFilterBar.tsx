import {
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import { ChoiceField } from "../../../components/ui/ChoiceField";
import { Button } from "../../../components/ui/Button";
import type {
  EquipmentCatalogs,
} from "../../forms/equipment/types/equipment.types";
import type {
  AttentionKey,
} from "../types/inventory.types";

interface InventoryFilterBarProps {
  catalogs: EquipmentCatalogs | null;
  branchId: string;
  typeCode: string;
  departmentId: string;
  statusCode: string;
  attention: AttentionKey | "";
  onBranchChange: (
    value: string,
  ) => void;
  onTypeChange: (
    value: string,
  ) => void;
  onDepartmentChange: (
    value: string,
  ) => void;
  onStatusChange: (
    value: string,
  ) => void;
  onAttentionChange: (
    value: AttentionKey | "",
  ) => void;
  onClear: () => void;
}

const attentionOptions = [
  {
    value: "",
    label: "Todas",
  },
  {
    value: "no_operativo",
    label: "No operativos",
  },
  {
    value: "observaciones",
    label: "Con observaciones",
  },
  {
    value: "sin_responsable",
    label: "Sin responsable",
  },
  {
    value: "factura_pendiente",
    label: "Factura pendiente",
  },
  {
    value: "dano_fisico",
    label: "Daño físico relevante",
  },
];

export function InventoryFilterBar({
  catalogs,
  branchId,
  typeCode,
  departmentId,
  statusCode,
  attention,
  onBranchChange,
  onTypeChange,
  onDepartmentChange,
  onStatusChange,
  onAttentionChange,
  onClear,
}: InventoryFilterBarProps) {
  const hasFilters = Boolean(
    branchId ||
      typeCode ||
      departmentId ||
      statusCode ||
      attention,
  );

  return (
    <section className="mt-5 rounded-[24px] border border-black/[0.055] bg-white/58 p-3 shadow-sm backdrop-blur-2xl sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-(--text-secondary)">
          <SlidersHorizontal
            size={14}
            strokeWidth={1.8}
          />
          Filtros
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={
              <RotateCcw size={13} />
            }
            className="h-8 rounded-full px-3 text-[11px]"
            onClick={onClear}
          >
            Limpiar
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <ChoiceField
          value={branchId}
          onChange={onBranchChange}
          placeholder="Sucursal"
          searchable
          options={[
            {
              value: "",
              label:
                "Todas las sucursales",
            },
            ...(catalogs?.sucursales ??
              []).map(
              (item) => ({
                value: item.id,
                label: item.nombre,
                meta: item.codigo,
              }),
            ),
          ]}
        />

        <ChoiceField
          value={typeCode}
          onChange={onTypeChange}
          placeholder="Tipo de equipo"
          options={[
            {
              value: "",
              label:
                "Todos los tipos",
            },
            ...(catalogs?.tiposEquipo ??
              []).map(
              (item) => ({
                value:
                  item.codigo,
                label:
                  item.nombre,
              }),
            ),
          ]}
        />

        <ChoiceField
          value={departmentId}
          onChange={
            onDepartmentChange
          }
          placeholder="Departamento"
          options={[
            {
              value: "",
              label:
                "Todos los departamentos",
            },
            ...(catalogs?.departamentos ??
              []).map(
              (item) => ({
                value: item.id,
                label:
                  item.nombre,
              }),
            ),
          ]}
        />

        <ChoiceField
          value={statusCode}
          onChange={onStatusChange}
          placeholder="Estado"
          options={[
            {
              value: "",
              label:
                "Todos los estados",
            },
            ...(catalogs?.estadosFuncionamiento ??
              []).map(
              (item) => ({
                value:
                  item.codigo,
                label:
                  item.nombre,
              }),
            ),
          ]}
        />

        <ChoiceField
          value={attention}
          onChange={(value) =>
            onAttentionChange(
              value as
                | AttentionKey
                | "",
            )
          }
          placeholder="Atención"
          options={
            attentionOptions
          }
        />
      </div>
    </section>
  );
}
