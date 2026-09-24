import type {
  Control,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import { ChoiceField } from "../../../../../components/ui/ChoiceField";
import { FormSection } from "../../../../../components/ui/FormSection";
import { TextArea } from "../../../../../components/ui/TextArea";

import type {
  EquipmentCatalogs,
  EquipmentFormValues,
} from "../../types/equipment.types";

interface StatusStepProps {
  register: UseFormRegister<EquipmentFormValues>;
  control: Control<EquipmentFormValues>;
  errors: FieldErrors<EquipmentFormValues>;
  catalogs: EquipmentCatalogs;
}

export function StatusStep({
  register,
  control,
  errors,
  catalogs,
}: StatusStepProps) {
  return (
    <FormSection
      title="Estado inicial"
      description="Separamos funcionamiento y condición física usando criterios que sigan teniendo sentido con el paso del tiempo."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Controller
          control={control}
          name="estadoFuncionamientoId"
          render={({ field }) => (
            <ChoiceField
              label="Estado de funcionamiento"
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecciona un estado"
              error={errors.estadoFuncionamientoId?.message}
              options={catalogs.estadosFuncionamiento.map((item) => ({
                value: item.id,
                label: item.nombre,
                description: item.descripcion,
              }))}
            />
          )}
        />

        <Controller
          control={control}
          name="condicionFisicaId"
          render={({ field }) => (
            <ChoiceField
              label="Condición física"
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecciona una condición"
              error={errors.condicionFisicaId?.message}
              options={catalogs.condicionesFisicas.map((item) => ({
                value: item.id,
                label: item.nombre,
                description: item.descripcion,
              }))}
            />
          )}
        />

        <div className="md:col-span-2">
          <TextArea
            label="Observaciones"
            placeholder="Daños visibles, comportamiento, particularidades o información relevante..."
            error={errors.observaciones?.message}
            {...register("observaciones")}
          />
        </div>
      </div>
    </FormSection>
  );
}
