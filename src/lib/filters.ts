export type FilterConfig = {
  id: string;
  name: string;
  className: string;
};

export const AESTHETIC_FILTERS: FilterConfig[] = [
  { id: "none", name: "Clean", className: "" },
  { id: "promist", name: "Pro Mist 1/4", className: "contrast-[0.95] brightness-[1.05]" },
  { id: "whitemist", name: "White Mist", className: "contrast-[0.9] brightness-110" },
  { id: "roseglow", name: "Rose Glow", className: "sepia-[0.2] contrast-[0.95] hue-rotate-[-5deg]" },
  { id: "retrosoft", name: "Retro Soft", className: "contrast-[0.85] sepia-[0.15] saturate-[0.8]" },
  { id: "vintage", name: "Disposable", className: "contrast-125 saturate-110 brightness-110 sepia-[0.1] hue-rotate-[10deg]" },
  { id: "bw", name: "B&W Film", className: "grayscale contrast-125 brightness-110" }
];

export const getFilterClass = (filterId?: string) => {
  const filter = AESTHETIC_FILTERS.find(f => f.id === filterId);
  return filter ? filter.className : "";
};
