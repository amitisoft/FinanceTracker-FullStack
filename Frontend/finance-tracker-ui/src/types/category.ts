export type Category = {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  icon?: string | null;
  isArchived: boolean;
};

export type CreateCategoryRequest = {
  name: string;
  type: string;
  color?: string;
  icon?: string;
};