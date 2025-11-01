import { Transaction } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface TransactionTableProps {
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
}

export function TransactionTable({
  transactions,
  onTransactionClick,
}: TransactionTableProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const truncateHash = (hash: string) => {
    if (!hash) return "N/A";
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const handleCopy = async (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      verified: { variant: "default", label: "Verified" },
      settled: { variant: "default", label: "Settled" },
      failed: { variant: "destructive", label: "Failed" },
      pending: { variant: "secondary", label: "Pending" },
    };

    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant} data-testid={`badge-status-${status}`}>
        {config.label}
      </Badge>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-md border bg-card p-12 text-center" data-testid="empty-transactions">
        <p className="text-muted-foreground">No transactions yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Transactions will appear here once payment verification starts
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Transaction Hash</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Network</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow
              key={tx.id}
              className="hover-elevate cursor-pointer"
              onClick={() => onTransactionClick?.(tx)}
              data-testid={`row-transaction-${tx.id}`}
            >
              <TableCell className="font-mono text-sm" data-testid={`text-timestamp-${tx.id}`}>
                {format(new Date(tx.createdAt), "MMM dd, HH:mm:ss")}
              </TableCell>
              <TableCell className="font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span data-testid={`text-hash-${tx.id}`}>
                    {truncateHash(tx.txHash || tx.id)}
                  </span>
                  {tx.txHash && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => handleCopy(tx.txHash!, e)}
                      data-testid={`button-copy-${tx.id}`}
                    >
                      {copiedHash === tx.txHash ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono" data-testid={`text-amount-${tx.id}`}>
                {tx.amount} ETH
              </TableCell>
              <TableCell>{getStatusBadge(tx.status)}</TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {tx.networkId}
                </span>
              </TableCell>
              <TableCell>
                {tx.txHash && (
                  <Button
                    size="icon"
                    variant="ghost"
                    asChild
                    className="h-8 w-8"
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    data-testid={`button-explorer-${tx.id}`}
                  >
                    <a
                      href={`https://testnet.fluentscan.xyz/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
