"use server";

import { db } from "@/lib/prisma";
import { Transaction, TransactionFormValues } from "@/types";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
// import { request } from "@arcjet/next";

// export async function createTransaction(data: TransactionFormValues): Promise<{
//   success: boolean;
//   data: Transaction;
// }> {
//   try {
//     const { userId } = await auth();
//     if (!userId) throw new Error("Unauthorized");

//     const req = await request();

//     const decision = await aj.protect(req, {
//       userId,
//       requested: 1,
//     });

//     if (decision.isDenied()) {
//       if (decision.reason.isRateLimit()) {
//         const { remaining, reset } = decision.reason;
//         console.error({
//           code: "RATE_LIMIT_EXCEEDED",
//           details: {
//             remaining,
//             resetInSeconds: reset,
//           },
//         });
//         throw new Error("Too many requests. Please try again later.");
//       }

//       throw new Error("Request blocked");
//     }

//     const user = await db.user.findUnique({
//       where: { clerkUserId: userId },
//     });

//     if (!user) {
//       throw new Error("User not found");
//     }

//     const account = await db.account.findUnique({
//       where: {
//         id: data.accountId,
//         userId: user.id,
//       },
//     });

//     if (!account) {
//       throw new Error("Account not found");
//     }

//     const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
//     const newBalance = account.balance.toNumber() + balanceChange;

//     const transaction = await db.$transaction(async (tx) => {
//       const newTransaction = await tx.transaction.create({
//         data: {
//           ...data,
//           userId: user.id,
//           nextRecurringDate:
//             data.isRecurring && data.recurringInterval
//               ? calculateNextRecurringDate(data.date, data.recurringInterval)
//               : null,
//         },
//       });

//       await tx.account.update({
//         where: { id: data.accountId },
//         data: { balance: newBalance },
//       });

//       return newTransaction;
//     });

//     revalidatePath("/dashboard");
//     revalidatePath(`/account/${transaction.accountId}`);
    
//     return {
//       success: true,
//       data: {
//         ...transaction,
//         amount: transaction.amount.toNumber(),
//         receiptUrl: transaction.receiptUrl ?? undefined,
//         recurringInterval: transaction.recurringInterval ?? undefined,
//         nextRecurringDate: transaction.nextRecurringDate ?? undefined,
//         lastProcessed: transaction.lastProcessed ?? undefined, // 💥 fix here
//       },
//     };
//   } catch (error: any) {
//     throw new Error(error.message);
//   }
// }


// export async function updateTransaction(
//   id: string,
//   data: TransactionFormValues
// ): Promise<{success:boolean,data:Transaction}> {
//   try {
//     const { userId } = await auth();
//     if (!userId) throw new Error("Unauthorized");

//     // Find the user from the DB
//     const user = await db.user.findUnique({
//       where: { clerkUserId: userId },
//     });

//     if (!user) throw new Error("User not found");

//     // Get the original transaction to calculate balance change
//     const originalTransaction = await db.transaction.findUnique({
//       where: {
//         id,
//         userId: user.id,
//       },
//       include: {
//         account: true,
//       },
//     });

//     if (!originalTransaction) throw new Error("Transaction not found");

//     // Calculate balance changes
//     const oldBalanceChange =
//       originalTransaction.type === "EXPENSE"
//         ? -originalTransaction.amount.toNumber()
//         : originalTransaction.amount.toNumber();

//     const newBalanceChange =
//       data.type === "EXPENSE" ? -data.amount : data.amount;

//     const netBalanceChange = newBalanceChange - oldBalanceChange;

//     // Start a transaction to update both transaction and account balance
//     const transaction = await db.$transaction(async (tx) => {
//       const updated = await tx.transaction.update({
//         where: {
//           id,
//           userId: user.id,
//         },
//         data: {
//           ...data,
//           nextRecurringDate:
//             data.isRecurring && data.recurringInterval
//               ? calculateNextRecurringDate(data.date, data.recurringInterval)
//               : null,
//         },
//       });

//       // Update the account balance
//       await tx.account.update({
//         where: { id: data.accountId },
//         data: {
//           balance: {
//             increment: netBalanceChange,
//           },
//         },
//       });

//       return updated;
//     });

//     // Revalidate paths after transaction update
//     revalidatePath("/dashboard");
//     revalidatePath(`/account/${data.accountId}`);

//     return { success: true, data: {
//       ...transaction,
//       amount: transaction.amount.toNumber(),
//       receiptUrl: transaction.receiptUrl ?? undefined,
//       recurringInterval: transaction.recurringInterval ?? undefined,
//       nextRecurringDate: transaction.nextRecurringDate ?? undefined,
//       lastProcessed: transaction.lastProcessed ?? undefined, // 💥 fix here
//     }, };
//   } catch (error: any) {
//     throw new Error(error.message);
//   }
// }

export async function getTransaction(id: string): Promise<Transaction> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const transaction = await db.transaction.findUnique({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!transaction) throw new Error("Transaction not found");

  const res = { ...transaction,
    amount: transaction.amount.toNumber(),
    receiptUrl: transaction.receiptUrl ?? undefined,
    recurringInterval: transaction.recurringInterval ?? undefined,
    nextRecurringDate: transaction.nextRecurringDate ?? undefined,
    lastProcessed: transaction.lastProcessed ?? undefined, };

  return res; // Directly return the transaction as is, no serialization needed
}



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


// export async function scanReceipt(file:any) {
//   try {
//     const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//     // Convert File to ArrayBuffer
//     const arrayBuffer = await file.arrayBuffer();
//     // Convert ArrayBuffer to Base64
//     const base64String = Buffer.from(arrayBuffer).toString("base64");

//     const prompt = `
//       Analyze this receipt image and extract the following information in JSON format:
//       - Total amount (just the number)
//       - Date (in ISO format)
//       - Description or items purchased (brief summary)
//       - Merchant/store name
//       - Suggested category (one of: housing,transportation,groceries,utilities,entertainment,food,shopping,healthcare,education,personal,travel,insurance,gifts,bills,other-expense )
      
//       Only respond with valid JSON in this exact format:
//       {
//         "amount": number,
//         "date": "ISO date string",
//         "description": "string",
//         "merchantName": "string",
//         "category": "string"
//       }

//       If its not a recipt, return an empty object
//     `;

//     const result = await model.generateContent([
//       {
//         inlineData: {
//           data: base64String,
//           mimeType: file.type,
//         },
//       },
//       prompt,
//     ]);

//     const response = await result.response;
//     const text = response.text();
//     const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

//     try {
//       const data = JSON.parse(cleanedText);
//       return {
//         amount: parseFloat(data.amount),
//         date: new Date(data.date),
//         description: data.description,
//         category: data.category,
//         merchantName: data.merchantName,
//       };
//     } catch (parseError) {
//       console.error("Error parsing JSON response:", parseError);
//       throw new Error("Invalid response format from Gemini");
//     }
//   } catch (error) {
//     console.error("Error scanning receipt:", error);
//     throw new Error("Failed to scan receipt");
//   }
// }



function calculateNextRecurringDate(startDate:Date, interval: string) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}




