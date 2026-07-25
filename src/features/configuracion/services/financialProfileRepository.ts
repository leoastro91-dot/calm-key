/**
 * Re-export del repositorio de LOVABLE-002 para respetar el límite del slice
 * de configuración (Vertical Slice Architecture). No duplicamos código: el
 * método `updateDistribution` vive en el repositorio original.
 */
export { financialProfileRepository } from "@/features/onboarding/services/financialProfileRepository";
