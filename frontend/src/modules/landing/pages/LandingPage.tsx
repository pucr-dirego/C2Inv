import "../landing.css";
import { LandingNav } from "../components/LandingNav";
import { LandingHero } from "../components/LandingHero";
import { FormsFeature } from "../components/FormsFeature";
import { InventoryFeature } from "../components/InventoryFeature";
import { LandingFooter } from "../components/LandingFooter";

export function LandingPage() {
  return (
    <div className="landing-root min-h-screen overflow-x-hidden">
      <LandingNav />
      <LandingHero />
      <FormsFeature />
      <InventoryFeature />
      <LandingFooter />
    </div>
  );
}
