export const motionDurations = {
  micro: 0.14,
  control: 0.2,
  panel: 0.3,
  page: 0.42,
} as const;

export const motionEase = {
  standard: [0.22, 1, 0.36, 1] as const,
  emphasized: [0.16, 1, 0.3, 1] as const,
};

export const springSoft = {
  type: "spring" as const,
  stiffness: 260,
  damping: 28,
  mass: 0.8,
};
