import { api } from "../../api/client";
import type { Category, CreateCategoryRequest } from "../../types/category";

export const getCategories = async (type?: string) => {
  const response = await api.get<Category[]>("/api/categories", {
    params: {
      type,
      includeArchived: false,
    },
  });

  return response.data;
};

export const createCategory = async (payload: CreateCategoryRequest) => {
  const response = await api.post<Category>("/api/categories", payload);
  return response.data;
};