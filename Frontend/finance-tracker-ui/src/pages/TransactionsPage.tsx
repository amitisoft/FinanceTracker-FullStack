import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createTransaction,
  deleteTransaction,
  getTransactions,
  type TransactionQuery,
  updateTransaction,
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

type TransactionFilters = {
  search: string;
  type: "" | "expense" | "income";
  accountId: string;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  sortBy: "date" | "amount" | "created";
  sortDir: "asc" | "desc";
};

const DEFAULT_FILTERS: TransactionFilters = {
  search: "",
  type: "",
  accountId: "",
  categoryId: "",
  dateFrom: "",
  dateTo: "",
  sortBy: "date",
  sortDir: "desc",
};

function isValidPositiveMoneyString(value: string) {
  if (value.trim() === "") return false;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 && Math.round(num * 100) === num * 100;
}

export default function TransactionsPage() {
  const queryClient = useQueryClient();

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    ...DEFAULT_FILTERS,
  });
  const [page, setPage] = useState(1);
  const [pageItems, setPageItems] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  const filterKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setPageItems([]);
  }, [filterKey]);

  const queryParams: TransactionQuery = useMemo(
    () => ({
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      accountId: filters.accountId || undefined,
      categoryId: filters.categoryId || undefined,
      type: filters.type || undefined,
      search: filters.search || undefined,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
      page,
      pageSize,
    }),
    [filters, page]
  );

  const {
    data: pagedTransactions,
    isLoading: isPaging,
    isFetching,
  } = useQuery({
    queryKey: ["transactions", queryParams],
    queryFn: () => getTransactions(queryParams),
  });

  useEffect(() => {
    if (!pagedTransactions) return;
    setPageItems((prev) =>
      page === 1 ? pagedTransactions : [...prev, ...pagedTransactions]
    );
    setHasMore(pagedTransactions.length === pageSize);
  }, [pagedTransactions, page, pageSize]);

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setForm({ ...DEFAULT_VALUES });
      setErrors({});
      setEditingId(null);
      setPage(1);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateTransaction(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setForm({ ...DEFAULT_VALUES });
      setErrors({});
      setEditingId(null);
      setPage(1);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      setPageItems((prev) => prev.filter((t) => t.id !== id));
    },
  });

  const filteredCategories = useMemo(
    () => categories?.filter((c: any) => c.type === form.type) ?? [],
    [categories, form.type]
  );

  const allCategories = useMemo(() => categories ?? [], [categories]);

  const accountNameById = useMemo(() => {
    const map = new Map<string, string>();
    accounts?.forEach((a: any) => map.set(a.id, a.name));
    return map;
  }, [accounts]);

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();
    allCategories?.forEach((c: any) => map.set(c.id, c.name));
    return map;
  }, [allCategories]);

  function updateFilter<K extends keyof TransactionFilters>(
    key: K,
    value: TransactionFilters[K]
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

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

    const payload = {
      type: form.type,
      amount: Number(form.amount),
      date: `${form.date}T00:00:00Z`,
      accountId: form.accountId,
      categoryId: form.categoryId || null,
      merchant: form.merchant.trim() || undefined,
      note: form.note.trim() || undefined,
      paymentMethod: form.paymentMethod || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function beginEdit(tx: any) {
    const dateOnly = typeof tx.date === "string" ? tx.date.slice(0, 10) : todayStr;

    setEditingId(tx.id);
    setForm({
      type: (String(tx.type).toLowerCase() === "income" ? "income" : "expense") as TransactionType,
      amount: String(tx.amount ?? ""),
      date: dateOnly,
      accountId: tx.accountId ?? "",
      categoryId: tx.categoryId ?? "",
      merchant: tx.merchant ?? "",
      note: tx.note ?? "",
      paymentMethod: (tx.paymentMethod ?? "") as PaymentMethod,
    });
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
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
              {editingId ? "Edit transaction" : "Add transaction"}
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

              {(createMutation.isError || updateMutation.isError) && (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3">
                  <p className="text-sm font-medium text-rose-200">
                    {getApiErrorMessage(
                      (createMutation.error ?? updateMutation.error) as any,
                      editingId ? "Failed to update transaction." : "Failed to create transaction."
                    )}
                  </p>
                </div>
              )}

              <button
                disabled={createMutation.isPending || updateMutation.isPending}
                className="w-full rounded-2xl bg-white/12 px-4 py-4 text-white transition hover:bg-white/16 disabled:opacity-50"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : editingId
                    ? "Update Transaction"
                    : "Create Transaction"}
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
              Recent transactions
            </h3>

            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <NeonInput
                label="Search"
                value={filters.search}
                onChange={(e) => updateFilter("search", e.target.value)}
                placeholder="Merchant or note"
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) =>
                    updateFilter("type", e.target.value as TransactionFilters["type"])
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="" className="text-black">
                    All
                  </option>
                  <option value="expense" className="text-black">
                    Expense
                  </option>
                  <option value="income" className="text-black">
                    Income
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Account
                </label>
                <select
                  value={filters.accountId}
                  onChange={(e) => updateFilter("accountId", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="" className="text-black">
                    All accounts
                  </option>
                  {accounts?.map((account: any) => (
                    <option key={account.id} value={account.id} className="text-black">
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Category
                </label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => updateFilter("categoryId", e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="" className="text-black">
                    All categories
                  </option>
                  {allCategories?.map((category: any) => (
                    <option key={category.id} value={category.id} className="text-black">
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <NeonInput
                label="From"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter("dateFrom", e.target.value)}
              />
              <NeonInput
                label="To"
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter("dateTo", e.target.value)}
              />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Sort by
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    updateFilter("sortBy", e.target.value as TransactionFilters["sortBy"])
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="date" className="text-black">
                    Date
                  </option>
                  <option value="amount" className="text-black">
                    Amount
                  </option>
                  <option value="created" className="text-black">
                    Created
                  </option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/80">
                  Direction
                </label>
                <select
                  value={filters.sortDir}
                  onChange={(e) =>
                    updateFilter("sortDir", e.target.value as TransactionFilters["sortDir"])
                  }
                  className="w-full rounded-2xl border border-white/10 bg-white/8 px-4 py-4 text-white outline-none"
                >
                  <option value="desc" className="text-black">
                    Desc
                  </option>
                  <option value="asc" className="text-black">
                    Asc
                  </option>
                </select>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setFilters({ ...DEFAULT_FILTERS })}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/70"
              >
                Reset filters
              </button>
              <button
                type="button"
                onClick={() => exportCsv(pageItems, accountNameById, categoryNameById)}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/70"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => exportPdf(pageItems, accountNameById, categoryNameById)}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/70"
              >
                Export PDF
              </button>
            </div>

            {isPaging && page === 1 ? (
              <p className="text-sm text-white/55">Loading transactions...</p>
            ) : (
              <div className="space-y-3">
                {pageItems?.map((tx: any) => (
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
                          {tx.type} - {formatDate(tx.date)}
                          {tx.accountId && accountNameById.get(tx.accountId)
                            ? ` - ${accountNameById.get(tx.accountId)}`
                            : ""}
                          {tx.categoryId && categoryNameById.get(tx.categoryId)
                            ? ` - ${categoryNameById.get(tx.categoryId)}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <p className="font-semibold text-white">
                          {formatCurrency(tx.amount)}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => beginEdit(tx)}
                            className="rounded-xl border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-white/75 transition hover:bg-white/10"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (confirm("Delete this transaction?")) {
                                deleteMutation.mutate(tx.id);
                              }
                            }}
                            className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {pageItems.length === 0 && (
                  <p className="text-sm text-white/55">No transactions match the filters.</p>
                )}
                {hasMore && (
                  <button
                    type="button"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={isFetching}
                    className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/70 disabled:opacity-50"
                  >
                    {isFetching ? "Loading..." : "Load more"}
                  </button>
                )}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}

function exportCsv(
  rows: any[],
  accountNameById: Map<string, string>,
  categoryNameById: Map<string, string>
) {
  const headers = [
    "Date",
    "Type",
    "Amount",
    "Account",
    "Category",
    "Merchant",
    "Note",
    "PaymentMethod",
  ];

  const escape = (value: string) => `"${value.replace(/\"/g, '""')}"`;

  const lines = rows.map((tx) =>
    [
      tx.date,
      tx.type,
      String(tx.amount),
      accountNameById.get(tx.accountId) ?? "",
      tx.categoryId ? categoryNameById.get(tx.categoryId) ?? "" : "",
      tx.merchant ?? "",
      tx.note ?? "",
      tx.paymentMethod ?? "",
    ]
      .map((v) => escape(String(v)))
      .join(",")
  );

  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "transactions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportPdf(
  rows: any[],
  accountNameById: Map<string, string>,
  categoryNameById: Map<string, string>
) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return;

  const tableRows = rows
    .map(
      (tx) => `
      <tr>
        <td>${tx.date}</td>
        <td>${tx.type}</td>
        <td>${tx.amount}</td>
        <td>${accountNameById.get(tx.accountId) ?? ""}</td>
        <td>${tx.categoryId ? categoryNameById.get(tx.categoryId) ?? "" : ""}</td>
        <td>${tx.merchant ?? ""}</td>
        <td>${tx.note ?? ""}</td>
      </tr>
    `
    )
    .join("");

  win.document.write(`
    <html>
      <head>
        <title>Transactions Export</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; }
          th { background: #f3f4f6; text-align: left; }
        </style>
      </head>
      <body>
        <h2>Transactions Export</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Account</th>
              <th>Category</th>
              <th>Merchant</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  win.print();
}
