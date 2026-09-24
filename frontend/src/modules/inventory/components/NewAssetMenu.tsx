import { Laptop2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Popover } from "../../../components/ui/Popover";

interface NewAssetMenuProps {
  open: boolean;
}

export function NewAssetMenu({
  open,
}: NewAssetMenuProps) {
  const navigate = useNavigate();

  return (
    <Popover
      open={open}
      className="w-64"
    >
      <button
        type="button"
        onClick={() =>
          navigate(
            "/forms/equipos/nuevo",
          )
        }
        className="flex w-full items-center gap-3 rounded-[14px] px-3 py-3 text-left transition hover:bg-black/[0.045]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-black text-white">
          <Laptop2
            size={17}
            strokeWidth={1.65}
          />
        </span>

        <span>
          <span className="block text-sm font-semibold">
            Registrar equipo
          </span>

          <span className="mt-0.5 block text-[11px] text-(--text-tertiary)">
            Alta de activo de TI
          </span>
        </span>
      </button>
    </Popover>
  );
}
