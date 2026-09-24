import { z } from "zod";

export const loginSchema = z.object({
  correo: z
    .string()
    .trim()
    .email("Ingresa un correo válido."),
  password: z
    .string()
    .min(1, "Ingresa tu contraseña."),
});

export const registerSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Ingresa tu nombre.")
    .max(120),
  apellidoPaterno: z
    .string()
    .trim()
    .max(120)
    .optional(),
  apellidoMaterno: z
    .string()
    .trim()
    .max(120)
    .optional(),
  correo: z
    .string()
    .trim()
    .email("Ingresa un correo válido.")
    .max(255),
  sucursalId: z
    .string()
    .uuid("Selecciona tu sucursal."),
  password: z
    .string()
    .min(10, "Usa al menos 10 caracteres.")
    .max(128, "La contraseña es demasiado larga."),
});

export type LoginFormValues =
  z.infer<typeof loginSchema>;

export type RegisterFormValues =
  z.infer<typeof registerSchema>;
