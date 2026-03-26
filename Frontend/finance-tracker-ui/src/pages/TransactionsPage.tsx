import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTransaction,
  getTransactions,
} from "../features/transactions/transactionsApi";
import { getAccounts } from "../features/accounts/accountApi";
import { getCategories } from "../features/categories/categoriesApi";
import GlassCard from "../components/Glasscard";
import NeonInput from "../components/NeonInput";
import { getApiErrorMessage } from "../lib/getApiErrorMessage";
import { formatCurrency, formatDate } from "../utils/format";
import AppShell from "../components/AppShell";

type TransactionType = "expense" | "income";
type PaymentMethod =
  | ""
  | "cash"
  | "card"
  | "upi"
  | "bank_transfer"
  | "wallet"
  | "cheque";

type TransactionFormState = {
  type: TransactionType;
  amount: string;
  date: string;
  accountId: string;
  categoryId: string;
  merchant: string;
  note: string;
  paymentMethod: PaymentMethod;
};

type TransactionFormErrors = Partial<Record<keyof TransactionFormState, string>>;

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "wallet", label: "Wallet" },
  { value: "cheque", label: "Cheque" },
];

const todayStr = new Date().toISOString().slice(0, 10);

const DEFAULT_VALUES: TransactionFormState = {
  type: "expense",
  amount: "",
  date: todayStr,
  accountId: "",
  categoryId: "",
  merchant: "",
  note: "",
  paymentMethod: "",
};

function isValidPositiveMoneyString(value: string) {
  if (value.trim() === "") return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 && Math.round(num * 100) === num * 100;
}

export default function TransactionsPage() {
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  const { data: accounts } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const [form, setForm] = useState<TransactionFormState>({ ...DEFAULT_VALUES });
  const [errors, setErrors] = useState<TransactionFormErrors>({});

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setForm({ ...DEFAULT_VALUES });
      setErrors({});
    },
  });

  const filteredCategories = useMemo(
    () => categories?.filter((c: any) => c.type === form.type) ?? [],
    [categories, form.type]
  );

  function setField<K extends keyof TransactionFormState>(
    key: K,
    value: TransactionFormState[K]
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

  function validateForm(values: TransactionFormState): TransactionFormErrors {
    const nextErrors: TransactionFormErrors = {};

    if (!isValidPositiveMoneyString(values.amount)) {
      nextErrors.amount =
        "Amount must be greater than 0, with up to 2 decimals";
    }

    if (!values.date) {
      nextErrors.date = "Date is required";
    } else if (values.date > todayStr) {
      nextErrors.date = "Date cannot be in the future";
    }

    if (!values.accountId) {
      nextErrors.accountId = "Account is required";
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

    mutation.mutate({
      type: form.type,
      amount: Number(form.amount),
      date: `${form.date}T00:00:00Z`,
      accountId: form.accountId,
      categoryId: form.categoryId || null,
      merchant: form.merchant.trim() || undefined,
      note: form.note.trim() || undefined,
      paymentMethod: form.paymentMethod || undefined,
    });
  }

  return (
    <AppShell title="Transactions">
      <div className="space-y-4 p-3 sm:space-y-6 sm:p-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300/75">
            Transactions
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
            Flow of money
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[420px_1fr]">
          <GlassCard className="p-4 sm:p-6">
            <h3 className="mb-5 text-lg font-semibold text-white">
              Add transaction
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setField("type", e.target.value as TransactionType)
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

              <NeonInput
                label="Date"
                type="date"
                max={todayStr}
                value={form.date}
                onChange={(e) => setField("date", e.target.value)}
                error={errors.date}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Account
                </label>
                <select
                  value={form.accountId}
                  onChange={(e) => setField("accountId", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="" className="text-black">
                    Select account
                  </option>
                  {accounts?.map((account: any) => (
                    <option
                      key={account.id}
                      value={account.id}
                      className="text-black"
                    >
                      {account.name}
                    </option>
                  ))}
                </select>
                {errors.accountId && (
                  <p className="text-sm text-rose-300">{errors.accountId}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Category (optional)
                </label>
                <select
                  value={form.categoryId}
                  onChange={(e) => setField("categoryId", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="" className="text-black">
                    Select category
                  </option>
                  {filteredCategories.map((category: any) => (
                    <option
                      key={category.id}
                      value={category.id}
                      className="text-black"
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="text-sm text-rose-300">{errors.categoryId}</p>
                )}
              </div>

              <NeonInput
                label="Merchant"
                value={form.merchant}
                onChange={(e) => setField("merchant", e.target.value)}
                error={errors.merchant}
              />

              <NeonInput
                label="Note"
                value={form.note}
                onChange={(e) => setField("note", e.target.value)}
                error={errors.note}
              />

              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Payment Method
                </label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setField("paymentMethod", e.target.value as PaymentMethod)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="" className="text-black">
                    Select payment method
                  </option>
                  {paymentMethods.map((method) => (
                    <option
                      key={method.value}
                      value={method.value}
                      className="text-black"
                    >
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {mutation.isError && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3">
                  <p className="text-sm font-medium text-rose-200">
                    {getApiErrorMessage(
                      mutation.error,
                      "Failed to create transaction."
                    )}
                  </p>
                </div>
              )}

              <button
                disabled={mutation.isPending}
                className="w-full rounded-2xl bg-white/12 px-4 py-4 text-white transition hover:bg-white/16 disabled:opacity-50"
              >
                {mutation.isPending ? "Saving..." : "Create Transaction"}
              </button>
            </form>
          </GlassCard>

          <GlassCard className="p-4 sm:p-6">
            <h3 className="mb-5 text-lg font-semibold text-white">
              Recent transactions
            </h3>

            {isLoading ? (
              <p className="text-sm text-white/55">Loading transactions...</p>
            ) : (
              <div className="space-y-3">
                {transactions?.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="rounded-2xl border border-white/8 bg-white/6 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-white break-words">
                          {tx.merchant || tx.note || "Transaction"}
                        </p>
                        <p className="text-sm text-white/50">
                          {tx.type} • {formatDate(tx.date)}
                        </p>
                      </div>
                      <p className="font-semibold text-white">
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}
