import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { archiveCategory, createCategory, getCategories, updateCategory } from "../features/categories/categoriesApi";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import { getApiErrorMessage } from "../lib/getApiErrorMessage";

type CategoryType = "expense" | "income";

type CategoryFormState = {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
};

type CategoryFormErrors = Partial<Record<keyof CategoryFormState, string>>;

const DEFAULT_VALUES: CategoryFormState = {
  name: "",
  type: "expense",
  color: "",
  icon: "",
};

export default function CategoriesPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const [form, setForm] = useState<CategoryFormState>({ ...DEFAULT_VALUES });
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setForm({ ...DEFAULT_VALUES });
      setErrors({});
      setEditingId(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setForm({ ...DEFAULT_VALUES });
      setErrors({});
      setEditingId(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: archiveCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  function setField<K extends keyof CategoryFormState>(
    key: K,
    value: CategoryFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateForm(values: CategoryFormState): CategoryFormErrors {
    const nextErrors: CategoryFormErrors = {};

    const trimmedName = values.name.trim();
    if (!trimmedName) {
      nextErrors.name = "Name is required";
    } else if (trimmedName.length > 100) {
      nextErrors.name = "Name cannot exceed 100 characters";
    }

    if (!values.type) {
      nextErrors.type = "Type is required";
    }

    if (
      values.color.trim() &&
      !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(values.color.trim())
    ) {
      nextErrors.color = "Color must be a valid hex value";
    }

    return nextErrors;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      color: form.color.trim() || undefined,
      icon: form.icon.trim() || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      mutation.mutate(payload);
    }
  }

  return (
      <div className="space-y-4 p-3 sm:space-y-6 sm:p-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">
            Categories
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Organize your spending
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[380px_1fr]">
          <GlassCard className="p-4 sm:p-6">
            <h3 className="mb-5 text-lg font-semibold text-white">
              {editingId ? "Edit category" : "Create category"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <NeonInput
                label="Name"
                placeholder="Pets"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                error={errors.name}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value as CategoryType)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="expense" className="text-black">
                    Expense
                  </option>
                  <option value="income" className="text-black">
                    Income
                  </option>
                </select>
                {errors.type && (
                  <p className="text-sm text-rose-300">{errors.type}</p>
                )}
              </div>

              <NeonInput
                label="Color"
                placeholder="#A855F7"
                value={form.color}
                onChange={(e) => setField("color", e.target.value)}
                error={errors.color}
              />

              <NeonInput
                label="Icon"
                placeholder="paw"
                value={form.icon}
                onChange={(e) => setField("icon", e.target.value)}
                error={errors.icon}
              />

              {(mutation.isError || updateMutation.isError) && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3">
                  <p className="text-sm font-medium text-rose-200">
                    {getApiErrorMessage(
                      (mutation.error ?? updateMutation.error) as any,
                      editingId ? "Failed to update category." : "Failed to create category."
                    )}
                  </p>
                </div>
              )}

              <button
                disabled={mutation.isPending || updateMutation.isPending}
                className="w-full rounded-2xl bg-white/12 px-4 py-4 text-white transition hover:bg-white/16 disabled:opacity-50"
              >
                {mutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingId
                    ? "Update Category"
                    : "Create Category"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-4 text-white/80 transition hover:bg-white/10"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ ...DEFAULT_VALUES });
                    setErrors({});
                  }}
                >
                  Cancel edit
                </button>
              )}
            </form>
          </GlassCard>

          <GlassCard className="p-4 sm:p-6">
            <h3 className="mb-5 text-lg font-semibold text-white">
              Existing categories
            </h3>

            {isLoading ? (
              <p className="text-sm text-white/55">Loading categories...</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {data?.map((item: any) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/8 bg-white/6 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-semibold text-white break-words">
                        {item.name}
                      </p>
                      <span className="text-sm text-white/45">{item.type}</span>
                    </div>
                    <p className="mt-2 text-sm text-white/50">
                      {item.icon || "no-icon"} • {item.color || "no-color"}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-xs text-white/80 transition hover:bg-white/10"
                        onClick={() => {
                          setEditingId(item.id);
                          setForm({
                            name: item.name ?? "",
                            type: (item.type ?? "expense") as CategoryType,
                            color: item.color ?? "",
                            icon: item.icon ?? "",
                          });
                          setErrors({});
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
                        disabled={archiveMutation.isPending}
                        onClick={() => archiveMutation.mutate(item.id)}
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
  );
}
