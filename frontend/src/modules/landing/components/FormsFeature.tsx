import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Cpu,
  Laptop2,
} from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/Button";

export function FormsFeature() {
  const navigate = useNavigate();

  return (
    <section
      id="forms"
      className="px-4 py-8 sm:px-6 sm:py-12"
    >
      <div className="mx-auto max-w-[1400px]">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.45,
          }}
          transition={{
            duration: 0.56,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative overflow-hidden rounded-[36px] bg-[#f5f5f7] px-7 py-10 sm:px-10 sm:py-14 lg:px-14"
        >
          <div className="pointer-events-none absolute right-[-8%] top-[-18%] h-[460px] w-[460px] rounded-full bg-blue-500/[0.08] blur-[100px]" />

          <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-black text-white shadow-lg">
                <Laptop2
                  size={21}
                  strokeWidth={1.6}
                />
              </div>

              <h2 className="mt-7 max-w-xl text-[clamp(2.8rem,5.7vw,5.6rem)] font-semibold leading-[0.94] tracking-[-0.065em]">
                Registra cada equipo
                <span className="block text-(--text-secondary)">
                  desde el origen.
                </span>
              </h2>

              <p className="mt-5 max-w-lg text-[15px] leading-7 text-(--text-secondary)">
                Identificación, información técnica,
                asignación, condición y adquisición en un
                flujo pensado para capturar sin perder contexto.
              </p>

              <Button
                onClick={() =>
                  navigate(
                    "/forms/equipos/nuevo",
                  )
                }
                variant="secondary"
                className="mt-7 rounded-full"
                rightIcon={
                  <ArrowUpRight size={15} />
                }
              >
                Registrar equipo
              </Button>
            </div>

            <div className="relative mx-auto h-[380px] w-full max-w-[620px]">
              <motion.div
                initial={{
                  opacity: 0,
                  y: 32,
                  rotateX: 8,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.7,
                  ease: [
                    0.22,
                    1,
                    0.36,
                    1,
                  ],
                }}
                className="absolute inset-x-[9%] top-5 overflow-hidden rounded-[30px] border border-black/[0.07] bg-[#15171a] p-3 shadow-[0_38px_90px_rgba(0,0,0,.19)]"
              >
                <div className="relative h-[235px] overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,#101114,#17191d)] p-6 text-white">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_0%,rgba(0,122,255,.42),transparent_38%)]" />

                  <div className="relative flex justify-between">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/42">
                      Activo
                    </div>

                    <CheckCircle2
                      size={15}
                      className="text-blue-400"
                    />
                  </div>

                  <div className="relative mt-8 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-white/[0.09]">
                      <Laptop2
                        size={30}
                        strokeWidth={1.4}
                      />
                    </div>

                    <div>
                      <div className="text-xl font-semibold tracking-[-0.025em]">
                        Latitude 5450
                      </div>

                      <div className="mt-1 text-xs text-white/44">
                        TI-2026-000041
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-8 grid grid-cols-3 gap-2">
                    {[
                      "Tampico",
                      "Sistemas",
                      "Operativo",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-[11px] bg-white/[0.065] px-2 py-2.5 text-center text-[9px] font-medium text-white/62"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{
                  opacity: 0,
                  x: -18,
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.25,
                }}
                className="absolute bottom-4 left-0 flex items-center gap-2.5 rounded-[18px] border border-white/75 bg-white/84 px-4 py-3 shadow-xl backdrop-blur-2xl"
              >
                <Cpu
                  size={16}
                  className="text-(--text-secondary)"
                />

                <div>
                  <div className="text-[10px] font-semibold">
                    Datos técnicos
                  </div>

                  <div className="text-[9px] text-(--text-tertiary)">
                    En contexto
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{
                  opacity: 0,
                  x: 18,
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.34,
                }}
                className="absolute bottom-10 right-0 flex items-center gap-2.5 rounded-[18px] border border-white/75 bg-white/84 px-4 py-3 shadow-xl backdrop-blur-2xl"
              >
                <Building2
                  size={16}
                  className="text-(--text-secondary)"
                />

                <div>
                  <div className="text-[10px] font-semibold">
                    Asignación
                  </div>

                  <div className="text-[9px] text-(--text-tertiary)">
                    Sucursal + área
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
