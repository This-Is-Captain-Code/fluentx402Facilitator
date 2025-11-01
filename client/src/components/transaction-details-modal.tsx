import { Transaction } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

export function TransactionDetailsModal({
  transaction,
  open,
  onClose,
}: TransactionDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!transaction) return null;

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      verified: "default",
      settled: "default",
      failed: "destructive",
      pending: "secondary",
    };
    return colors[status] || "secondary";
  };

  const DetailRow = ({
    label,
    value,
    copyable = false,
    monospace = false,
  }: {
    label: string;
    value: string;
    copyable?: boolean;
    monospace?: boolean;
  }) => (
    <div className="flex flex-col gap-1">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className={`flex items-center gap-2 ${monospace ? "font-mono text-sm" : ""}`}>
        <span className="break-all">{value}</span>
        {copyable && (
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => handleCopy(value, label)}
            data-testid={`button-copy-${label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            {copiedField === label ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        )}
      </dd>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="modal-transaction-details">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Transaction Details
            <Badge variant={getStatusColor(transaction.status) as any}>
              {transaction.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Complete information for transaction {transaction.id}
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-4 mt-4">
          <DetailRow
            label="Transaction ID"
            value={transaction.id}
            copyable
            monospace
          />

          {transaction.txHash && (
            <DetailRow
              label="Blockchain Hash"
              value={transaction.txHash}
              copyable
              monospace
            />
          )}

          <DetailRow
            label="Amount"
            value={`${transaction.amount} ETH`}
            monospace
          />

          <DetailRow label="Network ID" value={transaction.networkId} />

          <DetailRow label="Scheme" value={transaction.scheme} />

          <DetailRow
            label="Created At"
            value={format(new Date(transaction.createdAt), "PPpp")}
          />

          {transaction.verifiedAt && (
            <DetailRow
              label="Verified At"
              value={format(new Date(transaction.verifiedAt), "PPpp")}
            />
          )}

          {transaction.settledAt && (
            <DetailRow
              label="Settled At"
              value={format(new Date(transaction.settledAt), "PPpp")}
            />
          )}

          {transaction.error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4">
              <div className="text-sm font-medium text-destructive mb-2">
                Error
              </div>
              <div className="text-sm text-destructive/90 font-mono">
                {transaction.error}
              </div>
            </div>
          )}
        </dl>

        {transaction.txHash && (
          <div className="mt-6 flex justify-end gap-3">
            <Button asChild variant="outline" data-testid="button-view-explorer">
              <a
                href={`https://testnet.fluentscan.xyz/tx/${transaction.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Explorer
              </a>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
