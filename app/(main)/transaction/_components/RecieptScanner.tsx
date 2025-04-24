"use client";

import { useRef, useState, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { scanReceipt } from "@/actions/TransactionActions";
import { ScannedData } from "@/types"; // adjust path based on your folder structure

interface ReceiptScannerProps {
  onScanComplete: (scannedData: ScannedData) => void;
}

export function ReceiptScanner({ onScanComplete }: ReceiptScannerProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [scanReceiptLoading, setScanReceiptLoading] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const handleReceiptScan = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    setScanReceiptLoading(true);
    setError(null);

    try {
      const response = await scanReceipt(file);
      setScannedData(response);
      console.log('the data from scanner backend',response)
      setError(null);
    } catch (error: any) {
      setError(error);
      toast.error(error.message);
    } finally {
      setScanReceiptLoading(false);
    }
  };

  useEffect(() => {
    if (scannedData) {
      console.log('the scanned data is',scannedData)
      onScanComplete(scannedData);
      toast.success("Receipt scanned successfully");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedData]); // Ensure onScanComplete is memoized from the parent
  

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptScan(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanReceiptLoading}
      >
        {scanReceiptLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" />
            <span>Scanning Receipt...</span>
          </>
        ) : (
          <>
            <Camera className="mr-2" />
            <span>Scan Receipt with AI</span>
          </>
        )}
      </Button>
    </div>
  );
}
