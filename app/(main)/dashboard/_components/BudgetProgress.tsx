"use client";

import { useState, useEffect } from "react";
import { Pencil, Check, X, IndianRupee } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBudget } from "@/actions/BudgetActions";

const BudgetProgress = ({
  initialBudget,
  currentExpenses,
}: {
  initialBudget: any;
  currentExpenses: number;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || ""
  );

  const [loading, setLoading] = useState(false);

  const percentUsed = initialBudget
    ? (currentExpenses / initialBudget.amount) * 100
    : 0;

  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const result = await updateBudget(amount);
      if (result.success) {
        toast.success("Budget updated successfully");
        setIsEditing(false);
        // Optionally update local budget state if needed here
      } else {
        toast.error(!result.error || "Failed to update budget");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update budget");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewBudget(initialBudget?.amount?.toString() || "");
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-sm font-medium">
            Monthly Budget (Default Account)
          </CardTitle>
          <div className="flex items-center gap-2 mt-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-32"
                  placeholder="Enter amount"
                  autoFocus
                  disabled={loading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUpdateBudget}
                  disabled={loading}
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <>
                <CardDescription>
  {initialBudget ? (
    <>
      <IndianRupee className="inline h-4 w-4" />
      {`${currentExpenses.toFixed(2)} of `}
      <IndianRupee className="inline h-4 w-4" />
      {` ${initialBudget.amount.toFixed(2)} spent`}
    </>
  ) : (
    "No budget set"
  )}
</CardDescription>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                  className="h-6 w-6"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {initialBudget && (
          <div className="space-y-2">
<Progress value={percentUsed} />
            <p className="text-xs text-muted-foreground text-right">
              {percentUsed.toFixed(1)}% used
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetProgress;
