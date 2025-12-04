
import { BilliardTable, Product, ProductCategory, Role, TableStatus, User } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'u1', username: 'admin', role: Role.ADMIN, name: 'Admin', pin: '123456' },
  { id: 'u2', username: 'kasir', role: Role.CASHIER, name: 'Kasir', pin: '123456' },
];

export const BILLIARD_HOURLY_RATE = 20000; // Updated default rate

// KUNCI RAHASIA GOOGLE AUTHENTICATOR (Base32)
// Kode ini yang menghubungkan App dengan HP Anda.
// Jangan disebar sembarangan.
export const GOOGLE_AUTH_SECRET = 'JBSWY3DPEHPK3PXP'; 
// Jika ingin ganti, gunakan generator Base32 random (16-32 karakter huruf kapital A-Z dan angka 2-7)

export const INITIAL_TABLES: BilliardTable[] = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  name: `Meja ${i + 1}`,
  status: TableStatus.AVAILABLE,
  startTime: null,
  durationMinutes: 0,
  hourlyRate: BILLIARD_HOURLY_RATE 
}));

export const INITIAL_PRODUCTS: Product[] = [
  // Cold Drinks
  { id: 'p1', name: 'Es Teh Manis', category: ProductCategory.COLD_DRINK, price: 5000, stock: 100 },
  { id: 'p2', name: 'Es Jeruk', category: ProductCategory.COLD_DRINK, price: 7000, stock: 50 },
  { id: 'p3', name: 'Coca Cola', category: ProductCategory.COLD_DRINK, price: 8000, stock: 48 },
  { id: 'p4', name: 'Air Mineral', category: ProductCategory.COLD_DRINK, price: 4000, stock: 200 },
  // Hot Drinks
  { id: 'p5', name: 'Kopi Hitam', category: ProductCategory.HOT_DRINK, price: 5000, stock: 30 },
  { id: 'p6', name: 'Cappuccino', category: ProductCategory.HOT_DRINK, price: 12000, stock: 25 },
  { id: 'p7', name: 'Teh Panas', category: ProductCategory.HOT_DRINK, price: 4000, stock: 50 },
  // Snacks
  { id: 'p8', name: 'Kentang Goreng', category: ProductCategory.SNACK, price: 15000, stock: 20 },
  { id: 'p9', name: 'Sosis Bakar', category: ProductCategory.SNACK, price: 12000, stock: 30 },
  { id: 'p10', name: 'Roti Bakar', category: ProductCategory.SNACK, price: 10000, stock: 15 },
  { id: 'p11', name: 'Indomie Goreng', category: ProductCategory.SNACK, price: 8000, stock: 100 },
];