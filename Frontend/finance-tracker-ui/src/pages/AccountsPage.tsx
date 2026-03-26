import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccounts, createAccount } from "../features/accounts/accountApi";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import { getApiErrorMessage } from "../lib/getApiErrorMessage";
import { formatCurrency } from "../utils/format";
import AppShell from "../components/AppShell";

type AccountType = "bank" | "cash" | "savings" | "credit_card";

type AccountFormState = {
  name: string;
  type: AccountType;
  openingBalance: string;
  institutionName: string;
};

type AccountFormErrors = Partial<Record<keyof AccountFormState, string>>;

const DEFAULT_VALUES: AccountFormState = {
  name: "",
  type: "bank",
  openingBalance: "",
  institutionName: "",
};

function isValidMoneyString(value: string) {
  if (value.trim() === "") return false;
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 && Math.round(num * 100) === num * 100;
}

export default function AccountsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const [form, setForm] = useState<AccountFormState>(DEFAULT_VALUES);
  const [errors, setErrors] = useState<AccountFormErrors>({});

  const mutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setForm({ ...DEFAULT_VALUES });
      setErrors({});
    },
  });

  const isSubmitting = mutation.isPending;
  const canSubmit = useMemo(() => !isSubmitting, [isSubmitting]);

  function setField<K extends keyof AccountFormState>(
    key: K,
    value: AccountFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleNonNegativeNumberChange(
    key: "openingBalance",
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

  function validateForm(values: AccountFormState): AccountFormErrors {
    const nextErrors: AccountFormErrors = {};

    const trimmedName = values.name.trim();
    if (!trimmedName) {
      nextErrors.name = "Account name is required";
    } else if (trimmedName.length > 100) {
      nextErrors.name = "Account name cannot exceed 100 characters";
    }

    if (!values.type) {
      nextErrors.type = "Type is required";
    }

    if (values.openingBalance.trim() === "") {
      nextErrors.openingBalance = "Opening balance is required";
    } else if (!isValidMoneyString(values.openingBalance)) {
      nextErrors.openingBalance =
        "Opening balance must be 0 or more, with up to 2 decimals";
    }

    return nextErrors;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    mutation.mutate({
      name: form.name.trim(),
      type: form.type,
      openingBalance: Number(form.openingBalance),
      institutionName: form.institutionName.trim() || undefined,
    });
  }

  return (
    <AppShell title="Accounts">
      <div className="space-y-4 p-3 sm:space-y-6 sm:p-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">
            Accounts
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Your money spaces
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[380px_1fr]">
          <GlassCard className="p-4 sm:p-6">
            <h3 className="mb-5 text-lg font-semibold text-white">
              Create account
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <NeonInput
                label="Account name"
                placeholder="HDFC Bank"
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
                  onChange={(e) => setField("type", e.target.value as AccountType)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="bank" className="text-black">Bank</option>
                  <option value="cash" className="text-black">Cash</option>
                  <option value="savings" className="text-black">Savings</option>
                  <option value="credit_card" className="text-black">Credit Card</option>
                </select>
                {errors.type ? <p className="text-sm text-rose-300">{errors.type}</p> : null}
              </div>

              <NeonInput
                label="Opening balance"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="0.00"
                value={form.openingBalance}
                onChange={(e) =>
                  handleNonNegativeNumberChange("openingBalance", e.target.value)
                }
                error={errors.openingBalance}
              />

              <NeonInput
                label="Institution name"
                placeholder="HDFC"
                value={form.institutionName}
                onChange={(e) => setField("institutionName", e.target.value)}
                error={errors.institutionName}
              />

              {mutation.isError && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3">
                  <p className="text-sm font-medium text-rose-200">
                    {getApiErrorMessage(
                      mutation.error,
                      "Failed to create account."
                    )}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-2xl bg-white/12 px-4 py-4 text-white transition hover:bg-white/16 disabled:opacity-50"
              >
                {mutation.isPending ? "Saving..." : "Create Account"}
              </button>
            </form>
          </GlassCard>

          <GlassCard className="p-4 sm:p-6">
            <h3 className="mb-5 text-lg font-semibold text-white">
              Existing accounts
            </h3>

            {isLoading && (
              <p className="text-sm text-white/55">Loading accounts...</p>
            )}
            {isError && (
              <p className="text-sm text-rose-300">Failed to load accounts.</p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {data?.map((account: any) => {
                const effectiveBalance =
                  account.currentBalance ?? account.openingBalance ?? 0;

                return (
                  <div
                    key={account.id}
                    className="rounded-2xl border border-white/8 bg-white/6 p-5"
                  >
                    <p className="text-lg font-semibold text-white">
                      {account.name}
                    </p>
                    <p className="text-sm uppercase tracking-wide text-white/45">
                      {account.type}
                    </p>

                    <p className="mt-4 text-2xl font-semibold text-white">
                      {formatCurrency(effectiveBalance)}
                    </p>

                    <p className="mt-1 text-sm text-white/50">
                      {account.institutionName || "No institution"}
                    </p>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}