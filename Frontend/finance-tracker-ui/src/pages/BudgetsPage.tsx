import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import { getCategories } from "../features/categories/categoriesApi";
import {
  createBudget,
  deleteBudget,
  getBudgets,
} from "../features/budgets/budgetApi";
import { getApiErrorMessage } from "../lib/getApiErrorMessage";
import { formatCurrency } from "../utils/format";
import { useToast } from "../components/ToastProvider";

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

type BudgetFormState = {
  categoryId: string;
  month: string;
  year: string;
  amount: string;
  alertThresholdPercent: string;
};

type BudgetFormErrors = Partial<Record<keyof BudgetFormState, string>>;

const DEFAULT_VALUES: BudgetFormState = {
  categoryId: "",
  month: String(currentMonth),
  year: String(currentYear),
  amount: "",
  alertThresholdPercent: "80",
};

function isValidPositiveMoneyString(value: string) {
  if (value.trim() === "") return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 && Math.round(num * 100) === num * 100;
}

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [dupMessage, setDupMessage] = useState<string>("");

  const [form, setForm] = useState<BudgetFormState>({ ...DEFAULT_VALUES });
  const [errors, setErrors] = useState<BudgetFormErrors>({});

  const { data: categories } = useQuery({
    queryKey: ["categories", "expense"],
    queryFn: () => getCategories("expense"),
  });

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["budgets", selectedMonth, selectedYear],
    queryFn: () => getBudgets(selectedMonth, selectedYear),
  });

  const filteredBudgets = useMemo(() => {
    if (!budgets) return [];
    return budgets.filter((b: any) =>
      b.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [budgets, searchTerm]);

  const totals = useMemo(() => {
    if (!budgets) return { budgeted: 0, spent: 0 };
    return budgets.reduce(
      (acc: any, curr: any) => ({
        budgeted: acc.budgeted + curr.amount,
        spent: acc.spent + curr.spent,
      }),
      { budgeted: 0, spent: 0 }
    );
  }, [budgets]);

  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: (_data, variables) => {
      setSelectedMonth(variables.month);
      setSelectedYear(variables.year);

      queryClient.invalidateQueries({
        queryKey: ["budgets", variables.month, variables.year],
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });

      setForm({
        ...DEFAULT_VALUES,
        month: String(variables.month),
        year: String(variables.year),
      });
      setErrors({});
      pushToast({ title: "Budget saved", variant: "success" });
    },
    onError: (error) => {
      pushToast({
        title: "Failed to create budget",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "error",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["budgets", selectedMonth, selectedYear],
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      pushToast({ title: "Budget deleted", variant: "info" });
    },
    onError: (error) => {
      pushToast({
        title: "Failed to delete budget",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "error",
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

      const prevBudgets = await getBudgets(prevMonth, prevYear);
      if (!prevBudgets.length) {
        return { created: 0, skipped: 0, total: 0 };
      }

      let created = 0;
      let skipped = 0;

      for (const b of prevBudgets as any[]) {
        try {
          await createBudget({
            categoryId: b.categoryId,
            month: selectedMonth,
            year: selectedYear,
            amount: b.amount,
            alertThresholdPercent: b.alertThresholdPercent ?? 80,
          });
          created++;
        } catch {
          skipped++;
        }
      }

      return { created, skipped, total: prevBudgets.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["budgets", selectedMonth, selectedYear],
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });

      if (result.total === 0) {
        setDupMessage("No previous-month budgets found to duplicate.");
        pushToast({ title: "No budgets to duplicate", variant: "info" });
      } else {
        setDupMessage(
          `Duplicated ${result.created}/${result.total} budgets (skipped ${result.skipped}).`
        );
        pushToast({
          title: "Budgets duplicated",
          description: `Created ${result.created}, skipped ${result.skipped}.`,
          variant: "success",
        });
      }

      setTimeout(() => setDupMessage(""), 6000);
    },
    onError: (error) => {
      pushToast({
        title: "Failed to duplicate budgets",
        description: getApiErrorMessage(error, "Please try again."),
        variant: "error",
      });
    },
  });

  function setField<K extends keyof BudgetFormState>(
    key: K,
    value: BudgetFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleMoneyChange(rawValue: string) {
    if (rawValue === "") {
      setField("amount", "");
      return;
    }

    if (!/^\d*\.?\d{0,2}$/.test(rawValue)) {
      return;
    }

    setField("amount", rawValue);
  }

  function validateForm(values: BudgetFormState): BudgetFormErrors {
    const nextErrors: BudgetFormErrors = {};

    if (!values.categoryId) {
      nextErrors.categoryId = "Category is required";
    }

    if (!values.month.trim()) {
      nextErrors.month = "Month is required";
    } else {
      const n = Number(values.month);
      if (!Number.isInteger(n) || n < 1 || n > 12) {
        nextErrors.month = "Month must be between 1 and 12";
      }
    }

    if (!values.year.trim()) {
      nextErrors.year = "Year is required";
    } else {
      const n = Number(values.year);
      if (!Number.isInteger(n) || n < currentYear || n > 2100) {
        nextErrors.year = `Year must be between ${currentYear} and 2100`;
      }
    }

    if (!isValidPositiveMoneyString(values.amount)) {
      nextErrors.amount =
        "Amount must be greater than 0, with up to 2 decimals";
    }

    if (!["80", "100", "120"].includes(values.alertThresholdPercent)) {
      nextErrors.alertThresholdPercent =
        "Alert threshold must be 80, 100, or 120";
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
      categoryId: form.categoryId,
      month: Number(form.month),
      year: Number(form.year),
      amount: Number(form.amount),
      alertThresholdPercent: Number(form.alertThresholdPercent),
    };

    setSelectedMonth(payload.month);
    setSelectedYear(payload.year);

    createMutation.mutate(payload);
  }

  return (
      <div className="space-y-4 p-3 sm:space-y-6 sm:p-4">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">
              Budgets
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Spending control
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-2">
              <p className="text-[10px] uppercase text-white/40">
                Total Budgeted
              </p>
              <p className="text-lg font-medium text-white">
                {formatCurrency(totals.budgeted)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/5 px-4 py-2">
              <p className="text-[10px] uppercase text-white/40">Total Spent</p>
              <p className="text-lg font-medium text-cyan-400">
                {formatCurrency(totals.spent)}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[400px_1fr]">
          <GlassCard className="h-fit p-4 sm:p-6">
            <h3 className="mb-5 text-lg font-semibold text-white">New Limit</h3>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label className="text-sm text-white/70">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setField("categoryId", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 p-4 text-white outline-none focus:border-cyan-500/50"
                >
                  <option value="" className="text-black">
                    Select...
                  </option>
                  {categories?.map((c: any) => (
                    <option key={c.id} value={c.id} className="text-black">
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-xs text-rose-400">{errors.categoryId}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NeonInput
                  label="Month"
                  type="number"
                  min="1"
                  max="12"
                  value={form.month}
                  onChange={(e) => setField("month", e.target.value)}
                  error={errors.month}
                />

                <NeonInput
                  label="Year"
                  type="number"
                  min={String(currentYear)}
                  max="2100"
                  value={form.year}
                  onChange={(e) => setField("year", e.target.value)}
                  error={errors.year}
                />
              </div>

              <NeonInput
                label="Amount"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => handleMoneyChange(e.target.value)}
                error={errors.amount}
              />

              <div className="space-y-2">
                <label className="text-sm text-white/70">Alert threshold</label>
                <select
                  value={form.alertThresholdPercent}
                  onChange={(e) =>
                    setField("alertThresholdPercent", e.target.value)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/8 p-4 text-white outline-none focus:border-cyan-500/50"
                >
                  <option value="80" className="text-black">
                    80%
                  </option>
                  <option value="100" className="text-black">
                    100%
                  </option>
                  <option value="120" className="text-black">
                    120%
                  </option>
                </select>
                {errors.alertThresholdPercent && (
                  <p className="text-xs text-rose-400">
                    {errors.alertThresholdPercent}
                  </p>
                )}
              </div>

              {createMutation.isError && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3">
                  <p className="text-sm font-medium text-rose-200">
                    {getApiErrorMessage(
                      createMutation.error,
                      "Failed to create budget."
                    )}
                  </p>
                </div>
              )}

              <button
                disabled={createMutation.isPending}
                className="w-full rounded-2xl border border-cyan-500/40 bg-cyan-500/20 p-4 text-white transition-all hover:bg-cyan-500/30 disabled:opacity-50"
              >
                {createMutation.isPending ? "Syncing..." : "Set Budget"}
              </button>
            </form>
          </GlassCard>

          <GlassCard className="p-4 sm:p-6">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-white">Active Budgets</h3>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <div className="flex shrink-0 gap-2">
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value || currentMonth))}
                    className="w-24 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
                  />
                  <input
                    type="number"
                    min={2000}
                    max={2100}
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value || currentYear))}
                    className="w-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500/50"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => duplicateMutation.mutate()}
                  disabled={duplicateMutation.isPending}
                  className="shrink-0 rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/70 disabled:opacity-50"
                >
                  {duplicateMutation.isPending ? "Duplicating..." : "Duplicate prev month"}
                </button>

                <input
                  type="text"
                  placeholder="Search category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-cyan-500/50 sm:min-w-[220px]"
                />
              </div>
            </div>

            {dupMessage ? (
              <div className="mb-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100/90">
                {dupMessage}
              </div>
            ) : null}

            {isLoading ? (
              <div className="py-20 text-center text-white/40">
                Loading budgets...
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBudgets.map((budget: any) => {
                  const progress =
                    budget.amount > 0
                      ? Math.min((budget.spent / budget.amount) * 100, 100)
                      : 0;

                  return (
                    <div
                      key={budget.id}
                      className="group rounded-2xl border border-white/5 bg-white/4 p-5 transition-all hover:bg-white/6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-medium text-white break-words">
                            {budget.categoryName}
                          </h4>
                          <p className="text-xs uppercase text-white/40">
                            {budget.month}/{budget.year} • Alert at{" "}
                            {budget.alertThresholdPercent}%
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            window.confirm("Delete?") &&
                            deleteMutation.mutate(budget.id)
                          }
                          className="px-2 py-1 text-sm text-rose-400/60 hover:text-rose-400"
                        >
                          Delete
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
                        <div className="text-center sm:text-left">
                          <p className="text-[10px] uppercase text-white/30">
                            Goal
                          </p>
                          <p className="text-sm font-medium text-white">
                            {formatCurrency(budget.amount)}
                          </p>
                        </div>

                        <div className="text-center sm:text-left">
                          <p className="text-[10px] uppercase text-white/30">
                            Actual
                          </p>
                          <p
                            className={`text-sm font-medium ${
                              budget.spent > budget.amount
                                ? "text-rose-400"
                                : "text-white"
                            }`}
                          >
                            {formatCurrency(budget.spent)}
                          </p>
                        </div>

                        <div className="text-center sm:text-left">
                          <p className="text-[10px] uppercase text-white/30">
                            Left
                          </p>
                          <p
                            className={`text-sm font-medium ${
                              budget.remaining < 0
                                ? "text-rose-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {formatCurrency(budget.remaining)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full transition-all duration-500 ${
                            budget.spent > budget.amount
                              ? "bg-rose-500"
                              : "bg-cyan-500"
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {filteredBudgets.length === 0 && (
                  <div className="py-20 text-center italic text-white/20">
                    No matching budgets found.
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
  );
}
