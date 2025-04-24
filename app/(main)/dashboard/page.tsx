import { getUserAccounts } from '@/actions/AccountActions';
import { CreateAccountDrawer } from '@/components/CreateAccountDrawer';
import { Card, CardContent } from '@/components/ui/card';
import { AccountFormValues, Account } from '@/types';
import { PlusIcon } from 'lucide-react';
import React from 'react';
import AccountCard from './_components/AccountCard';
import { getCurrentBudget } from '@/actions/BudgetActions';
import BudgetProgress from './_components/BudgetProgress';
import { DashboardOverview } from './_components/DashboardOverview';
import { getDashboardData } from '@/actions/TransactionActions';

const DashboardPage = async () => {
  const accounts: Account[] | undefined = await getUserAccounts();
  
  const defaultAccount=accounts.find((account)=>account.isDefault)

  const transactions=await getDashboardData()
  let budgetData=null
  if(defaultAccount){
    budgetData=await getCurrentBudget(defaultAccount.id)
  }
  return (
    <div className="px-5">
      {defaultAccount  && <div className='my-6'> <BudgetProgress initialBudget={budgetData?.budget!} currentExpenses={budgetData?.currentExpenses || 0}/></div>}
      
      <div>

      <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
        />
        </div>

      <div className="my-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateAccountDrawer>
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
            <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
              <PlusIcon className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Add new Account</p>
            </CardContent>
          </Card>
        </CreateAccountDrawer>

        {accounts?.length! > 0 &&
          accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
      </div>
    </div>
  );
};

export default DashboardPage;
