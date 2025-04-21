"use client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Account } from '@/types';
import { ArrowDownRight, ArrowUpRight, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';  // Make sure you have this for toast notifications
import { updateDefaultAccount } from '@/actions/AccountActions'; // Assume this function handles the API call



// Destructure the `account` prop
const AccountCard = ({ account }: { account: Account }) => {
  const { name, type, balance, id, isDefault } = account;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleDefaultChange = async (event: React.MouseEvent) => {
    event.preventDefault(); // Prevent navigation

    if (isDefault) {
      toast.warning("You need at least 1 default account");
      return; 
    }

    setLoading(true);
    try {
      const response = await updateDefaultAccount(id);
      if (response.success) {
        toast.success("Default account updated successfully");
      } else {
        toast.error("Failed to update default account");
      }
    } catch (err: any) {
      setError(err);
      toast.error(err.message || "An error occurred while updating the default account");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update default account");
    }
  }, [error]);

  return (
    <Card className="hover:shadow-md transition-shadow group relative">
      <Link href={`/account/${id}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium capitalize">
            {name}
          </CardTitle>
          <Switch
            checked={isDefault}
            onClick={handleDefaultChange}
            disabled={loading}
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
          <IndianRupee className="inline h-4 w-4" />
           {balance.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {type.charAt(0) + type.slice(1).toLowerCase()} Account
          </p>
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            Income
          </div>
          <div className="flex items-center">
            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            Expense
          </div>
        </CardFooter>
      </Link>
    </Card>
  );
};

export default AccountCard;