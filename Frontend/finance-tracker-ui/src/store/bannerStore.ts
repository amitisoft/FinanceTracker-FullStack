import { create } from "zustand";

export type BannerVariant = "info" | "success" | "warning" | "error";

type BannerState = {
  message: string;
  description?: string;
  variant: BannerVariant;
  visible: boolean;
  setBanner: (message: string, options?: { description?: string; variant?: BannerVariant }) => void;
  clearBanner: () => void;
};

export const bannerStore = create<BannerState>((set) => ({
  message: "",
  description: undefined,
  variant: "info",
  visible: false,
  setBanner: (message, options) =>
    set({
      message,
      description: options?.description,
      variant: options?.variant ?? "info",
      visible: true,
    }),
  clearBanner: () => set({ visible: false }),
}));
