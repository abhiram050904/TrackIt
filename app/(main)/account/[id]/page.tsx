import { Suspense } from "react";
import { getAccountWithTransactions } from "@/actions/TransactionActions";
import { BarLoader } from "react-spinners";
import { notFound } from "next/navigation";
import { AccountChart } from "../_components/AccountChart";
import { TransactionTable } from "../_components/TransactionTable";
import { IndianRupee } from "lucide-react";
import { Transaction } from "@/types";
// import { TransactionTable } from "../_components/transaction-table";

export default async function AccountPage({ params }: { params: { id: string } }) {
  const accountData = await getAccountWithTransactions(params.id);

  if (!accountData) {
    notFound(); // Will handle if account is not found
  }

  const account = accountData.account;
  const transactions = accountData.transactions;

  return (
    <div className="space-y-8 px-5">
      <div className="flex gap-4 items-end justify-between">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-title capitalize">
            {account.name}
          </h1>
          <p className="text-muted-foreground">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()}{" "}
            Account
          </p>
        </div>

        <div className="text-right pb-2">
          <div className="text-xl sm:text-2xl font-bold">
          <IndianRupee className="inline h-4 w-4" />
            {(account.balance).toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground">
            {account._count.transactions} Transactions
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <Suspense fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}>
        <AccountChart transactions={transactions as Transaction[]} />
      </Suspense>

      {/* Transactions Table */}
      <Suspense fallback={<BarLoader className="mt-4" width={"100%"} color="#9333ea" />}>
        <TransactionTable transactions={transactions as Transaction[]} />
      </Suspense>
    </div>
  );
}
