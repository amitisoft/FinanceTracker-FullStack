import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import { getAccounts } from "../features/accounts/accountApi";
import { getCategories } from "../features/categories/categoriesApi";
import {
  createRecurring,
  deleteRecurring,
  getRecurring,
  updateRecurring,
  processDueRecurring,
} from "../features/recurring/recurringApi";
import { getApiErrorMessage } from "../lib/getApiErrorMessage";
import { formatCurrency, formatDate } from "../utils/format";
import AppShell from "../components/AppShell";

type RecurringType = "expense" | "income";
type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

type RecurringFormState = {
  title: string;
  type: RecurringType;
  amount: string;
  categoryId: string;
  accountId: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate: string;
  autoCreateTransaction: boolean;
};

type RecurringFormErrors = Partial<Record<keyof RecurringFormState, string>>;

const todayStr = new Date().toISOString().slice(0, 10);

const DEFAULT_VALUES: RecurringFormState = {
  title: "",
  type: "expense",
  amount: "",
  categoryId: "",
  accountId: "",
  frequency: "monthly",
  startDate: todayStr,
  endDate: "",
  autoCreateTransaction: true,
};

function isValidPositiveMoneyString(value: string) {
  if (value.trim() === "") return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 && Math.round(num * 100) === num * 100;
}

export default function RecurringPage() {
  const queryClient = useQueryClient();

  const { data: recurring, isLoading } = useQuery({
    queryKey: ["recurring"],
    queryFn: getRecurring,
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const [form, setForm] = useState<RecurringFormState>({ ...DEFAULT_VALUES });
  const [errors, setErrors] = useState<RecurringFormErrors>({});

  const createMutation = useMutation({
    mutationFn: createRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      setForm({ ...DEFAULT_VALUES });
      setErrors({});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateRecurring(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["forecast-month"] });
    },
  });

  const processMutation = useMutation({
    mutationFn: processDueRecurring,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });

  const filteredCategories = useMemo(
    () => categories?.filter((c: any) => c.type === form.type) ?? [],
    [categories, form.type]
  );

  function setField<K extends keyof RecurringFormState>(
    key: K,
    value: RecurringFormState[K]
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

  function validateForm(values: RecurringFormState): RecurringFormErrors {
    const nextErrors: RecurringFormErrors = {};

    const trimmedTitle = values.title.trim();
    if (!trimmedTitle) {
      nextErrors.title = "Title is required";
    } else if (trimmedTitle.length > 120) {
      nextErrors.title = "Title cannot exceed 120 characters";
    }

    if (!isValidPositiveMoneyString(values.amount)) {
      nextErrors.amount =
        "Amount must be greater than 0, with up to 2 decimals";
    }

    if (!values.categoryId) {
      nextErrors.categoryId = "Category is required";
    }

    if (!values.accountId) {
      nextErrors.accountId = "Account is required";
    }

    if (!values.startDate) {
      nextErrors.startDate = "Start date is required";
    } else if (values.startDate < todayStr) {
      nextErrors.startDate = "Start date cannot be in the past";
    }

    if (values.endDate && values.startDate && values.endDate < values.startDate) {
      nextErrors.endDate = "End date cannot be before start date";
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

    createMutation.mutate({
      title: form.title.trim(),
      type: form.type,
      amount: Number(form.amount),
      categoryId: form.categoryId,
      accountId: form.accountId,
      frequency: form.frequency,
      startDate: `${form.startDate}T00:00:00Z`,
      endDate: form.endDate ? `${form.endDate}T00:00:00Z` : null,
      autoCreateTransaction: form.autoCreateTransaction,
    });
  }

  return (
    <AppShell title="Recurring">
      <div className="space-y-4 p-3 sm:space-y-6 sm:p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">
              Recurring
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Automation layer
            </h2>
          </div>

          <button
            onClick={() => processMutation.mutate(new Date().toISOString())}
            disabled={processMutation.isPending}
            className="w-full rounded-2xl bg-white/12 px-5 py-3 text-white transition hover:bg-white/20 disabled:opacity-50 sm:w-auto"
          >
            {processMutation.isPending ? "Processing..." : "Process Due"}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[420px_1fr]">
          <GlassCard className="p-4 sm:p-6">
            <h3 className="mb-5 text-lg font-semibold text-white">
              Create recurring item
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <NeonInput
                label="Title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                error={errors.title}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setField("type", e.target.value as RecurringType)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="expense" className="text-black">
                    Expense
                  </option>
                  <option value="income" className="text-black">
                    Income
                  </option>
                </select>
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
                <label className="block text-sm font-medium text-white/80">
                  Account
                </label>
                <select
                  value={form.accountId}
                  onChange={(e) => setField("accountId", e.target.value)}
                  className={`w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none ${
                    errors.accountId ? "border-rose-500/50" : ""
                  }`}
                >
                  <option value="" className="text-black">
                    Select account
                  </option>
                  {accounts?.map((a: any) => (
                    <option key={a.id} value={a.id} className="text-black">
                      {a.name}
                    </option>
                  ))}
                </select>
                {errors.accountId && (
                  <p className="text-sm text-rose-300">{errors.accountId}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Category
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setField("categoryId", e.target.value)}
                  className={`w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none ${
                    errors.categoryId ? "border-rose-500/50" : ""
                  }`}
                >
                  <option value="" className="text-black">
                    Select category
                  </option>
                  {filteredCategories.map((c: any) => (
                    <option key={c.id} value={c.id} className="text-black">
                      {c.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-sm text-rose-300">{errors.categoryId}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Frequency
                </label>
                <select
                  value={form.frequency}
                  onChange={(e) =>
                    setField("frequency", e.target.value as RecurringFrequency)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="daily" className="text-black">
                    Daily
                  </option>
                  <option value="weekly" className="text-black">
                    Weekly
                  </option>
                  <option value="monthly" className="text-black">
                    Monthly
                  </option>
                  <option value="yearly" className="text-black">
                    Yearly
                  </option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <NeonInput
                  label="Start Date"
                  type="date"
                  min={todayStr}
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  error={errors.startDate}
                />
                <NeonInput
                  label="End Date"
                  type="date"
                  min={form.startDate || todayStr}
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                  error={errors.endDate}
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white">
                <input
                  type="checkbox"
                  checked={form.autoCreateTransaction}
                  onChange={(e) =>
                    setField("autoCreateTransaction", e.target.checked)
                  }
                />
                <span className="text-sm">Auto create transaction</span>
              </label>

              {createMutation.isError && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3">
                  <p className="text-sm font-medium text-rose-200">
                    {getApiErrorMessage(
                      createMutation.error,
                      "Failed to create recurring item."
                    )}
                  </p>
                </div>
              )}

              <button
                disabled={createMutation.isPending}
                className="w-full rounded-2xl border border-cyan-400/30 bg-cyan-500/20 px-4 py-4 text-cyan-100 transition hover:bg-cyan-500/30 disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating..." : "Create Recurring"}
              </button>
            </form>
          </GlassCard>

          <GlassCard className="p-4 sm:p-6">
            <h3 className="mb-5 text-lg font-semibold text-white">
              Scheduled items
            </h3>

            {isLoading ? (
              <p className="text-sm italic text-white/55">
                Syncing with automation layer...
              </p>
            ) : (
              <div className="space-y-4">
                {recurring?.map((item: any) => (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl border border-white/8 bg-white/6 p-5 transition hover:bg-white/10"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-white break-words">
                          {item.title}
                        </p>
                        <p className="text-sm text-white/50">
                          <span className="capitalize">{item.type}</span> •{" "}
                          <span className="capitalize">{item.frequency}</span> •
                          Next run: {formatDate(item.nextRunDate)}
                          {item.isPaused ? " • Paused" : ""}
                        </p>
                        <p
                          className={`mt-2 font-mono text-xl ${
                            item.type === "expense"
                              ? "text-rose-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {item.type === "expense" ? "-" : "+"}
                          {formatCurrency(item.amount)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateMutation.mutate({
                              id: item.id,
                              payload: {
                                title: item.title,
                                type: item.type,
                                amount: item.amount,
                                categoryId: item.categoryId ?? null,
                                accountId: item.accountId ?? null,
                                frequency: item.frequency,
                                startDate: item.startDate,
                                endDate: item.endDate ?? null,
                                nextRunDate: item.nextRunDate,
                                autoCreateTransaction: item.autoCreateTransaction,
                                isPaused: !item.isPaused,
                              },
                            })
                          }
                          className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-sm text-white/80 transition hover:bg-white/14 disabled:opacity-50"
                          disabled={updateMutation.isPending}
                        >
                          {item.isPaused ? "Resume" : "Pause"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Are you sure you want to stop this automation?")) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {!recurring?.length && (
                  <div className="py-12 text-center">
                    <p className="text-sm text-white/30">
                      No active automated transactions found.
                    </p>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
