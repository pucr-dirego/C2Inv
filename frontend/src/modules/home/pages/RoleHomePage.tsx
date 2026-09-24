import { useAuth } from "../../auth/context/AuthContext";
import { LandingPage } from "../../landing/pages/LandingPage";
import { BasicUserHomePage } from "./BasicUserHomePage";

export function RoleHomePage() {
  const { isBasicUser } = useAuth();

  return isBasicUser
    ? <BasicUserHomePage />
    : <LandingPage />;
}
