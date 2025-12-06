


import { BilliardTable, Product, ProductCategory, Role, TableStatus, User } from './types';

export const INITIAL_USERS: User[] = [
  { id: 'u1', username: 'admin', role: Role.ADMIN, name: 'Admin', pin: '123456' },
  { id: 'u2', username: 'kasir', role: Role.CASHIER, name: 'Kasir', pin: '123456' },
];

export const BILLIARD_HOURLY_RATE = 20000; // Updated default rate

// FIX: Add missing initial data for products and tables.
export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Es Teh Manis', category: ProductCategory.COLD_DRINK, price: 5000, stock: 999 },
  { id: 'p2', name: 'Kopi Hitam', category: ProductCategory.HOT_DRINK, price: 6000, stock: 999 },
  { id: 'p3', name: 'Cappucino', category: ProductCategory.HOT_DRINK, price: 15000, stock: 50, stockLinkedToId: 'rm2' },
  { id: 'p4', name: 'Kentang Goreng', category: ProductCategory.SNACK, price: 12000, stock: 30 },
  { id: 'p5', name: 'Indomie Goreng', category: ProductCategory.SNACK, price: 10000, stock: 50 },
  { id: 'p6', name: 'Air Mineral', category: ProductCategory.COLD_DRINK, price: 4000, stock: 100 },
  { id: 'rm1', name: 'Gula Pasir', category: ProductCategory.RAW_MATERIAL, price: 0, stock: 5, unit: 'KG', yield: 200 }, // 1kg for 200 cups
  { id: 'rm2', name: 'Bubuk Kopi Premium', category: ProductCategory.RAW_MATERIAL, price: 0, stock: 2, unit: 'KG', yield: 100 }, // 1kg for 100 cups
];

export const INITIAL_TABLES: BilliardTable[] = [
  { id: 1, name: 'Meja 1', status: TableStatus.AVAILABLE, startTime: null, durationMinutes: 0, hourlyRate: BILLIARD_HOURLY_RATE },
  { id: 2, name: 'Meja 2', status: TableStatus.AVAILABLE, startTime: null, durationMinutes: 0, hourlyRate: BILLIARD_HOURLY_RATE },
  { id: 3, name: 'Meja 3', status: TableStatus.AVAILABLE, startTime: null, durationMinutes: 0, hourlyRate: BILLIARD_HOURLY_RATE },
  { id: 4, name: 'Meja 4', status: TableStatus.AVAILABLE, startTime: null, durationMinutes: 0, hourlyRate: BILLIARD_HOURLY_RATE },
  { id: 5, name: 'Meja 5', status: TableStatus.AVAILABLE, startTime: null, durationMinutes: 0, hourlyRate: BILLIARD_HOURLY_RATE },
  { id: 6, name: 'Meja 6', status: TableStatus.AVAILABLE, startTime: null, durationMinutes: 0, hourlyRate: BILLIARD_HOURLY_RATE },
];


// KUNCI RAHASIA GOOGLE AUTHENTICATOR (Base32)
// Kode ini yang menghubungkan App dengan HP Anda.
// Jangan disebar sembarangan.
export const GOOGLE_AUTH_SECRET = 'JBSWY3DPEHPK3PXP'; 
// Jika ingin ganti, gunakan generator Base32 random (16-32 karakter huruf kapital A-Z dan angka 2-7)

// Durasi Auto-Lock jika tidak ada aktivitas (dalam menit)
export const AUTO_LOCK_MINUTES = 15; 

// Base64 encoded SVG for the store logo (B&W, optimized for thermal printers).
export const STORE_LOGO_BASE64 = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzODQgMTIwIiB3aWR0aD0iMzg0IiBoZWlnaHQ9IjEyMCI+PGcgZmlsbD0iYmxhY2siIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj48cmVjdCB3aWR0aD0iMzg0IiBoZWlnaHQ9IjEyMCIgZmlsbD0id2hpdGUiLz48dGV4dCB4PSI1MCUiIHk9IjUwIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjYwIiBmb250LXdlaWdodD0iYm9sZCI+WllSQTwvdGV4dD48dGV4dCB4PSI1MCUiIHk9Ijk1IiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE4IiBmb250LXdlaWdodD0iYm9sZCI+QklMTElBUkQgJmFtcDsgQ09GRkVSPC90ZXh0PjwvZz48L3N2Zz4=`;

// Base64 encoded full-color logo for UI elements.
export const APP_LOGO_COLOR_BASE64 = `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAJQAwgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD23FBoFFABRQKKACigUUAFFBooAKKKKACigUUAFFBooAKKBRQAUUDmigAooFFABRQaKACigUUAFFBooAKKKKACigUUAFFBooAKKBRQAUUDmigAooFFABRQaKACigUUAFFBooAKKKKACigUUAFFBooAKKBRQAUUDmigAooFFABRQaKACigUUAFFBooAKKKKACigUUAFFBooAKKBRQAUUGigAooFFABRQKKACigUUAFFBooAKKKKACigUUAFFBooAKKBRQAUUGigAooFFABRQaKACiiigAopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFooooAKKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKSigBaKKKACiiigAopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFooooAKKKKACikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWiiigAopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFooooAKKKKACikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWiiigAopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFooooAKKKKACikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWiiigAopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFopKKAFooooAKKKKACikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAKKKKACikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikooAWikoo-`;
