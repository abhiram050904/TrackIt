"use server";

import { db } from "@/lib/prisma";
import { Account, AccountFormValues } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";


export type CreateAccountResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export async function createAccount(data: AccountFormValues): Promise<CreateAccountResponse> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const balanceFloat = data.balance;
    if (isNaN(balanceFloat)) {
      throw new Error("Invalid balance value");
    }

    const existingAccounts = await db.account.findMany({
      where: { userId: user.id },
    });

    const shouldBeDefault = existingAccounts.length === 0 ? true : data.isDefault;

    if (shouldBeDefault) {
      await db.account.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const account = await db.account.create({
      data: {
        ...data,
        balance: balanceFloat,
        userId: user.id,
        isDefault: shouldBeDefault,
      },
    });

    const result = {
      ...account,
      balance: account.balance.toNumber(),
    };
    // const serializedAccount = serializeTransaction(account);
    revalidatePath("/dashboard");

    return { success: true, data: result };
  } catch (err: any) {
    console.log("Error in createAccount:", err.message);
    return { success: false, error: err.message || "Error while creating account" };
  }
}


export async function getUserAccounts() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  try {
    const accounts = await db.account.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    const serializeTransaction = (account: any) => {
      return {
        ...account,
        balance: account.balance.toNumber(),
      };
    };
    
    const serializedAccounts = accounts.map(serializeTransaction);
    return serializedAccounts;


  } catch (error: any) {
    console.error("Error fetching accounts:", error.message);
    throw new Error(`Failed to fetch accounts: ${error.message}`);
  }
}



export type UpdateDefaultAccountResponse = {
  success: boolean;
  data?: any;
  error?: string;
};

export async function updateDefaultAccount(accountId: string): Promise<UpdateDefaultAccountResponse> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Begin a transaction to ensure atomicity
    const result = await db.$transaction([
      // Unset existing default accounts
      db.account.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: { isDefault: false },
      }),

      // Set the new default account
      db.account.update({
        where: {
          id: accountId,
          userId: user.id,
        },
        data: { isDefault: true },
      }),
    ]);

    revalidatePath("/dashboard");
    const res = {
      ...result[1],
      balance: result[1].balance.toNumber(),
    };
    return {
      success: true,
      data: res,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while updating default account" };
  }
}