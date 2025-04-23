import { getCurrentBudget } from '@/actions/BudgetActions';
import { db } from '../prisma';
import { inngest } from './inngestClient';
import { sendEmail } from '@/actions/SendEmail';  // Assuming this exists
import TestEmail from '@/emails/my-email';
import EmailTemplate from '@/emails/Template';



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
