"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";


export async function getAccountWithTransactions(accountId:string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const account = await db.account.findUnique({
    where: {
      id: accountId,
      userId: user.id,
      user:user
    },
    include: {
      transactions: {
        orderBy: { date: "desc" },
        include: {
          user: true, // Include the user related to the transaction
          account: true, // Include the account related to the transaction
        },
      },
      _count: {
        select: { transactions: true },
      },
    },
  });

  if (!account) return null;

  const transactions = account.transactions.map(transaction => ({
    ...transaction,
    amount: transaction.amount.toNumber(), // Convert amount to number
    description: transaction.description ?? undefined,// Convert null to undefined
    receiptUrl: transaction.description ?? undefined,// Convert null to undefined
    recurringInterval:transaction.recurringInterval ?? undefined,
    nextRecurringDate:transaction.nextRecurringDate ?? undefined,
    lastProcessed:transaction.lastProcessed ?? undefined,
    
  }));
  
  console.log('account with trascations',account)

  const result={...account,balance:account.balance.toNumber()}
  return {
    account:result,
    transactions: transactions,
  };
}


export async function bulkDeleteTransactions(transactionIds: string[]): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) throw new Error("User not found");

    const transactions = await db.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
    });

    const accountBalanceChanges: Record<string, number> = transactions.reduce(
      (acc: Record<string, number>, transaction) => {
        const amount = Number(transaction.amount); // Convert Decimal to number
        const change = transaction.type === "EXPENSE" ? amount : -amount;
    
        acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
        return acc;
      },
      {}
    );
    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({
        where: {
          id: { in: transactionIds },
          userId: user.id,
        },
      });

      for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
        await tx.account.update({
          where: { id: accountId },
          data: {
            balance: {
              increment: balanceChange,
            },
          },
        });
      }
    });

    // Revalidate relevant pages
    revalidatePath("/dashboard");
    revalidatePath("/account/[id]");

    return { success: true };
  } catch (error: any) {
    console.error("Error in bulkDeleteTransactions:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
