import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAccounts, createAccount, transferFunds } from "../features/accounts/accountApi";
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

type TransferFormState = {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: string;
  date: string;
};

type TransferFormErrors = Partial<Record<keyof TransferFormState, string>>;

const todayStr = new Date().toISOString().slice(0, 10);

const DEFAULT_TRANSFER: TransferFormState = {
  sourceAccountId: "",
  destinationAccountId: "",
  amount: "",
  date: todayStr,
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
  const [transferForm, setTransferForm] = useState<TransferFormState>({ ...DEFAULT_TRANSFER });
  const [transferErrors, setTransferErrors] = useState<TransferFormErrors>({});

  const mutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setForm({ ...DEFAULT_VALUES });
      setErrors({});
    },
  });

  const transferMutation = useMutation({
    mutationFn: transferFunds,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setTransferForm({ ...DEFAULT_TRANSFER });
      setTransferErrors({});
    },
  });

  const isSubmitting = mutation.isPending;
  const canSubmit = useMemo(() => !isSubmitting, [isSubmitting]);
  const isTransferring = transferMutation.isPending;

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

  function setTransferField<K extends keyof TransferFormState>(
    key: K,
    value: TransferFormState[K]
  ) {
    setTransferForm((prev) => ({ ...prev, [key]: value }));
    setTransferErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateTransfer(values: TransferFormState): TransferFormErrors {
    const nextErrors: TransferFormErrors = {};

    if (!values.sourceAccountId) nextErrors.sourceAccountId = "Source is required";
    if (!values.destinationAccountId) nextErrors.destinationAccountId = "Destination is required";
    if (
      values.sourceAccountId &&
      values.destinationAccountId &&
      values.sourceAccountId === values.destinationAccountId
    ) {
      nextErrors.destinationAccountId = "Must be different accounts";
    }

    if (values.amount.trim() === "") {
      nextErrors.amount = "Amount is required";
    } else {
      const num = Number(values.amount);
      if (!Number.isFinite(num) || num <= 0 || Math.round(num * 100) !== num * 100) {
        nextErrors.amount = "Amount must be > 0, up to 2 decimals";
      }
    }

    if (!values.date) nextErrors.date = "Date is required";

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

  function handleTransferSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors = validateTransfer(transferForm);
    setTransferErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    transferMutation.mutate({
      sourceAccountId: transferForm.sourceAccountId,
      destinationAccountId: transferForm.destinationAccountId,
      amount: Number(transferForm.amount),
      date: `${transferForm.date}T00:00:00Z`,
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
          <div className="space-y-4">
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
            <h3 className="mb-5 text-lg font-semibold text-white">Transfer funds</h3>

            <form onSubmit={handleTransferSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">From</label>
                <select
                  value={transferForm.sourceAccountId}
                  onChange={(e) => setTransferField("sourceAccountId", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="" className="text-black">Select source</option>
                  {data?.map((a: any) => (
                    <option key={a.id} value={a.id} className="text-black">
                      {a.name}
                    </option>
                  ))}
                </select>
                {transferErrors.sourceAccountId ? (
                  <p className="text-sm text-rose-300">{transferErrors.sourceAccountId}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">To</label>
                <select
                  value={transferForm.destinationAccountId}
                  onChange={(e) => setTransferField("destinationAccountId", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="" className="text-black">Select destination</option>
                  {data?.map((a: any) => (
                    <option key={a.id} value={a.id} className="text-black">
                      {a.name}
                    </option>
                  ))}
                </select>
                {transferErrors.destinationAccountId ? (
                  <p className="text-sm text-rose-300">{transferErrors.destinationAccountId}</p>
                ) : null}
              </div>

              <NeonInput
                label="Amount"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                value={transferForm.amount}
                onChange={(e) => setTransferField("amount", e.target.value)}
                error={transferErrors.amount}
              />

              <NeonInput
                label="Date"
                type="date"
                value={transferForm.date}
                onChange={(e) => setTransferField("date", e.target.value)}
                error={transferErrors.date}
              />

              {transferMutation.isError && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3">
                  <p className="text-sm font-medium text-rose-200">
                    {getApiErrorMessage(transferMutation.error, "Transfer failed.")}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isTransferring}
                className="w-full rounded-2xl bg-white/12 px-4 py-4 text-white transition hover:bg-white/16 disabled:opacity-50"
              >
                {isTransferring ? "Transferring..." : "Transfer"}
              </button>
            </form>
          </GlassCard>
          </div>

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
                // Prefer the API's currentBalance; if it's missing/zero for a brand-new account,
                // surface the opening balance so initial funds are visible.
                const openingBalance = Number(account.openingBalance ?? 0);
                const hasCurrent = Number.isFinite(account.currentBalance);
                const currentBalance = hasCurrent ? Number(account.currentBalance) : null;
                const effectiveBalance =
                  hasCurrent && currentBalance !== null ? currentBalance : openingBalance;

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
                    <p className="text-xs text-white/55">
                      Opening balance: {formatCurrency(openingBalance)}
                    </p>
                    {openingBalance > 0 &&
                      (!hasCurrent || currentBalance === 0) && (
                        <p className="text-xs text-cyan-200/70">
                          Showing opening balance (no activity yet)
                        </p>
                      )}

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
