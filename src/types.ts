export type CustomsStatus = 'cleared' | 'clearing' | 'arrived';

export interface Product {
  id: string;
  sku: string;
  name: string;
  imageUrl: string;
  stock: number;
  costPrice: number; // In CNY
  customsStatus: CustomsStatus;
}

export type TransactionType = 'in' | 'out';

export interface Transaction {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number;
  date: string;
}

export interface TransactionRecord {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number;
  date: string;
  note?: string;
}
