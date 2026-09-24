import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowRight,
  Mail,
  UserRound,
} from "lucide-react";
import {
  Controller,
  useForm,
} from "react-hook-form";
import {
  useEffect,
  useState,
} from "react";

import { Button } from "../../../components/ui/Button";
import { ChoiceField } from "../../../components/ui/ChoiceField";
import { InlineMessage } from "../../../components/ui/InlineMessage";
import { Input } from "../../../components/ui/Input";
import { PasswordInput } from "../../../components/ui/PasswordInput";
import {
  registerSchema,
  type RegisterFormValues,
} from "../schemas/auth.schema";
import { getRegistrationBranches } from "../services/auth.service";
import type { AuthBranch } from "../types/auth.types";

interface RegisterFormProps {
  loading: boolean;
  error?: string | null;
  onSubmit: (
    values: RegisterFormValues,
  ) => Promise<void>;
}

export function RegisterForm({
  loading,
  error,
  onSubmit,
}: RegisterFormProps) {
  const [branches, setBranches] =
    useState<AuthBranch[]>([]);

  const [branchesLoading, setBranchesLoading] =
    useState(true);

  const [branchesError, setBranchesError] =
    useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      correo: "",
      sucursalId: "",
      password: "",
    },
  });

  useEffect(() => {
    let mounted = true;

    void getRegistrationBranches()
      .then((items) => {
        if (!mounted) return;

        setBranches(items);
        setBranchesError(null);
      })
      .catch((err) => {
        if (!mounted) return;

        setBranchesError(
          err instanceof Error
            ? err.message
            : "No fue posible cargar las sucursales.",
        );
      })
      .finally(() => {
        if (mounted) {
          setBranchesLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <Input
        label="Nombre"
        placeholder="Tu nombre"
        leftIcon={
          <UserRound size={17} />
        }
        error={errors.nombre?.message}
        {...register("nombre")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Apellido paterno"
          placeholder="Apellido"
          error={
            errors.apellidoPaterno
              ?.message
          }
          {...register(
            "apellidoPaterno",
          )}
        />

        <Input
          label="Apellido materno"
          placeholder="Apellido"
          error={
            errors.apellidoMaterno
              ?.message
          }
          {...register(
            "apellidoMaterno",
          )}
        />
      </div>

      <Input
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        placeholder="nombre@empresa.com"
        leftIcon={<Mail size={17} />}
        error={errors.correo?.message}
        {...register("correo")}
      />

      <Controller
        name="sucursalId"
        control={control}
        render={({ field }) => (
          <ChoiceField
            label="Sucursal"
            value={field.value}
            onChange={field.onChange}
            placeholder={
              branchesLoading
                ? "Cargando sucursales..."
                : "Selecciona tu sucursal"
            }
            searchable
            disabled={branchesLoading}
            error={
              errors.sucursalId
                ?.message ??
              branchesError ??
              undefined
            }
            hint="Esta sucursal quedará asociada a tu cuenta desde el registro."
            options={branches.map(
              (branch) => ({
                value: branch.id,
                label: branch.nombre,
                description:
                  branch.codigo,
              }),
            )}
          />
        )}
      />

      <PasswordInput
        autoComplete="new-password"
        placeholder="Mínimo 10 caracteres"
        error={errors.password?.message}
        hint="La contraseña se protege en el servidor mediante Argon2id."
        {...register("password")}
      />

      {error && (
        <InlineMessage tone="danger">
          {error}
        </InlineMessage>
      )}

      <InlineMessage tone="info">
        La cuenta quedará pendiente de aprobación. Tu sucursal ya se guardará con la solicitud.
      </InlineMessage>

      <Button
        type="submit"
        size="lg"
        loading={loading}
        disabled={
          branchesLoading ||
          Boolean(branchesError)
        }
        rightIcon={
          <ArrowRight size={17} />
        }
        className="w-full"
      >
        Crear cuenta
      </Button>
    </form>
  );
}
