import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/inngestClient";
import { checkBudgetAlerts, generateMonthlyReports, processRecurringTransaction, triggerRecurringTransactions } from "@/lib/inngest/inggestFunction";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [checkBudgetAlerts,triggerRecurringTransactions,processRecurringTransaction,generateMonthlyReports],
});
