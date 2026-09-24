import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { AuthShell } from "../components/AuthShell";
import { AuthModeSwitch, type AuthMode } from "../components/AuthModeSwitch";
import { LoginForm } from "../components/LoginForm";
import { RegisterForm } from "../components/RegisterForm";
import { login, register } from "../services/auth.service";
import type { LoginFormValues, RegisterFormValues } from "../schemas/auth.schema";
import { SuccessState } from "../../../components/ui/SuccessState";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  async function handleLogin(values: LoginFormValues) {
    setLoading(true);
    setError(null);
    try {
      const response = await login(values);
      if (!response.user) throw new Error("El servidor no devolvió la información del usuario.");
      setUser(response.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(values: RegisterFormValues) {
    setLoading(true);
    setError(null);
    try {
      await register(values);
      setRegistered(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <AuthShell
      title={isLogin ? "Bienvenido de nuevo." : "Crea tu acceso."}
      subtitle={isLogin ? "Ingresa con tu cuenta para continuar al sistema." : "Registra tus datos y selecciona tu sucursal. Un administrador deberá aprobar tu acceso."}
      modeSwitcher={
        <AuthModeSwitch
          value={mode}
          onChange={(nextMode) => {
            setMode(nextMode);
            setError(null);
            setRegistered(false);
          }}
        />
      }
    >
      {registered ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <SuccessState title="Solicitud recibida" description="Tu cuenta fue creada, tu sucursal quedó asociada y el acceso está pendiente de aprobación." />
          <Button variant="secondary" className="mt-6 w-full" onClick={() => { setMode("login"); setRegistered(false); }}>Volver a iniciar sesión</Button>
        </motion.div>
      ) : isLogin ? (
        <LoginForm loading={loading} error={error} onSubmit={handleLogin} />
      ) : (
        <RegisterForm loading={loading} error={error} onSubmit={handleRegister} />
      )}
    </AuthShell>
  );
}
