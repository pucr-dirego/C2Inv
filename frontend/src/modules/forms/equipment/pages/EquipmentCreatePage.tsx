import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
} from "motion/react";
import {
  useForm,
  type FieldErrors,
  type FieldPath,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../../components/ui/Button";
import { InlineMessage } from "../../../../components/ui/InlineMessage";
import { Spinner } from "../../../../components/ui/Spinner";
import { SuccessState } from "../../../../components/ui/SuccessState";
import { Surface } from "../../../../components/ui/Surface";
import { useToast } from "../../../../components/ui/ToastProvider";

import {
  equipmentSchema,
  type EquipmentSchemaValues,
} from "../schemas/equipment.schema";
import {
  createEquipment,
  getEquipmentCatalogs,
} from "../services/equipment.service";
import type {
  CreatedEquipment,
  EquipmentCatalogs,
  EquipmentFormValues,
} from "../types/equipment.types";

import { EquipmentFormShell } from "../components/EquipmentFormShell";
import { EquipmentLivePreview } from "../components/EquipmentLivePreview";
import type { EquipmentStep } from "../components/EquipmentStepNav";
import { IdentificationStep } from "../components/steps/IdentificationStep";
import { TechnicalStep } from "../components/steps/TechnicalStep";
import { AssignmentStep } from "../components/steps/AssignmentStep";
import { StatusStep } from "../components/steps/StatusStep";
import { AcquisitionStep } from "../components/steps/AcquisitionStep";
import { ReviewStep } from "../components/steps/ReviewStep";

import "../equipment.css";

const steps: EquipmentStep[] = [
  {
    id: "identity",
    label: "Identificación",
    eyebrow: "01",
  },
  {
    id: "technical",
    label: "Técnico",
    eyebrow: "02",
  },
  {
    id: "assignment",
    label: "Asignación",
    eyebrow: "03",
  },
  {
    id: "status",
    label: "Estado",
    eyebrow: "04",
  },
  {
    id: "acquisition",
    label: "Adquisición",
    eyebrow: "05",
  },
  {
    id: "review",
    label: "Revisión",
    eyebrow: "06",
  },
];

const fieldsByStep: FieldPath<EquipmentSchemaValues>[][] = [
  [
    "tipoEquipoId",
    "marca",
    "modelo",
    "numeroSerie",
  ],
  [
    "hostname",
    "direccionIp",
    "sistemaOperativo",
    "anydesk",
  ],
  [
    "sucursalId",
    "departamentoId",
    "responsable",
    "ubicacionExacta",
  ],
  [
    "estadoFuncionamientoId",
    "condicionFisicaId",
    "observaciones",
  ],
  [
    "tipoIncorporacionId",
    "facturaModo",
    "facturaExistenteId",
    "factura.numeroFactura",
    "factura.total",
    "importeAdquisicion",
  ],
  [],
];

const defaultValues: EquipmentFormValues = {
  tipoEquipoId: "",
  marca: "",
  modelo: "",
  numeroSerie: "",

  hostname: "",
  direccionIp: "",
  sistemaOperativo: "",
  anydesk: "",

  estadoFuncionamientoId: "",
  condicionFisicaId: "",
  observaciones: "",

  sucursalId: "",
  departamentoId: "",
  responsable: "",
  ubicacionExacta: "",

  tipoIncorporacionId: "",

  facturaModo: "COMPLETAR_DESPUES",
  facturaExistenteId: "",
  facturaPartida: "",
  importeAdquisicion: null,

  factura: {
    numeroFactura: "",
    fechaFactura: "",
    proveedorNombre: "",
    razonSocial: "",
    moneda: "MXN",
    total: null,
    observaciones: "",
  },
};

export function EquipmentCreatePage() {
  const navigate = useNavigate();
  const { pushToast } = useToast();

  const [
    catalogs,
    setCatalogs,
  ] = useState<EquipmentCatalogs | null>(
    null,
  );

  const [
    catalogError,
    setCatalogError,
  ] = useState<string | null>(null);

  const [
    currentStep,
    setCurrentStep,
  ] = useState(0);

  const [
    completedSteps,
    setCompletedSteps,
  ] = useState<Set<number>>(
    () => new Set(),
  );

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState<string | null>(null);

  const [
    created,
    setCreated,
  ] = useState<CreatedEquipment | null>(
    null,
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    trigger,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<EquipmentSchemaValues>({
    resolver: zodResolver(equipmentSchema),
    mode: "onTouched",
    defaultValues,
  });

  const values = watch();

  useEffect(() => {
    let mounted = true;

    void getEquipmentCatalogs()
      .then((response) => {
        if (mounted) {
          setCatalogs(response);
          setCatalogError(null);
        }
      })
      .catch((error) => {
        if (mounted) {
          setCatalogError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar los catálogos.",
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedType = useMemo(
    () =>
      catalogs?.tiposEquipo.find(
        (item) =>
          item.id === values.tipoEquipoId,
      ),
    [catalogs, values.tipoEquipoId],
  );

  const incorporation = useMemo(
    () =>
      catalogs?.tiposIncorporacion.find(
        (item) =>
          item.id ===
          values.tipoIncorporacionId,
      ),
    [
      catalogs,
      values.tipoIncorporacionId,
    ],
  );

  const equipmentTypeCode =
    selectedType?.codigo;

  const incorporationCode =
    incorporation?.codigo;

  useEffect(() => {
    if (equipmentTypeCode === "TABLET") {
      setValue("direccionIp", "");
      setValue("anydesk", "");
      clearErrors([
        "direccionIp",
        "anydesk",
      ]);
    }
  }, [
    clearErrors,
    equipmentTypeCode,
    setValue,
  ]);

  useEffect(() => {
    if (
      incorporationCode === "EXISTENTE"
    ) {
      setValue(
        "facturaModo",
        "COMPLETAR_DESPUES",
      );
      setValue("facturaExistenteId", "");
      setValue("facturaPartida", "");
      setValue("importeAdquisicion", null);
    }
  }, [
    incorporationCode,
    setValue,
  ]);

  async function nextStep() {
    const fields =
      fieldsByStep[currentStep] ?? [];

    const valid = fields.length
      ? await trigger(fields)
      : true;

    if (!valid) {
      pushToast({
        tone: "warning",
        title: "Faltan datos",
        description:
          "Revisa los campos marcados antes de continuar.",
      });
      return;
    }

    if (
      currentStep === 1 &&
      equipmentTypeCode !== "TABLET" &&
      !values.hostname.trim()
    ) {
      setError("hostname", {
        type: "manual",
        message:
          "El hostname es obligatorio para laptops y desktops.",
      });

      pushToast({
        tone: "warning",
        title: "Falta hostname",
        description:
          "Las laptops y desktops necesitan un hostname.",
      });

      return;
    }

    setCompletedSteps(
      (previous) => {
        const next = new Set(
          previous,
        );

        next.add(currentStep);

        return next;
      },
    );

    setCurrentStep((step) =>
      Math.min(
        step + 1,
        steps.length - 1,
      ),
    );
  }


  function goToStep(
    index: number,
  ) {
    setSubmitError(null);

    setCurrentStep(index);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleInvalidSubmit(
    formErrors: FieldErrors<EquipmentSchemaValues>,
  ) {
    let step = 0;

    if (
      formErrors.tipoEquipoId ||
      formErrors.marca ||
      formErrors.modelo ||
      formErrors.numeroSerie
    ) {
      step = 0;
    } else if (
      formErrors.hostname ||
      formErrors.direccionIp ||
      formErrors.sistemaOperativo ||
      formErrors.anydesk
    ) {
      step = 1;
    } else if (
      formErrors.sucursalId ||
      formErrors.departamentoId ||
      formErrors.responsable ||
      formErrors.ubicacionExacta
    ) {
      step = 2;
    } else if (
      formErrors.estadoFuncionamientoId ||
      formErrors.condicionFisicaId ||
      formErrors.observaciones
    ) {
      step = 3;
    } else if (
      formErrors.tipoIncorporacionId ||
      formErrors.facturaModo ||
      formErrors.facturaExistenteId ||
      formErrors.facturaPartida ||
      formErrors.importeAdquisicion ||
      formErrors.factura
    ) {
      step = 4;
    }

    setCurrentStep(step);

    pushToast({
      tone: "warning",
      title: "Faltan datos",
      description:
        "Te llevamos a la sección que necesita atención.",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function previousStep() {
    setSubmitError(null);

    setCurrentStep((step) =>
      Math.max(0, step - 1),
    );
  }

  async function onSubmit(
    formValues: EquipmentSchemaValues,
  ) {
    if (
      equipmentTypeCode !== "TABLET" &&
      !formValues.hostname.trim()
    ) {
      setError("hostname", {
        type: "manual",
        message:
          "El hostname es obligatorio para laptops y desktops.",
      });

      setCurrentStep(1);

      pushToast({
        tone: "warning",
        title: "Falta hostname",
        description:
          "Completa los datos técnicos antes de registrar el equipo.",
      });

      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const equipment =
        await createEquipment(
          formValues,
        );

      setCreated(equipment);

      pushToast({
        tone: "success",
        title: "Equipo registrado",
        description:
          equipment.numeroInventario,
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No fue posible registrar el equipo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function startAnother() {
    reset(defaultValues);
    setCreated(null);
    setSubmitError(null);
    setCurrentStep(0);
    setCompletedSteps(
      new Set(),
    );
  }

  if (catalogError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-5">
        <Surface
          material="floating"
          radius="large"
          className="max-w-lg p-7"
        >
          <InlineMessage
            tone="danger"
            title="No pudimos abrir el formulario"
          >
            {catalogError}
          </InlineMessage>

          <Button
            variant="secondary"
            className="mt-5"
            onClick={() => navigate("/")}
          >
            Volver al inicio
          </Button>
        </Surface>
      </main>
    );
  }

  if (!catalogs) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="text-(--accent)" />

          <div className="text-sm text-(--text-secondary)">
            Preparando formulario...
          </div>
        </div>
      </main>
    );
  }

  if (created) {
    return (
      <main className="flex min-h-screen items-center justify-center p-5">
        <motion.div
          initial={{
            opacity: 0,
            y: 18,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          className="w-full max-w-xl"
        >
          <Surface
            material="floating"
            radius="large"
            className="p-8"
          >
            <SuccessState
              title="Activo registrado"
              description={
                <>
                  El equipo quedó registrado
                  como{" "}
                  <strong>
                    {
                      created.numeroInventario
                    }
                  </strong>
                  .
                </>
              }
            />

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Button
                variant="secondary"
                onClick={() =>
                  navigate("/")
                }
                leftIcon={
                  <ArrowLeft size={15} />
                }
              >
                Ir al inicio
              </Button>

              <Button
                onClick={startAnother}
                leftIcon={
                  <RotateCcw size={15} />
                }
              >
                Registrar otro
              </Button>
            </div>
          </Surface>
        </motion.div>
      </main>
    );
  }

  const current =
    steps[currentStep];

  return (
    <EquipmentFormShell
      steps={steps}
      currentStep={currentStep}
      completedSteps={completedSteps}
      onStepChange={goToStep}
      preview={
        <EquipmentLivePreview
          values={
            values as EquipmentFormValues
          }
          catalogs={catalogs}
        />
      }
    >
      <form
        onSubmit={handleSubmit(
          onSubmit,
          handleInvalidSubmit,
        )}
      >
        <div className="mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--text-tertiary)">
            {current?.eyebrow} ·{" "}
            {current?.label}
          </div>

          <motion.h1
            key={current?.id}
            initial={{
              opacity: 0,
              y: 10,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="mt-2 max-w-3xl text-[clamp(2.35rem,5vw,4.7rem)] font-semibold leading-[0.96] tracking-[-0.065em]"
          >
            {currentStep === 0 &&
              "Empecemos por reconocer el activo."}

            {currentStep === 1 &&
              "Ahora, sólo los datos técnicos que importan."}

            {currentStep === 2 &&
              "Ponlo en el lugar correcto."}

            {currentStep === 3 &&
              "Cómo está, hoy."}

            {currentStep === 4 &&
              "De dónde viene este equipo."}

            {currentStep === 5 &&
              "Todo listo para registrar."}
          </motion.h1>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{
              opacity: 0,
              x: 18,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            exit={{
              opacity: 0,
              x: -14,
            }}
            transition={{
              duration: 0.24,
              ease: [
                0.22,
                1,
                0.36,
                1,
              ],
            }}
          >
            {currentStep === 0 && (
              <IdentificationStep
                register={register}
                control={control}
                errors={errors}
                catalogs={catalogs}
              />
            )}

            {currentStep === 1 && (
              <TechnicalStep
                register={register}
                errors={errors}
                equipmentTypeCode={
                  equipmentTypeCode
                }
              />
            )}

            {currentStep === 2 && (
              <AssignmentStep
                register={register}
                control={control}
                errors={errors}
                catalogs={catalogs}
              />
            )}

            {currentStep === 3 && (
              <StatusStep
                register={register}
                control={control}
                errors={errors}
                catalogs={catalogs}
              />
            )}

            {currentStep === 4 && (
              <AcquisitionStep
                register={register}
                control={control}
                errors={errors}
                catalogs={catalogs}
                incorporationCode={
                  incorporationCode
                }
                invoiceMode={
                  values.facturaModo
                }
              />
            )}

            {currentStep === 5 && (
              <ReviewStep
                values={
                  values as EquipmentFormValues
                }
                catalogs={catalogs}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {submitError && (
          <div className="mt-5">
            <InlineMessage tone="danger">
              {submitError}
            </InlineMessage>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={currentStep === 0}
            onClick={previousStep}
            leftIcon={
              <ArrowLeft size={15} />
            }
          >
            Atrás
          </Button>

          {currentStep <
          steps.length - 1 ? (
            <Button
              type="button"
              onClick={nextStep}
              rightIcon={
                <ArrowRight size={15} />
              }
            >
              Continuar
            </Button>
          ) : (
            <Button
              type="submit"
              loading={submitting}
              rightIcon={
                <Check size={15} />
              }
            >
              Registrar equipo
            </Button>
          )}
        </div>
      </form>
    </EquipmentFormShell>
  );
}
