import {
  Activity,
  ArrowUpRight,
  Box,
  Building2,
  Laptop2,
  MapPin,
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import {
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/Button";

export function InventoryFeature() {
  const section =
    useRef<HTMLElement>(null);

  const navigate = useNavigate();
  const reducedMotion =
    useReducedMotion();

  const { scrollYProgress } =
    useScroll({
      target: section,
      offset: [
        "start end",
        "end start",
      ],
    });

  const objectScale =
    useTransform(
      scrollYProgress,
      [0.15, 0.5, 0.85],
      reducedMotion
        ? [1, 1, 1]
        : [0.88, 1, 0.94],
    );

  const objectY =
    useTransform(
      scrollYProgress,
      [0.1, 0.85],
      reducedMotion
        ? [0, 0]
        : [55, -35],
    );

  return (
    <section
      ref={section}
      id="inventory"
      className="px-4 py-8 sm:px-6 sm:py-12"
    >
      <div className="relative mx-auto min-h-[880px] max-w-[1400px] overflow-hidden rounded-[34px] bg-[#09090b] text-white">
        <div className="inventory-dark-grid pointer-events-none absolute inset-0 opacity-65" />

        <div className="pointer-events-none absolute left-1/2 top-[38%] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-blue-500/[0.15] blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-[1100px] px-6 pb-12 pt-16 text-center sm:px-10 sm:pt-20">
          <motion.h2
            initial={{
              opacity: 0,
              y: 24,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.55,
            }}
            transition={{
              duration: 0.62,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
            className="mx-auto max-w-4xl text-[clamp(3rem,6.6vw,6.6rem)] font-semibold leading-[0.91] tracking-[-0.07em]"
          >
            Tu inventario.
            <span className="block text-white/44">
              Vivo y ubicable.
            </span>
          </motion.h2>

          <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-7 text-white/48">
            Consulta activos, estado,
            asignación e historial desde
            una sola superficie operativa.
          </p>

          <Button
            variant="secondary"
            className="mt-7 rounded-full border-white/15 bg-white/[0.09] text-white hover:bg-white/[0.14]"
            rightIcon={
              <ArrowUpRight size={15} />
            }
            onClick={() =>
              navigate(
                "/operations",
              )
            }
          >
            Abrir plataforma
          </Button>

          <div className="relative mx-auto mt-10 h-[520px] max-w-[900px]">
            <motion.div
              style={{
                scale: objectScale,
                y: objectY,
              }}
              className="absolute left-1/2 top-[8%] w-[68%] -translate-x-1/2"
            >
              <div className="rounded-[34px] border border-white/[0.08] bg-white/[0.055] p-3 shadow-[0_45px_110px_rgba(0,0,0,.45)] backdrop-blur-2xl">
                <div className="asset-screen relative min-h-[300px] overflow-hidden rounded-[26px] p-7">
                  <div className="asset-screen-glow absolute inset-0 opacity-80" />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white/[0.08]">
                        <Laptop2
                          size={20}
                          strokeWidth={1.5}
                        />
                      </div>

                      <div className="text-left">
                        <div className="text-[10px] uppercase tracking-[0.15em] text-white/34">
                          Activo
                        </div>

                        <div className="mt-1 text-lg font-semibold">
                          LAP-TAM-028
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded-full bg-green-500/[0.12] px-3 py-1.5 text-[10px] font-semibold text-green-300">
                      <Activity size={12} />
                      Operativo
                    </div>
                  </div>

                  <div className="relative mt-14 grid grid-cols-3 gap-3">
                    {[
                      {
                        icon:
                          Building2,
                        label:
                          "Sucursal",
                        value:
                          "Tampico",
                      },
                      {
                        icon:
                          MapPin,
                        label:
                          "Ubicación",
                        value:
                          "Sistemas",
                      },
                      {
                        icon: Box,
                        label:
                          "Tipo",
                        value:
                          "Laptop",
                      },
                    ].map((metric) => {
                      const Glyph =
                        metric.icon;

                      return (
                        <div
                          key={
                            metric.label
                          }
                          className="rounded-[16px] border border-white/[0.05] bg-white/[0.045] p-3 text-left"
                        >
                          <Glyph
                            size={14}
                            className="text-white/34"
                            strokeWidth={1.5}
                          />

                          <div className="mt-5 text-[9px] text-white/32">
                            {
                              metric.label
                            }
                          </div>

                          <div className="mt-1 text-xs font-semibold text-white/72">
                            {
                              metric.value
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
