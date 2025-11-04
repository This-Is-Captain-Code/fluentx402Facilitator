import { pgTable, text, varchar, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Payment verification and settlement schemas for x402 protocol

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey(),
  txHash: text("tx_hash"),
  amount: text("amount").notNull(),
  status: text("status").notNull(), // 'verified', 'settled', 'failed', 'pending'
  networkId: text("network_id").notNull(),
  scheme: text("scheme").notNull(),
  paymentPayload: text("payment_payload").notNull(),
  paymentDetails: text("payment_details").notNull(),
  verifiedAt: timestamp("verified_at"),
  settledAt: timestamp("settled_at"),
  error: text("error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// x402 Protocol Types (not stored in DB, just for API contracts)

// Supported payment schemes
export const PaymentScheme = {
  EVM_NATIVE: "evm-native",
  EVM_ERC20: "evm-erc20",
} as const;

// Fluent testnet FLUID token contract address (Fluent USD - EIP 3009 compliant)
export const FLUID_ADDRESS = "0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0";

export const verifyRequestSchema = z.object({
  paymentPayload: z.string(), // Serialized signed transaction (RLP-encoded)
  paymentDetails: z.object({
    networkId: z.string(),
    amount: z.string(),
    to: z.string(), // Recipient address
    from: z.string().optional(), // Sender address (recovered from signature if not provided)
    scheme: z.enum([PaymentScheme.EVM_NATIVE, PaymentScheme.EVM_ERC20]),
    tokenAddress: z.string().optional(),
  }),
});

export type VerifyRequest = z.infer<typeof verifyRequestSchema>;

export const verifyResponseSchema = z.object({
  valid: z.boolean(),
  message: z.string().optional(),
  transactionId: z.string().optional(),
});

export type VerifyResponse = z.infer<typeof verifyResponseSchema>;

export const settleRequestSchema = z.object({
  paymentPayload: z.string(), // Serialized signed transaction (RLP-encoded)
  paymentDetails: z.object({
    networkId: z.string(),
    amount: z.string(),
    to: z.string(), // Recipient address
    from: z.string().optional(), // Sender address (recovered from signature if not provided)
    scheme: z.enum([PaymentScheme.EVM_NATIVE, PaymentScheme.EVM_ERC20]),
    tokenAddress: z.string().optional(),
  }),
  transactionId: z.string().optional(),
});

export type SettleRequest = z.infer<typeof settleRequestSchema>;

export const settleResponseSchema = z.object({
  success: z.boolean(),
  txHash: z.string().optional(),
  transactionId: z.string(),
  message: z.string().optional(),
  blockNumber: z.number().optional(),
});

export type SettleResponse = z.infer<typeof settleResponseSchema>;

export const statsSchema = z.object({
  totalVerified: z.number(),
  totalSettled: z.number(),
  totalVolume: z.string(),
  successRate: z.number(),
  recentTransactions: z.array(z.custom<Transaction>()),
});

export type Stats = z.infer<typeof statsSchema>;

// Network configuration
export const networkConfigSchema = z.object({
  chainId: z.number(),
  name: z.string(),
  rpcUrl: z.string(),
  symbol: z.string(),
  explorer: z.string(),
});

export type NetworkConfig = z.infer<typeof networkConfigSchema>;
