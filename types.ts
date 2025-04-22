export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export enum AccountType {
  CURRENT = "CURRENT",
  SAVINGS = "SAVINGS",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum RecurringInterval {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY",
}

export type User = {
  id: string;
  clerkUserId: string;
  email: string;
  name?: string;
  imageUrl?: string;
  transactions: Transaction[];
  accounts: Account[];
  budgets: Budget[];
  createdAt: Date;
  updatedAt: Date;
};

export interface AccountFormValues {
  name: string;
  type: "CURRENT" | "SAVINGS";
  balance: number;
  isDefault: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: "CURRENT" | "SAVINGS";
  balance: number;
  isDefault: boolean;
  userId: string;  // changed String to string for consistency
  user: User;
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

export type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number; // using number for balance and amount
  description?: string | null;
  date: Date;
  category: string;
  receiptUrl?: string;
  isRecurring: boolean;
  recurringInterval?:"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" ;
  nextRecurringDate?: Date;
  lastProcessed?: Date;
  status:"PENDING" | "COMPLETED" | "FAILED" ;
  userId: string;
  accountId: string;
  createdAt: Date;
  updatedAt: Date;
};


export type TransactionFormValues = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  description?: string;
  date: Date;
  accountId: string;
  category: string;
  isRecurring?: boolean;
  recurringInterval?: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
};



export type Budget = {
  id: string;
  amount: number; // using number for budget amount
  lastAlertSent: Date | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};
