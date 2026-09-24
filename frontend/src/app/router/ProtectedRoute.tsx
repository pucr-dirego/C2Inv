import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { BrandMark } from "../../components/brand/BrandMark";
import { Spinner } from "../../components/ui/Spinner";
import { useAuth } from "../../modules/auth/context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-5"
        >
          <BrandMark />
          <Spinner className="text-(--accent)" />
        </motion.div>
      </main>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
}
