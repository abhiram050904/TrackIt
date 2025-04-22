import { getUserAccounts } from "@/actions/AccountActions";
// import { defaultCategories } from "@/data/categories";
// import { AddTransactionForm } from "../_components/transaction-form";
// import { getTransaction } from "@/actions/TransactionActions";
import { Transaction } from "@prisma/client";
import { Metadata } from "next";

// Optional: If this is a route with metadata
export const metadata: Metadata = {
  title: "Add Transaction",
};

interface PageProps {
  searchParams?: {
    edit?: string;
  };
}

const Page = async ({ searchParams }: PageProps) => {
  const accounts = await getUserAccounts();
  const editId = searchParams?.edit;

  let initialData: Transaction | null = null;

  // if (editId) {
  //   const transaction = await getTransaction(editId);
  //   initialData = transaction;
  // }

  return (
    <div className="max-w-3xl mx-auto px-5">
      <div className="flex justify-center md:justify-normal mb-8">
        <h1 className="text-5xl gradient-title">Add Transaction</h1>
      </div>
      {/* <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
      /> */}
    </div>
  );
};

export default Page;
