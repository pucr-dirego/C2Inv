import { useRef } from "react";
import { ArrowDown, Building2, Laptop2, Network, Server, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Button } from "../../../components/ui/Button";
import { useAuth } from "../../auth/context/AuthContext";

const nodes = [
  { icon: Laptop2, label: "Laptop", meta: "LAP-TAM-028", className: "left-[3%] top-[20%]" },
  { icon: Server, label: "Servidor", meta: "SRV-TAM-004", className: "right-[3%] top-[16%]" },
  { icon: Building2, label: "Sucursal", meta: "Tampico", className: "left-[7%] bottom-[14%]" },
  { icon: ShieldCheck, label: "Control", meta: "Operativo", className: "right-[5%] bottom-[13%]" },
];

export function LandingHero() {
  const target = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const { user } = useAuth();
  const { scrollYProgress } = useScroll({ target, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reducedMotion ? 0 : 90]);
  const sceneScale = useTransform(scrollYProgress, [0, 0.72], [1, reducedMotion ? 1 : 0.92]);
  const sceneOpacity = useTransform(scrollYProgress, [0.1, 0.9], [1, 0.28]);
  const firstName = user?.nombre?.split(" ")[0] ?? "equipo";

  return (
    <section ref={target} className="relative flex min-h-[100svh] items-center overflow-hidden px-5 pb-16 pt-28 sm:px-8">
      <div className="landing-hero-grid pointer-events-none absolute inset-0 opacity-80" />
      <div className="pointer-events-none absolute left-[-14%] top-[5%] h-[540px] w-[540px] rounded-full bg-blue-500/[0.07] blur-[90px]" />
      <div className="pointer-events-none absolute bottom-[-20%] right-[-8%] h-[520px] w-[520px] rounded-full bg-violet-500/[0.055] blur-[110px]" />

      <motion.div style={{ y: contentY }} className="relative z-10 mx-auto grid w-full max-w-[1180px] items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-[580px]">
          <motion.h1 initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.58, ease: [0.22,1,0.36,1] }} className="text-[clamp(3.4rem,7.2vw,6.7rem)] font-semibold leading-[0.91] tracking-[-0.075em]">
            Todo tu TI,
            <span className="block text-(--text-secondary)">en contexto.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.52, ease: [0.22,1,0.36,1] }} className="mt-7 max-w-lg text-[17px] leading-7 text-(--text-secondary)">
            Hola, {firstName}. Registra, ubica y entiende cada activo de la operación sin perder de vista dónde está y quién lo utiliza.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.48 }} className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => document.getElementById("forms")?.scrollIntoView({ behavior: "smooth" })} rightIcon={<ArrowDown size={16} strokeWidth={1.8} />} className="rounded-full px-6">
              Explorar
            </Button>
          </motion.div>
        </div>

        <motion.div style={{ scale: sceneScale, opacity: sceneOpacity }} className="relative mx-auto aspect-square w-full max-w-[610px]">
          <div className="absolute inset-[10%] rounded-full border border-black/[0.045]" />
          <div className="absolute inset-[22%] rounded-full border border-dashed border-blue-500/15" />
          <svg viewBox="0 0 100 100" className="absolute inset-[10%] h-[80%] w-[80%]">
            <motion.path d="M17 31 C35 19, 65 18, 82 29 M17 31 C24 52, 21 66, 26 79 M82 29 C79 47, 79 64, 76 79 M26 79 C42 69, 61 69, 76 79" fill="none" stroke="rgba(0,122,255,.16)" strokeWidth="0.45" strokeDasharray="2 2" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: 0.35, duration: 1.25, ease: [0.22,1,0.36,1] }} />
          </svg>
          <motion.div initial={{ opacity: 0, scale: 0.8, rotate: -8 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ delay: 0.25, type: "spring", stiffness: 280, damping: 26 }} className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[34px] bg-black text-white shadow-[0_28px_80px_rgba(0,0,0,.22)]">
            <Network size={45} strokeWidth={1.35} />
          </motion.div>
          {nodes.map((node, index) => {
            const Glyph = node.icon;
            return (
              <motion.div key={node.label} initial={{ opacity: 0, scale: 0.84, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.42 + index * 0.11, duration: 0.45, ease: [0.22,1,0.36,1] }} className={`absolute ${node.className}`}>
                <div className="flex min-w-[150px] items-center gap-3 rounded-[20px] border border-white/70 bg-white/68 p-3 shadow-[0_18px_55px_rgba(0,0,0,.09)] backdrop-blur-2xl">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-black/[0.045] text-(--text-secondary)"><Glyph size={18} strokeWidth={1.7} /></div>
                  <div><div className="text-xs font-semibold">{node.label}</div><div className="mt-0.5 text-[10px] text-(--text-tertiary)">{node.meta}</div></div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}
