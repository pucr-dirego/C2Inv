import {
  Barcode,
  Laptop2,
  Tags,
} from "lucide-react";
import type {
  Control,
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import { Controller } from "react-hook-form";

import { ChoiceField } from "../../../../../components/ui/ChoiceField";
import { Input } from "../../../../../components/ui/Input";
import { FormSection } from "../../../../../components/ui/FormSection";

import type {
  EquipmentCatalogs,
  EquipmentFormValues,
} from "../../types/equipment.types";

interface IdentificationStepProps {
  register: UseFormRegister<EquipmentFormValues>;
  control: Control<EquipmentFormValues>;
  errors: FieldErrors<EquipmentFormValues>;
  catalogs: EquipmentCatalogs;
}

export function IdentificationStep({
  register,
  control,
  errors,
  catalogs,
}: IdentificationStepProps) {
  return (
    <FormSection
      title="Identificación del equipo"
      description="Por ahora el alta está enfocada en laptops, desktops y tablets."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Controller
          control={control}
          name="tipoEquipoId"
          render={({ field }) => (
            <ChoiceField
              label="Tipo de equipo"
              value={field.value}
              onChange={field.onChange}
              placeholder="Selecciona un tipo"
              error={errors.tipoEquipoId?.message}
              options={catalogs.tiposEquipo.map((item) => ({
                value: item.id,
                label: item.nombre,
                description: item.descripcion,
              }))}
            />
          )}
        />

        <Input
          label="Marca"
          placeholder="Dell, HP, Lenovo, Apple..."
          leftIcon={<Tags size={16} />}
          error={errors.marca?.message}
          {...register("marca")}
        />

        <Input
          label="Modelo"
          placeholder="Latitude 5450 / iPad Air..."
          leftIcon={<Laptop2 size={16} />}
          error={errors.modelo?.message}
          {...register("modelo")}
        />

        <Input
          label="Número de serie"
          placeholder="Serie física del fabricante"
          leftIcon={<Barcode size={16} />}
          error={errors.numeroSerie?.message}
          {...register("numeroSerie")}
        />
      </div>
    </FormSection>
  );
}
