export type Rule = {
  id: string;
  name: string;
  field: string;
  operator: string;
  value: string;
  categoryId?: string | null;
  isEnabled: boolean;
};

export type UpsertRuleInput = {
  name: string;
  field: string;
  operator: string;
  value: string;
  categoryId?: string | null;
  isEnabled: boolean;
};
