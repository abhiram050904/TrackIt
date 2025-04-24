import { getCurrentBudget } from '@/actions/BudgetActions';
import { db } from '../prisma';
import { inngest } from './inngestClient';
import { sendEmail } from '@/actions/SendEmail';  // Assuming this exists
import TestEmail from '@/emails/my-email';
import EmailTemplate from '@/emails/Template';
import { Transaction } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';



function isNewMonth(lastAlertDate:Date, currentDate:Date) {
    return (
      lastAlertDate.getMonth() !== currentDate.getMonth() ||
      lastAlertDate.getFullYear() !== currentDate.getFullYear()
    );
  }

  export const checkBudgetAlerts = inngest.createFunction(
    {
      name: 'Check Budget Alerts',
      id: '', // Set an appropriate ID for the function if needed
    },
    { cron: '0 */6 * * *' }, // Every 6 hours
    async ({ step }) => {
      try {
        const budgets = await step.run('fetch-budgets', async () => {
          const fetchedBudgets = await db.budget.findMany({
            include: {
              user: {
                include: {
                  accounts: {
                    where: {
                      isDefault: true,
                    },
                  },
                },
              },
            },
          });
  
          // Convert budget.amount to number for each budget
          return fetchedBudgets.map(budget => ({
            ...budget,
            amount:budget.amount.toNumber(), // Convert amount to number
          }));
        });

      for (const budget of budgets) {
        const defaultAccount = budget.user.accounts[0];
        if (!defaultAccount) continue; // Skip if no default account

        await step.run(`check-budget-${budget.id}`, async () => {
            const currentDate = new Date();
            const startOfMonth = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              1
            );
            const endOfMonth = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() + 1,
              0
            );
          const expenses = await db.transaction.aggregate({
            where: {
              userId: budget.userId,
              accountId: defaultAccount.id,
              type: 'EXPENSE',
              date: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
            _sum: {
              amount: true,
            },
          });

        
          const totalExpenses = expenses._sum.amount?.toNumber()!;
          const budgetAmount = budget.amount;
          const percentageUsed = (totalExpenses / budgetAmount) * 100;
          
          console.log('the budgetamount at inggest is',budgetAmount)
          console.log('the totalexpenses at inggest is',totalExpenses)
          console.log('the percentage used is',percentageUsed)
          // If the percentage used exceeds 80% and either no alert has been sent or it's a new month
          if (
            percentageUsed >= 80 &&
            (!budget.lastAlertSent ||
              isNewMonth(new Date(budget.lastAlertSent), new Date()))
          ) {


            await sendEmail({
              to: budget.user.email,
              subject: `Budget Alert for ${defaultAccount.name}`,
              react: EmailTemplate({
                userName: budget.user.name!,
                type: "budget-alert",
                data: {
                  percentageUsed,
                  budgetAmount: budgetAmount,
                  totalExpenses: totalExpenses,
                  accountName: defaultAccount.name,
                }!,
              })!,
            });

            

           
  
            

            // Update the lastAlertSent to prevent sending duplicate alerts in the same month
            await db.budget.update({
              where: { id: budget.id },
              data: { lastAlertSent: new Date() },
            });
          }
        });
      }
    } catch (error) {
      console.error('Error checking budget alerts:', error);
    }
  }
);


export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions",
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" }, // Run daily at midnight UTC
  async ({ step }) => {
    // Step 1: Fetch recurring transactions that are due
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              { lastProcessed: null },
              {
                nextRecurringDate: {
                  lte: new Date(),
                },
              },
            ],
          },
        });
      }
    );

    // Step 2: Map each transaction into an event and send it
    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      await inngest.send(events);
    }

    // Return a summary of what happened
    return { triggered: recurringTransactions.length };
  }
);


export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10, // Process 10 transactions
      period: "1m", // per minute
      key: "event.data.userId", // Throttle per user
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    // Validate event data
    if (!event?.data?.transactionId || !event?.data?.userId) {
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }

    await step.run("process-transaction", async () => {
      const transac = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: {
          account: true,
        },
      });

      const transaction = {
        ...transac,
        id: transac?.id!,
        type: transac?.type!, // Assuming it's an enum or string
        description: transac?.description!,
        createdAt: transac?.createdAt!,
        updatedAt: transac?.updatedAt!,
        userId: transac?.userId!,
        date: transac?.date!, // Convert Decimal to number
        category: transac?.category!,
        amount: transac?.amount.toNumber()!, // Assuming you also want to convert 'amount' here
        receiptUrl: transac?.receiptUrl!,
        isRecurring: transac?.isRecurring!,
        recurringInterval: transac?.recurringInterval!,
        nextRecurringDate: transac?.nextRecurringDate!,
        lastProcessed: transac?.lastProcessed!,
        status: transac?.status!,
        accountId: transac?.accountId!
      };

      if (!transaction || !isTransactionDue(transaction)) return;

      // Create new transaction and update account balance in a transaction
      await db.$transaction(async (tx) => {
        // Create new transaction
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: `${transaction.description} (Recurring)`,
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });

        // Update account balance
        const balanceChange =
          transaction.type === "EXPENSE"
            ? -transaction.amount
            : transaction.amount

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        // Update last processed date and next recurring date
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval!
            ),
          },
        });
      });
    });
  }
);


function calculateNextRecurringDate(date:Date, interval:string) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}


function isTransactionDue(transaction:Transaction) {
  // If no lastProcessed date, transaction is due
  if (!transaction.lastProcessed) return true;

  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate!);

  // Compare with nextDue date
  return nextDue <= today;
}



async function generateFinancialInsights(stats:any, month:any) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: ₹${stats.totalIncome}
    - Total Expenses: ₹${stats.totalExpenses}
    - Net Income: ₹${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: ₹${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}




export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" }, // First day of each month
  async ({ step }) => {
    const users = await step.run("fetch-users", async () => {
      return await db.user.findMany({
        include: { accounts: true },
      });
    });

    for (const user of users) {
      await step.run(`generate-report-${user.id}`, async () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const stats = await getMonthlyStats(user.id, lastMonth);
        const monthName = lastMonth.toLocaleString("default", {
          month: "long",
        });

        // Generate AI insights
        const insights = await generateFinancialInsights(stats, monthName);

        
        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName}`,
          react: EmailTemplate({
            userName: user.name!,
            type: "monthly-report",
            data: {
              stats,
              month: monthName,
              insights,
            },
          }),
        });
      });
    }

    return { processed: users.length };
  }
);

type MonthlyStats = {
  totalExpenses: number;
  totalIncome: number;
  byCategory: Record<string, number>; // This is the key fix!
  transactionCount: number;
};

async function getMonthlyStats(userId: string, month: Date): Promise<MonthlyStats> {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce<MonthlyStats>(
    (stats, t) => {
      const amount = t.amount.toNumber();

      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;

        // ✅ This will now be type-safe
        stats.byCategory[t.category] = 
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }

      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {}, // 👈 Make sure this matches the Record<string, number> type
      transactionCount: transactions.length
    }
  );
}
