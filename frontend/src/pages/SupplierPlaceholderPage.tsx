import { ArrowLeft, FilePlus2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { Surface } from "../components/ui/Surface";

export function SupplierPlaceholderPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <Surface material="floating" radius="large" className="w-full max-w-xl p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] bg-violet-500/[0.09] text-violet-600">
          <FilePlus2 size={24} strokeWidth={1.6} />
        </div>

        <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em]">
          Alta de proveedor
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-(--text-secondary)">
          Este módulo será el siguiente flujo de Forms.
        </p>

        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => navigate("/forms")}
          leftIcon={<ArrowLeft size={15} />}
        >
          Volver a Forms
        </Button>
      </Surface>
    </main>
  );
}
