import { api } from "../../api/client";
import type { DemoClearResult, DemoSeedResult } from "../../types/demo";

export const seedDemoData = async () => {
  const response = await api.post<DemoSeedResult>("/api/demo/seed");
  return response.data;
};

export const clearDemoData = async () => {
  const response = await api.post<DemoClearResult>("/api/demo/clear");
  return response.data;
};
