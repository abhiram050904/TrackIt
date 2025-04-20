"use server";

import { db } from "@/lib/prisma";
import { AccountFormValues } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const serializeTransaction = (obj: any) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = obj.balance.toNumber();
  }

  if (obj.amount) {
    serialized.amount = obj.amount.toNumber();
  }
  
  return serialized;
};

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

    const balanceFloat = parseFloat(data.balance);
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

    const serializedAccount = serializeTransaction(account);
    revalidatePath("/dashboard");

    return { success: true, data: serializedAccount };
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

    // Serialize accounts before sending to client
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

    return {
      success: true,
      data: serializeTransaction(result[1]), // Return the updated default account
    };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while updating default account" };
  }
}
