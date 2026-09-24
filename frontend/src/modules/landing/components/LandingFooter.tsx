import { BrandMark } from "../../../components/brand/BrandMark";

export function LandingFooter() {
  return (
    <footer className="px-6 pb-10 pt-14">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-5 border-t border-black/[0.065] pt-7 sm:flex-row sm:items-center sm:justify-between">
        <BrandMark />
        <div className="text-xs text-(--text-tertiary)">Sistema interno · Inventarios TI</div>
      </div>
    </footer>
  );
}
