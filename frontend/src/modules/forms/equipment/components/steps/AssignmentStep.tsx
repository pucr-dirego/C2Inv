import {
  MapPinned,
  UserRound,
} from "lucide-react";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import { ChoiceField } from "../../../../../components/ui/ChoiceField";
import { FormSection } from "../../../../../components/ui/FormSection";
import { Input } from "../../../../../components/ui/Input";
import { TextArea } from "../../../../../components/ui/TextArea";

import type {
  EquipmentCatalogs,
  EquipmentFormValues,
} from "../../types/equipment.types";

interface AssignmentStepProps {
  register: UseFormRegister<EquipmentFormValues>;
  control: Control<EquipmentFormValues>;
  errors: FieldErrors<EquipmentFormValues>;
  catalogs: EquipmentCatalogs;
}

export function AssignmentStep({
  register,
  control,
  errors,
  catalogs,
}: AssignmentStepProps) {
  return (
    <FormSection
      title="Asignación y ubicación"
      description="Indica dónde opera el equipo y quién lo tiene bajo su responsabilidad."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Controller
          control={control}
          name="sucursalId"
          render={({ field }) => (
            <ChoiceField
              label="Sucursal"
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecciona una sucursal"
              searchable
              error={errors.sucursalId?.message}
              options={catalogs.sucursales.map((item) => ({
                value: item.id,
                label: item.nombre,
                meta: item.codigo,
              }))}
            />
          )}
        />

        <Controller
          control={control}
          name="departamentoId"
          render={({ field }) => (
            <ChoiceField
              label="Departamento"
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecciona un departamento"
              error={errors.departamentoId?.message}
              options={catalogs.departamentos.map((item) => ({
                value: item.id,
                label: item.nombre,
              }))}
            />
          )}
        />

        <div className="md:col-span-2">
          <Input
            label="Responsable"
            placeholder="Persona responsable del activo"
            leftIcon={<UserRound size={16} />}
            error={errors.responsable?.message}
            {...register("responsable")}
          />
        </div>

        <div className="md:col-span-2">
          <TextArea
            label="Ubicación exacta"
            placeholder="Ej. Oficina de gerencia, escritorio junto a recepción..."
            error={errors.ubicacionExacta?.message}
            {...register("ubicacionExacta")}
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-2 rounded-[15px] bg-black/[0.035] px-3.5 py-3 text-xs leading-5 text-(--text-secondary)">
          <MapPinned size={15} className="shrink-0" />
          La ubicación exacta permanece como texto libre para capturar el contexto físico real.
        </div>
      </div>
    </FormSection>
  );
}
