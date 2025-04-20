// types.ts (optional file for clean reuse)
export interface AccountFormValues {
    name: string;
    type: "CURRENT" | "SAVINGS";
    balance: string;
    isDefault: boolean;
  }
  

export interface Account{
  id: string;
  name: string;
  type: 'CURRENT' | 'SAVINGS';
  balance: string;
  isDefault: boolean;
}