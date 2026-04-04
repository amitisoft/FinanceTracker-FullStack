import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import {
  createGoal,
  getGoals,
  contributeGoal,
  withdrawGoal,
} from "../features/goals/goalsApi";
import { getAccounts } from "../features/accounts/accountApi";
import { getApiErrorMessage } from "../lib/getApiErrorMessage";
import { formatCurrency } from "../utils/format";

type GoalFormState = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  linkedAccountId: string;
  icon: string;
  color: string;
};

type GoalFormErrors = Partial<Record<keyof GoalFormState, string>>;

const DEFAULT_VALUES: GoalFormState = {
  name: "",
  targetAmount: "",
  currentAmount: "",
  targetDate: "",
  linkedAccountId: "",
  icon: "",
  color: "",
};

const todayStr = new Date().toISOString().slice(0, 10);

function isValidPositiveMoneyString(value: string) {
  if (value.trim() === "") return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 && Math.round(num * 100) === num * 100;
}

function isValidNonNegativeMoneyString(value: string) {
  if (value.trim() === "") return true;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 && Math.round(num * 100) === num * 100;
}

export default function GoalsPage() {
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: getGoals,
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const [form, setForm] = useState<GoalFormState>({ ...DEFAULT_VALUES });
  const [errors, setErrors] = useState<GoalFormErrors>({});

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setForm({ ...DEFAULT_VALUES });
      setErrors({});
    },
  });

  const contributeMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      contributeGoal(id, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      withdrawGoal(id, { amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  function setField<K extends keyof GoalFormState>(
    key: K,
    value: GoalFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleMoneyChange(
    key: "targetAmount" | "currentAmount",
    rawValue: string
  ) {
    if (rawValue === "") {
      setField(key, "");
      return;
    }

    if (!/^\d*\.?\d{0,2}$/.test(rawValue)) {
      return;
    }

    setField(key, rawValue);
  }

  function validateForm(values: GoalFormState): GoalFormErrors {
    const nextErrors: GoalFormErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = "Name is required";
    }

    if (!isValidPositiveMoneyString(values.targetAmount)) {
      nextErrors.targetAmount =
        "Target amount must be greater than 0, with up to 2 decimals";
    }

    if (!isValidNonNegativeMoneyString(values.currentAmount)) {
      nextErrors.currentAmount =
        "Current amount must be 0 or more, with up to 2 decimals";
    }

    if (values.targetDate && values.targetDate < todayStr) {
      nextErrors.targetDate = "Date cannot be in the past";
    }

    return nextErrors;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    createMutation.mutate({
      name: form.name.trim(),
      targetAmount: Number(form.targetAmount),
      currentAmount:
        form.currentAmount.trim() === "" ? 0 : Number(form.currentAmount),
      targetDate: form.targetDate ? `${form.targetDate}T00:00:00Z` : null,
      linkedAccountId: form.linkedAccountId || undefined,
      icon: form.icon.trim() || undefined,
      color: form.color.trim() || undefined,
    });
  }

  return (
      <div className="space-y-4 p-3 sm:space-y-6 sm:p-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">
            Goals
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Savings missions
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[420px_1fr]">
          <GlassCard className="p-4 sm:p-6">
            <h3 className="mb-5 text-lg font-semibold text-white">Create goal</h3>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <NeonInput
                label="Name"
                placeholder="Enter goal name"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                error={errors.name}
              />

              <NeonInput
                label="Target amount"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={form.targetAmount}
                onChange={(e) => handleMoneyChange("targetAmount", e.target.value)}
                error={errors.targetAmount}
              />

              <NeonInput
                label="Current amount"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="0.00"
                value={form.currentAmount}
                onChange={(e) => handleMoneyChange("currentAmount", e.target.value)}
                error={errors.currentAmount}
              />

              <NeonInput
                label="Target Date"
                type="date"
                min={todayStr}
                value={form.targetDate}
                onChange={(e) => setField("targetDate", e.target.value)}
                error={errors.targetDate}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Linked account
                </label>
                <select
                  value={form.linkedAccountId}
                  onChange={(e) => setField("linkedAccountId", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-white outline-none"
                >
                  <option value="" className="text-black">Optional</option>
                  {accounts?.map((a: any) => (
                    <option key={a.id} value={a.id} className="text-black">
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NeonInput
                  label="Icon (emoji)"
                  placeholder="🎯"
                  value={form.icon}
                  onChange={(e) => setField("icon", e.target.value)}
                />
                <NeonInput
                  label="Color (hex)"
                  placeholder="#22d3ee"
                  value={form.color}
                  onChange={(e) => setField("color", e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending}
                className="mt-4 w-full rounded-2xl border border-cyan-500/30 bg-cyan-500/20 px-4 py-4 text-white transition hover:bg-cyan-500/40 disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating..." : "Create Goal"}
              </button>

              {createMutation.isError && (
                <p className="mt-2 text-center text-sm text-rose-400">
                  {getApiErrorMessage(
                    createMutation.error,
                    "Failed to create goal."
                  )}
                </p>
              )}
            </form>
          </GlassCard>

          <GlassCard className="p-4 sm:p-6">
            <h3 className="mb-5 text-lg font-semibold text-white">
              Existing goals
            </h3>

            {isLoading ? (
              <p className="text-white/50">Loading...</p>
            ) : !goals?.length ? (
              <p className="text-white/50">No goals found.</p>
            ) : (
              <div className="space-y-4">
                {goals.map((goal: any) => (
                  <div
                    key={goal.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-lg font-bold text-white break-words">
                        {goal.icon ? `${goal.icon} ` : ""}
                        {goal.name}
                      </span>
                      <span className="font-mono text-cyan-400">
                        {Number(goal.progressPercent || 0).toFixed(2)}%
                      </span>
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(Number(goal.progressPercent || 0), 100)}%`,
                        }}
                      />
                    </div>

                    <div className="mt-4 flex justify-between gap-3 text-sm">
                      <span className="text-white/60">
                        Current: {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-white/60">
                        Target: {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() =>
                          contributeMutation.mutate({ id: goal.id, amount: 100 })
                        }
                        disabled={contributeMutation.isPending}
                        className="rounded-xl border border-emerald-400/30 bg-emerald-500/20 px-3 py-2 text-sm text-white transition hover:bg-emerald-500/30 disabled:opacity-50"
                      >
                        + Add ₹100
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          withdrawMutation.mutate({ id: goal.id, amount: 100 })
                        }
                        disabled={withdrawMutation.isPending}
                        className="rounded-xl border border-amber-400/30 bg-amber-500/20 px-3 py-2 text-sm text-white transition hover:bg-amber-500/30 disabled:opacity-50"
                      >
                        - Withdraw ₹100
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
