import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { StatsCard } from "@/components/stats-card";
import { TransactionTable } from "@/components/transaction-table";
import { TransactionDetailsModal } from "@/components/transaction-details-modal";
import { type Transaction, type Stats } from "@shared/schema";
import { CheckCircle, FileCheck, DollarSign, TrendingUp, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatWeiToEth } from "@/lib/utils";

export default function Dashboard() {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: stats, isLoading, refetch, isFetching } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setModalOpen(true);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2" data-testid="text-dashboard-title">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Monitor payment verification and settlement activity
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isFetching}
            className="gap-2"
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 rounded-md" />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Verified"
                value={stats?.totalVerified || 0}
                icon={FileCheck}
              />
              <StatsCard
                title="Settled"
                value={stats?.totalSettled || 0}
                icon={CheckCircle}
              />
              <StatsCard
                title="Volume"
                value={`${formatWeiToEth(stats?.totalVolume || "0")} ETH`}
                icon={DollarSign}
              />
              <StatsCard
                title="Success Rate"
                value={`${stats?.successRate.toFixed(1) || "0"}%`}
                icon={TrendingUp}
              />
            </>
          )}
        </div>

        {/* Transactions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Recent Transactions
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 rounded-md" />
              ))}
            </div>
          ) : (
            <TransactionTable
              transactions={stats?.recentTransactions || []}
              onTransactionClick={handleTransactionClick}
            />
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
