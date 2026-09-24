import {
  AppWindow,
  Globe2,
  KeyRound,
  MonitorCog,
  Tablet,
} from "lucide-react";
import type {
  FieldErrors,
  UseFormRegister,
} from "react-hook-form";
import {
  AnimatePresence,
  motion,
} from "motion/react";

import { FormSection } from "../../../../../components/ui/FormSection";
import { Input } from "../../../../../components/ui/Input";

import type { EquipmentFormValues } from "../../types/equipment.types";

interface TechnicalStepProps {
  register: UseFormRegister<EquipmentFormValues>;
  errors: FieldErrors<EquipmentFormValues>;
  equipmentTypeCode?: string;
}

export function TechnicalStep({
  register,
  errors,
  equipmentTypeCode,
}: TechnicalStepProps) {
  const isTablet = equipmentTypeCode === "TABLET";

  return (
    <FormSection
      title="Datos técnicos"
      description="Información técnica para identificar y dar soporte al activo."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Input
          label={
            isTablet
              ? "Nombre del dispositivo"
              : "Hostname"
          }
          placeholder={
            isTablet
              ? "iPad-Gerencia-01"
              : "LAP-TAM-028"
          }
          leftIcon={
            isTablet ? (
              <Tablet size={16} />
            ) : (
              <MonitorCog size={16} />
            )
          }
          error={errors.hostname?.message}
          hint={
            isTablet
              ? "Opcional. Úsalo si el dispositivo tiene un nombre administrado."
              : "Necesario para laptops y desktops."
          }
          {...register("hostname")}
        />

        <Input
          label="Sistema operativo"
          placeholder={
            isTablet
              ? "iPadOS 26 / Android 16"
              : "Windows 11 Pro"
          }
          leftIcon={<AppWindow size={16} />}
          error={errors.sistemaOperativo?.message}
          {...register("sistemaOperativo")}
        />

        <AnimatePresence initial={false}>
          {!isTablet && (
            <>
              <motion.div
                key="ip"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <Input
                  label="Dirección IPv4"
                  placeholder="192.168.1.25"
                  leftIcon={<Globe2 size={16} />}
                  error={errors.direccionIp?.message}
                  hint="Opcional. Útil cuando el activo usa una dirección conocida."
                  {...register("direccionIp")}
                />
              </motion.div>

              <motion.div
                key="anydesk"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <Input
                  label="Clave AnyDesk"
                  placeholder="ID de acceso remoto"
                  leftIcon={<KeyRound size={16} />}
                  error={errors.anydesk?.message}
                  hint="Opcional."
                  {...register("anydesk")}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </FormSection>
  );
}
