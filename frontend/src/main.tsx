import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import App from "./App";
import "./styles/globals.css";
import { ToastProvider } from "./components/ui/ToastProvider";
import { AuthProvider } from "./modules/auth/context/AuthContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </MotionConfig>
  </StrictMode>,
);
