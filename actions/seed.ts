"use server";

import { db } from "@/lib/prisma";
import { subDays } from "date-fns";

const ACCOUNT_ID = "52a4cce4-b64a-47ce-a9e7-452fa23f833e";
const USER_ID = "77201117-e0bb-4372-9b63-f57762a8f844";

type TransactionType = "INCOME" | "EXPENSE";
type TransactionStatus = "COMPLETED";

interface Category {
  name: string;
  range: [number, number];
}

const CATEGORIES: Record<TransactionType, Category[]> = {
  INCOME: [
    { name: "salary", range: [5000, 8000] },
    { name: "freelance", range: [1000, 3000] },
    { name: "investments", range: [500, 2000] },
    { name: "other-income", range: [100, 1000] },
  ],
  EXPENSE: [
    { name: "housing", range: [1000, 2000] },
    { name: "transportation", range: [100, 500] },
    { name: "groceries", range: [200, 600] },
    { name: "utilities", range: [100, 300] },
    { name: "entertainment", range: [50, 200] },
    { name: "food", range: [50, 150] },
    { name: "shopping", range: [100, 500] },
    { name: "healthcare", range: [100, 1000] },
    { name: "education", range: [200, 1000] },
    { name: "travel", range: [500, 2000] },
  ],
};

function getRandomAmount(min: number, max: number): number {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomCategory(type: TransactionType): { category: string; amount: number } {
  const categories = CATEGORIES[type];
  const category = categories[Math.floor(Math.random() * categories.length)];
  const amount = getRandomAmount(category.range[0], category.range[1]);
  return { category: category.name, amount };
}

function getRandomDateInDay(baseDate: Date): Date {
  const hours = Math.floor(Math.random() * 24);
  const minutes = Math.floor(Math.random() * 60);
  const seconds = Math.floor(Math.random() * 60);
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes,
    seconds
  );
}

interface TransactionSeed {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: Date;
  category: string;
  status: TransactionStatus;
  userId: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
  isRecurring: boolean;
  recurringInterval?: "DAILY" | "WEEKLY" | "MONTHLY";
}

export async function seedTransactions(): Promise<{ success: boolean; message?: string; error?: unknown }> {
  try {
    const transactions: TransactionSeed[] = [];
    let totalBalance = 0;

    for (let i = 90; i >= 0; i--) {
      const baseDate = subDays(new Date(), i);

      const transactionsPerDay = Math.floor(Math.random() * 3) + 1;

      for (let j = 0; j < transactionsPerDay; j++) {
        const date = getRandomDateInDay(baseDate);

        const type: TransactionType = Math.random() < 0.4 ? "INCOME" : "EXPENSE";
        const { category, amount } = getRandomCategory(type);
        const isRecurring = Math.random() < 0.2;
        const recurringIntervals = ["DAILY", "WEEKLY", "MONTHLY"] as const;

        const transaction: TransactionSeed = {
          id: crypto.randomUUID(),
          type,
          amount,
          description: `${type === "INCOME" ? "Received" : "Paid for"} ${category}`,
          date,
          category,
          status: "COMPLETED",
          userId: USER_ID,
          accountId: ACCOUNT_ID,
          createdAt: date,
          updatedAt: date,
          isRecurring,
          recurringInterval: isRecurring
            ? recurringIntervals[Math.floor(Math.random() * recurringIntervals.length)]
            : undefined,
        };

        totalBalance += type === "INCOME" ? amount : -amount;
        transactions.push(transaction);
      }
    }

    await db.$transaction(async (tx) => {
      await tx.transaction.deleteMany({ where: { accountId: ACCOUNT_ID } });

      await tx.transaction.createMany({
        data: transactions,
      });

      await tx.account.update({
        where: { id: ACCOUNT_ID },
        data: { balance: totalBalance },
      });
    });

    return {
      success: true,
      message: `Created ${transactions.length} transactions`,
    };
  } catch (error) {
    console.error("Error seeding transactions:", error);
    return { success: false, error };
  }
}
