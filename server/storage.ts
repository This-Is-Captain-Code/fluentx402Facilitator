import { type Transaction, type InsertTransaction } from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
