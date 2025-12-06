
export enum Role {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER'
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED'
}

export enum ProductCategory {
  COLD_DRINK = 'Minuman Dingin',
  HOT_DRINK = 'Minuman Panas',
  SNACK = 'Makanan Ringan',
  RAW_MATERIAL = 'Bahan Baku'
}

export interface User {
  id: string;
  username: string; // Used for login display (e.g. initials)
  role: Role;
  name: string; // Full name
  pin: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  stockLinkedToId?: string; // Optional: ID of another product to deduct stock from
  unit?: string; // e.g. 'Kg', 'Gram', 'Pack'
  yield?: number; // Estimated serving yield (e.g. 1kg = 50 cups)
}

export interface BilliardTable {
  id: number;
  name: string;
  status: TableStatus;
  startTime: number | null; // Timestamp
  durationMinutes: number; // Planned duration
  customerName?: string;
  hourlyRate: number; // Price per hour
}

export interface CartItem {
  itemId: string; // Product ID or Table ID (stringified)
  itemType: 'PRODUCT' | 'BILLIARD';
  quantity: number;
  name: string;
  price: number;
  tableId?: number; // Only if itemType is BILLIARD
}

export interface Transaction {
  id: string;
  date: string;
  timestamp: number;
  total: number;
  type: 'BILLIARD' | 'CAFE' | 'MIXED';
  details: string; // Summary description
  cashierName: string;
  customerName?: string;
}

export interface CashierShift {
  id: string;
  cashierId: string;
  cashierName: string;
  startTime: number;
  endTime: number | null;
  startCash: number; // Modal Awal
  totalSales: number; // Total Penjualan Sesi Ini
  status: 'OPEN' | 'CLOSED';
}

export interface AppSettings {
  googleScriptUrl?: string;
  storeName?: string;
  storeAddress?: string; // New: Address for receipt
  storePhone?: string;   // New: Phone for receipt
  customReceiptFooter?: string; // New: Custom message for receipt footer (e.g., WiFi password)
}

export interface AppState {
  user: User | null;
  activeShift: CashierShift | null; // Shift yang sedang aktif
  tables: BilliardTable[];
  products: Product[];
  cart: CartItem[];
  transactions: Transaction[];
  users: User[]; // List of all users (for admin)
  settings: AppSettings;
  lastUpdated?: number; // Timestamp of the last state change for real-time sync
}

export type AppAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'OPEN_SHIFT'; payload: { startCash: number; cashierName: string; cashierId: string } }
  | { type: 'CLOSE_SHIFT' }
  | { type: 'START_TABLE'; payload: { tableId: number; duration: number; customer: string } } 
  | { type: 'STOP_TABLE'; payload: { tableId: number } }
  | { type: 'TOPUP_TABLE'; payload: { tableId: number; duration: number } }
  | { type: 'MOVE_TABLE'; payload: { fromId: number; toId: number } }
  | { type: 'ADD_PRODUCT_TO_CART'; payload: Product }
  | { type: 'ADD_TABLE_TO_CART'; payload: BilliardTable }
  | { type: 'REMOVE_FROM_CART'; payload: string } 
  | { type: 'CLEAR_CART' }
  | { type: 'CHECKOUT'; payload: { total: number; cashierName: string; customerName: string } }
  | { type: 'UPDATE_STOCK'; payload: { productId: string; quantity: number } }
  | { type: 'SET_PRODUCT_STOCK'; payload: { productId: string; stock: number } }
  | { type: 'ADD_NEW_PRODUCT'; payload: Product }
  | { type: 'EDIT_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_TABLE'; payload: BilliardTable }
  | { type: 'EDIT_TABLE'; payload: BilliardTable }
  | { type: 'DELETE_TABLE'; payload: number }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'EDIT_USER'; payload: User }
  | { type: 'REMOVE_USER'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: AppSettings }
  | { type: 'IMPORT_DATA'; payload: AppState }
  | { type: 'RESET_APP' };