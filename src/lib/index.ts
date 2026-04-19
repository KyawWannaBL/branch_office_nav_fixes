import type {
  Delivery,
  Merchant,
  Deliveryman,
  Receipt,
  Transaction,
  Account,
  Report,
} from './lib/index';

/**
 * Production-safe data module.
 *
 * No mock business data is shipped from the frontend.
 * Real data should come from Supabase / API calls.
 *
 * These exports stay in place so existing imports do not break
 * while you migrate pages to real backend data.
 */

export const deliveriesSeed: Delivery[] = [];
export const merchantsSeed: Merchant[] = [];
export const deliverymenSeed: Deliveryman[] = [];
export const receiptsSeed: Receipt[] = [];
export const transactionsSeed: Transaction[] = [];
export const accountsSeed: Account[] = [];
export const reportsSeed: Report[] = [];

// Backward-compatible aliases
export const mockDeliveries: Delivery[] = deliveriesSeed;
export const mockMerchants: Merchant[] = merchantsSeed;
export const mockDeliverymen: Deliveryman[] = deliverymenSeed;
export const mockReceipts: Receipt[] = receiptsSeed;
export const mockTransactions: Transaction[] = transactionsSeed;
export const mockAccounts: Account[] = accountsSeed;
export const mockReports: Report[] = reportsSeed;

// Async accessors for future real backend integration
export async function listDeliveries(): Promise<Delivery[]> {
  return deliveriesSeed;
}

export async function listMerchants(): Promise<Merchant[]> {
  return merchantsSeed;
}

export async function listDeliverymen(): Promise<Deliveryman[]> {
  return deliverymenSeed;
}

export async function listReceipts(): Promise<Receipt[]> {
  return receiptsSeed;
}

export async function listTransactions(): Promise<Transaction[]> {
  return transactionsSeed;
}

export async function listAccounts(): Promise<Account[]> {
  return accountsSeed;
}

export async function listReports(): Promise<Report[]> {
  return reportsSeed;
}

// Optional sync getters
export function getDeliveries(): Delivery[] {
  return deliveriesSeed;
}

export function getMerchants(): Merchant[] {
  return merchantsSeed;
}

export function getDeliverymen(): Deliveryman[] {
  return deliverymenSeed;
}

export function getReceipts(): Receipt[] {
  return receiptsSeed;
}

export function getTransactions(): Transaction[] {
  return transactionsSeed;
}

export function getAccounts(): Account[] {
  return accountsSeed;
}

export function getReports(): Report[] {
  return reportsSeed;
}

const dataStore = {
  deliveries: deliveriesSeed,
  merchants: merchantsSeed,
  deliverymen: deliverymenSeed,
  receipts: receiptsSeed,
  transactions: transactionsSeed,
  accounts: accountsSeed,
  reports: reportsSeed,
};

export default dataStore;
