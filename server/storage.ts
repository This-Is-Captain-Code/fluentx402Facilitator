import { type Transaction, type InsertTransaction, transactions } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

// Storage interface for x402 facilitator

export interface IStorage {
  // Transaction management
  getTransaction(id: string): Promise<Transaction | undefined>;
  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined>;
  
  // Stats and queries
  getTransactionsByStatus(status: string): Promise<Transaction[]>;
  getTotalVolume(): Promise<string>;
  getRecentTransactions(limit: number): Promise<Transaction[]>;
}

export class MemStorage implements IStorage {
  private transactions: Map<string, Transaction>;

  constructor() {
    this.transactions = new Map();
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      txHash: null,
      verifiedAt: null,
      settledAt: null,
      error: null,
      ...insertTransaction,
      id,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    const updated = { ...transaction, ...updates };
    this.transactions.set(id, updated);
    return updated;
  }

  async getTransactionsByStatus(status: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (tx) => tx.status === status
    );
  }

  async getTotalVolume(): Promise<string> {
    const total = Array.from(this.transactions.values())
      .filter((tx) => tx.status === 'settled')
      .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    return total.toFixed(4);
  }

  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export class DbStorage implements IStorage {
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    return result[0];
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      txHash: null,
      verifiedAt: null,
      settledAt: null,
      error: null,
      ...insertTransaction,
      id,
      createdAt: new Date(),
    };
    await db.insert(transactions).values(transaction);
    return transaction;
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction | undefined> {
    const result = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, id))
      .returning();
    return result[0];
  }

  async getTransactionsByStatus(status: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.status, status));
  }

  async getTotalVolume(): Promise<string> {
    const result = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${transactions.amount} AS NUMERIC)), 0)` })
      .from(transactions)
      .where(eq(transactions.status, 'settled'));
    
    const total = parseFloat(result[0]?.total || '0');
    return total.toFixed(4);
  }

  async getRecentTransactions(limit: number = 10): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }
}

export const storage = new DbStorage();
