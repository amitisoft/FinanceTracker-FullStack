import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import { getCategories } from "../features/categories/categoriesApi";
import { createRule, deleteRule, getRules, updateRule } from "../features/rules/ruleApi";
import type { Rule } from "../types/rule";

const fields = ["merchant", "note", "amount", "type"] as const;
const operators = ["equals", "contains", "gt", "gte", "lt", "lte"] as const;

export default function RulesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    field: "merchant",
    operator: "contains",
    value: "",
    categoryId: "",
    isEnabled: true,
  });

  const { data: rules } = useQuery({ queryKey: ["rules"], queryFn: getRules });
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => getCategories() });

  const createMutation = useMutation({
    mutationFn: createRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules"] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateRule(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules"] }),
  });

  const canSubmit = useMemo(() => form.name.trim() && form.value.trim(), [form]);

  return (
      <div className="space-y-6 p-3 sm:p-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">Automation</p>
          <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Rules Engine</h2>
          <p className="mt-2 text-white/55">Auto-categorize or alert based on transaction attributes.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <GlassCard className="p-5">
            <h3 className="mb-4 text-lg font-semibold text-white">Create rule</h3>
            <div className="space-y-3">
              <NeonInput
                label="Rule name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/70">Field</label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white"
                    value={form.field}
                    onChange={(e) => setForm({ ...form, field: e.target.value })}
                  >
                    {fields.map((f) => (
                      <option key={f} value={f} className="text-black">
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/70">Operator</label>
                  <select
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white"
                    value={form.operator}
                    onChange={(e) => setForm({ ...form, operator: e.target.value })}
                  >
                    {operators.map((op) => (
                      <option key={op} value={op} className="text-black">
                        {op}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <NeonInput
                label="Match value"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />

              <div>
                <label className="block text-sm text-white/70">Set category</label>
                <select
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-white"
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                >
                  <option value="" className="text-black">No change</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id} className="text-black">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={form.isEnabled}
                  onChange={(e) => setForm({ ...form, isEnabled: e.target.checked })}
                />
                Enabled
              </label>

              <button
                className="w-full rounded-2xl bg-white/12 px-4 py-3 text-white disabled:opacity-50"
                disabled={!canSubmit || createMutation.isPending}
                onClick={() =>
                  createMutation.mutate({
                    name: form.name,
                    field: form.field,
                    operator: form.operator,
                    value: form.value,
                    categoryId: form.categoryId || null,
                    isEnabled: form.isEnabled,
                  })
                }
              >
                {createMutation.isPending ? "Saving..." : "Save rule"}
              </button>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-4 text-lg font-semibold text-white">Existing rules</h3>
            <div className="space-y-3">
              {(rules ?? []).length === 0 ? (
                <p className="text-sm text-white/55">No rules yet.</p>
              ) : (
                (rules as Rule[]).map((rule) => (
                  <div key={rule.id} className="rounded-2xl border border-white/10 bg-white/6 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{rule.name}</p>
                        <p className="text-xs text-white/50">{rule.field} {rule.operator} {rule.value}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                          onClick={() =>
                            updateMutation.mutate({
                              id: rule.id,
                              payload: { ...rule, isEnabled: !rule.isEnabled },
                            })
                          }
                        >
                          {rule.isEnabled ? "Disable" : "Enable"}
                        </button>
                        <button
                          className="rounded-full border border-rose-500/30 px-3 py-1 text-xs text-rose-200"
                          onClick={() => deleteMutation.mutate(rule.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>
  );
}
