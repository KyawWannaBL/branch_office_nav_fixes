import type {
  Delivery,
  Merchant,
  Deliveryman,
  Receipt,
  Transaction,
  Account,
  Report,
<<<<<<< HEAD
} from './lib/index';

/**
 * Production-safe data module.
 * No mock business data is shipped from the frontend.
 * Replace these with real API / Supabase queries later.
 */

export const deliveriesSeed: Delivery[] = [];
export const merchantsSeed: Merchant[] = [];
export const deliverymenSeed: Deliveryman[] = [];
export const receiptsSeed: Receipt[] = [];
export const transactionsSeed: Transaction[] = [];
export const accountsSeed: Account[] = [];
export const reportsSeed: Report[] = [];

/**
 * Backward-compatible aliases so existing imports do not break yet.
 */
export const mockDeliveries: Delivery[] = deliveriesSeed;
export const mockMerchants: Merchant[] = merchantsSeed;
export const mockDeliverymen: Deliveryman[] = deliverymenSeed;
export const mockReceipts: Receipt[] = receiptsSeed;
export const mockTransactions: Transaction[] = transactionsSeed;
export const mockAccounts: Account[] = accountsSeed;
export const mockReports: Report[] = reportsSeed;

/**
 * Async accessors for future migration.
 */
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

/**
 * Optional sync getters.
 */
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
=======
} from '../lib/index';

// Exporting empty arrays to eliminate mock data and fix import errors
export const mockDeliveries: Delivery[] = [];
export const mockMerchants: Merchant[] = [];
export const mockDeliverymen: Deliveryman[] = [];
export const mockReceipts: Receipt[] = [];
export const mockTransactions: Transaction[] = [];
export const mockAccounts: Account[] = [];
export const mockReports: Report[] = [];
>>>>>>> e32dd05 (Fix production data module and lib exports)
