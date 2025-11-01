import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { blockchainService } from "./blockchain";
import {
  verifyRequestSchema,
  settleRequestSchema,
  type VerifyResponse,
  type SettleResponse,
  type Stats,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // POST /api/verify - Verify payment payload
  app.post("/api/verify", async (req, res) => {
    try {
      // Validate request body
      const validationResult = verifyRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          valid: false,
          message: "Invalid request body: " + validationResult.error.message,
        });
      }

      const { paymentPayload, paymentDetails } = validationResult.data;

      // Verify payment with blockchain service
      const verificationResult = await blockchainService.verifyPaymentPayload(
        paymentPayload,
        paymentDetails
      );

      if (!verificationResult.valid) {
        return res.status(200).json({
          valid: false,
          message: verificationResult.message,
        } as VerifyResponse);
      }

      // Store transaction as verified
      const transaction = await storage.createTransaction({
        txHash: null,
        amount: paymentDetails.amount,
        status: "verified",
        networkId: paymentDetails.networkId,
        scheme: paymentDetails.scheme,
        paymentPayload,
        paymentDetails: JSON.stringify(paymentDetails),
        verifiedAt: new Date(),
        settledAt: null,
        error: null,
      });

      return res.status(200).json({
        valid: true,
        transactionId: transaction.id,
        message: "Payment payload verified successfully",
      } as VerifyResponse);
    } catch (error: any) {
      console.error("Verification error:", error);
      return res.status(500).json({
        valid: false,
        message: `Internal server error: ${error.message}`,
      });
    }
  });

  // POST /api/settle - Settle payment on blockchain
  app.post("/api/settle", async (req, res) => {
    try {
      // Validate request body
      const validationResult = settleRequestSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid request body: " + validationResult.error.message,
        });
      }

      const { paymentPayload, paymentDetails, transactionId } = validationResult.data;

      // First verify the payment
      const verificationResult = await blockchainService.verifyPaymentPayload(
        paymentPayload,
        paymentDetails
      );

      if (!verificationResult.valid) {
        return res.status(200).json({
          success: false,
          transactionId: transactionId || "unknown",
          message: `Verification failed: ${verificationResult.message}`,
        } as SettleResponse);
      }

      // Create or get transaction record
      let transaction;
      if (transactionId) {
        transaction = await storage.getTransaction(transactionId);
        if (!transaction) {
          return res.status(404).json({
            success: false,
            transactionId,
            message: "Transaction not found",
          });
        }
      } else {
        // Create new transaction
        transaction = await storage.createTransaction({
          txHash: null,
          amount: paymentDetails.amount,
          status: "verified",
          networkId: paymentDetails.networkId,
          scheme: paymentDetails.scheme,
          paymentPayload,
          paymentDetails: JSON.stringify(paymentDetails),
          verifiedAt: new Date(),
          settledAt: null,
          error: null,
        });
      }

      // Attempt settlement
      const settlementResult = await blockchainService.settlePayment({
        amount: paymentDetails.amount,
        to: paymentDetails.to,
        scheme: paymentDetails.scheme,
        tokenAddress: paymentDetails.tokenAddress,
      });

      if (!settlementResult.success) {
        // Update transaction with error
        await storage.updateTransaction(transaction.id, {
          status: "failed",
          error: settlementResult.message,
        });

        return res.status(200).json({
          success: false,
          transactionId: transaction.id,
          message: settlementResult.message,
        } as SettleResponse);
      }

      // Update transaction as settled
      await storage.updateTransaction(transaction.id, {
        status: "settled",
        txHash: settlementResult.txHash,
        settledAt: new Date(),
      });

      return res.status(200).json({
        success: true,
        txHash: settlementResult.txHash,
        transactionId: transaction.id,
        blockNumber: settlementResult.blockNumber,
        message: "Payment settled successfully",
      } as SettleResponse);
    } catch (error: any) {
      console.error("Settlement error:", error);
      return res.status(500).json({
        success: false,
        transactionId: req.body.transactionId || "unknown",
        message: `Internal server error: ${error.message}`,
      });
    }
  });

  // GET /api/stats - Get statistics and recent transactions
  app.get("/api/stats", async (req, res) => {
    try {
      const allTransactions = await storage.getAllTransactions();
      const verifiedTransactions = await storage.getTransactionsByStatus("verified");
      const settledTransactions = await storage.getTransactionsByStatus("settled");
      const totalVolume = await storage.getTotalVolume();
      const recentTransactions = await storage.getRecentTransactions(20);

      // Calculate success rate
      const totalProcessed = verifiedTransactions.length + settledTransactions.length;
      const successRate = totalProcessed > 0
        ? (settledTransactions.length / totalProcessed) * 100
        : 0;

      const stats: Stats = {
        totalVerified: allTransactions.length,
        totalSettled: settledTransactions.length,
        totalVolume,
        successRate,
        recentTransactions,
      };

      return res.status(200).json(stats);
    } catch (error: any) {
      console.error("Stats error:", error);
      return res.status(500).json({
        error: `Failed to get statistics: ${error.message}`,
      });
    }
  });

  // GET /api/network - Get network configuration
  app.get("/api/network", (req, res) => {
    const config = blockchainService.getNetworkConfig();
    const facilitatorAddress = blockchainService.getFacilitatorAddress();
    const walletConfigured = blockchainService.isWalletConfigured();

    return res.status(200).json({
      ...config,
      facilitatorAddress,
      walletConfigured,
      settlementAvailable: walletConfigured,
    });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      network: "Fluent Testnet",
      chainId: 20994,
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
