
// FIX: Corrected React import statement by removing stray 'a,'.
import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useRef } from 'react';
import { AppAction, AppState, TableStatus, Transaction, ProductCategory, CashierShift, CartItem } from '../types';
import { INITIAL_PRODUCTS as MOCK_PRODUCTS, INITIAL_TABLES as MOCK_TABLES, INITIAL_USERS as MOCK_USERS, BILLIARD_HOURLY_RATE } from '../constants';
import { ThermalPrinter, ReceiptData } from '../utils/printer'; // Import ThermalPrinter

const STORAGE_KEY = 'ZYRA_KASIR_POS_DATA_V1';

// --- FACTORY DEFAULT STATE ---
// This state is ONLY used if no data exists in localStorage.
const factoryDefaultState: AppState = {
  user: null,
  activeShift: null,
  tables: MOCK_TABLES,
  products: MOCK_PRODUCTS,
  cart: [],
  transactions: [],
  users: MOCK_USERS,
  settings: {
    googleScriptUrl: 'https://script.google.com/macros/s/AKfycbzcv_DIzZLa8iNN1a4dwaZSK9XzKi_LAClLLyQOlGt0505OSPOcQJK_rQBpp7_7mfuXOQ/exec', 
    storeName: 'Zyra Billiard dan Kopi',
    storeAddress: 'Jln raya depan karangtinggil - pucuk',
    storePhone: '085117310258',
    customReceiptFooter: 'Reservasi & Info: 085117310258'
  },
  lastUpdated: Date.now()
};

// --- NEW: ROBUST STATE INITIALIZATION ---
// This function is now the single source of truth for loading the initial state.
// It prioritizes user's stored data over factory defaults.
const getInitialState = (): AppState => {
  if (typeof window === 'undefined') {
      return factoryDefaultState;
  }
  
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState) {
      const parsed = JSON.parse(serializedState);
      
      // Basic validation to ensure the data is not corrupted
      if (parsed.users && parsed.products && parsed.tables) {
        // --- Data Migration Logic ---
        // This ensures that when we add new features, old data is compatible.
        const migratedTables = parsed.tables.map((t: any) => ({
             ...t,
             hourlyRate: t.hourlyRate || BILLIARD_HOURLY_RATE
        }));
        
        const defaultSettings = factoryDefaultState.settings;
        const migratedSettings = {
            ...defaultSettings,
            ...(parsed.settings || {}),
        };
        
        return { 
            ...factoryDefaultState, // Start with a complete structure
            ...parsed,             // Overwrite with user's saved data
            tables: migratedTables, 
            settings: migratedSettings,
            activeShift: parsed.activeShift || null,
            lastUpdated: parsed.lastUpdated || Date.now()
        };
      }
    }
  } catch (e) {
    console.error("Critical Error: Failed to load state from storage. Resetting to default.", e);
    // If parsing fails, it's safer to reset than to crash the app.
    // We can add more robust error handling here in the future.
    localStorage.removeItem(STORAGE_KEY);
  }

  // If we reach here, it means no valid data was found in localStorage.
  // So, we return the factory default state.
  return factoryDefaultState;
};


export type SyncStatus = 'IDLE' | 'PENDING' | 'SYNCING' | 'SUCCESS' | 'ERROR';
export type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  syncStatus: SyncStatus;
  printerStatus: PrinterStatus;
  connectPrinter: () => Promise<void>;
  printReceipt: (receiptData: ReceiptData) => Promise<void>;
} | undefined>(undefined);

function appReducer(state: AppState, action: AppAction): AppState {
  const newState = ((): Omit<AppState, 'lastUpdated'> => {
      switch (action.type) {
        case 'LOGIN':
          return { ...state, user: action.payload };
        case 'LOGOUT':
          // Logout biasa hanya menghapus sesi user, tidak menutup shift kasir.
          return { ...state, user: null };

        // --- LOGIKA SHIFT KASIR ---
        case 'OPEN_SHIFT': {
            const { startCash, cashierName, cashierId } = action.payload;
            const newShift: CashierShift = {
                id: `SHIFT-${Date.now()}`,
                cashierId,
                cashierName,
                startTime: Date.now(),
                endTime: null,
                startCash,
                totalSales: 0,
                status: 'OPEN'
            };
            return { ...state, activeShift: newShift };
        }

        case 'CLOSE_SHIFT': {
            // Aksi ini sekarang menutup shift DAN me-logout user.
            // Sesuai dengan label tombol "Tutup Kasir & Logout".
            return { ...state, activeShift: null, user: null };
        }
        // --------------------------
        
        case 'START_TABLE': {
          const { tableId, duration, customer } = action.payload;
          return {
            ...state,
            tables: state.tables.map(t => 
              t.id === tableId 
                ? { ...t, status: TableStatus.OCCUPIED, startTime: Date.now(), durationMinutes: duration, customerName: customer }
                : t
            ),
          };
        }

        case 'STOP_TABLE': {
          const { tableId } = action.payload;
          const table = state.tables.find(t => t.id === tableId);
          if (!table || !table.startTime) return state;

          const rate = table.hourlyRate || BILLIARD_HOURLY_RATE;
          const now = Date.now();
          const durationHours = (now - table.startTime) / (1000 * 60 * 60);
          const totalCost = Math.ceil(durationHours * rate);
          const durationMinutes = Math.floor(durationHours * 60);

          const newTransaction: Transaction = {
            id: `TX-BILL-${Date.now()}`,
            date: new Date().toISOString(),
            timestamp: Date.now(),
            total: totalCost,
            type: 'BILLIARD',
            details: `Sewa ${table.name} - Selesai (${durationMinutes} menit)`,
            cashierName: state.user?.name || 'Unknown',
            customerName: table.customerName
          };

          // Update total penjualan di shift aktif jika ada
          const updatedShift = state.activeShift 
              ? { ...state.activeShift, totalSales: state.activeShift.totalSales + totalCost } 
              : state.activeShift;

          return {
            ...state,
            activeShift: updatedShift,
            transactions: [newTransaction, ...state.transactions],
            tables: state.tables.map(t => 
              t.id === tableId 
                ? { ...t, status: TableStatus.AVAILABLE, startTime: null, durationMinutes: 0, customerName: undefined }
                : t
            ),
          };
        }

        case 'TOPUP_TABLE': {
          // This legacy action is kept for compatibility but should ideally go through cart -> checkout
          const { tableId, duration } = action.payload;
          return {
            ...state,
            tables: state.tables.map(t =>
              t.id === tableId
                ? { ...t, durationMinutes: t.durationMinutes + duration }
                : t
            )
          };
        }

        case 'MOVE_TABLE': {
          const { fromId, toId } = action.payload;
          const fromTable = state.tables.find(t => t.id === fromId);
          const toTable = state.tables.find(t => t.id === toId);
          
          if (!fromTable || !toTable || toTable.status === TableStatus.OCCUPIED) return state;

          return {
            ...state,
            tables: state.tables.map(t => {
              if (t.id === fromId) return { ...t, status: TableStatus.AVAILABLE, startTime: null, durationMinutes: 0, customerName: undefined };
              if (t.id === toId) return { ...t, status: TableStatus.OCCUPIED, startTime: fromTable.startTime, durationMinutes: fromTable.durationMinutes, customerName: fromTable.customerName };
              return t;
            })
          };
        }

        case 'ADD_PRODUCT_TO_CART': {
          const product = action.payload;
          if (!product || !product.id) return state;

          const existingItem = state.cart.find(item => item.itemId === product.id && item.itemType === 'PRODUCT');
          
          let newCart;
          if (existingItem) {
            newCart = state.cart.map(item => 
              item.itemId === product.id && item.itemType === 'PRODUCT'
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
            newCart = [...state.cart, { 
              itemId: product.id, 
              itemType: 'PRODUCT',
              name: product.name, 
              price: product.price, 
              quantity: 1 
            }];
          }

          return { ...state, cart: newCart };
        }

        case 'ADD_TABLE_TO_CART': {
          const { table, quantity } = action.payload;
          if (!table || !table.id) return state;

          const tableItemId = `table-${table.id}`;
          const existingItem = state.cart.find(item => item.itemId === tableItemId);
          const rate = table.hourlyRate || BILLIARD_HOURLY_RATE;
          const addQty = quantity || 1;

          let newCart;
          if (existingItem) {
            newCart = state.cart.map(item => 
              item.itemId === tableItemId
                ? { ...item, quantity: item.quantity + addQty }
                : item
            );
          } else {
            newCart = [...state.cart, { 
              itemId: tableItemId,
              itemType: 'BILLIARD',
              name: `Sewa ${table.name}`, 
              price: rate, 
              quantity: addQty, 
              tableId: table.id
            }];
          }
          return { ...state, cart: newCart };
        }

        case 'REMOVE_FROM_CART': {
          return { ...state, cart: state.cart.filter(item => item.itemId !== action.payload) };
        }

        case 'CLEAR_CART':
          return { ...state, cart: [] };

        case 'CHECKOUT': {
          const { total, cashierName, customerName } = action.payload;
          const txId = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          const newTransaction: Transaction = {
            id: txId,
            date: new Date().toISOString(),
            timestamp: Date.now(),
            total: total,
            type: 'MIXED',
            details: state.cart.map(item => `${item.name} (x${item.quantity})`).join(', '),
            cashierName: cashierName,
            customerName: customerName || 'Pelanggan Umum'
          };
          
          let updatedProducts = [...state.products];

          state.cart.forEach(cartItem => {
              if (cartItem.itemType === 'PRODUCT') {
                  const product = state.products.find(p => p.id === cartItem.itemId);
                  if (product) {
                      const targetStockId = product.stockLinkedToId || product.id;
                      const targetProductIndex = updatedProducts.findIndex(p => p.id === targetStockId);
                      
                      if (targetProductIndex > -1) {
                          const targetProduct = updatedProducts[targetProductIndex];
                          let deduction = cartItem.quantity;
                          
                          if (targetProduct.category === ProductCategory.RAW_MATERIAL && targetProduct.yield && targetProduct.yield > 0) {
                              deduction = cartItem.quantity / targetProduct.yield;
                          }

                          updatedProducts[targetProductIndex] = {
                              ...updatedProducts[targetProductIndex],
                              stock: Math.max(0, updatedProducts[targetProductIndex].stock - deduction)
                          };
                      }
                  }
              }
          });

          const newTables = state.tables.map(t => {
            const cartItem = state.cart.find(c => c.itemType === 'BILLIARD' && c.tableId === t.id);
            if (cartItem) {
              if (t.status === TableStatus.OCCUPIED) {
                // If table is ALREADY occupied, extends the duration (Top Up logic triggered by payment)
                return {
                  ...t,
                  durationMinutes: t.durationMinutes + (cartItem.quantity * 60)
                };
              } else {
                // If table is AVAILABLE, starts new session
                return {
                  ...t,
                  status: TableStatus.OCCUPIED,
                  startTime: Date.now(),
                  durationMinutes: cartItem.quantity * 60,
                  customerName: customerName || 'Pelanggan Umum'
                };
              }
            }
            return t;
          });

          // Update total penjualan di shift aktif
          const updatedShift = state.activeShift 
              ? { ...state.activeShift, totalSales: state.activeShift.totalSales + total } 
              : state.activeShift;

          return {
            ...state,
            products: updatedProducts,
            tables: newTables,
            transactions: [newTransaction, ...state.transactions],
            activeShift: updatedShift,
            cart: []
          };
        }

        case 'UPDATE_STOCK': {
          return {
            ...state,
            products: state.products.map(p => 
              p.id === action.payload.productId 
                ? { ...p, stock: p.stock + action.payload.quantity }
                : p
            )
          };
        }

        case 'SET_PRODUCT_STOCK': {
          return {
            ...state,
            products: state.products.map(p => 
              p.id === action.payload.productId
                ? { ...p, stock: action.payload.stock }
                : p
            )
          };
        }

        case 'ADD_NEW_PRODUCT':
          return { ...state, products: [...state.products, action.payload] };

        case 'EDIT_PRODUCT':
          return {
            ...state,
            products: state.products.map(p => p.id === action.payload.id ? action.payload : p)
          };

        case 'DELETE_PRODUCT':
          return {
            ...state,
            products: state.products.filter(p => p.id !== action.payload)
          };

        case 'ADD_TABLE':
          return { ...state, tables: [...state.tables, action.payload] };

        case 'EDIT_TABLE':
            return {
              ...state,
              tables: state.tables.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t)
            };

        case 'DELETE_TABLE':
            return {
              ...state,
              tables: state.tables.filter(t => t.id !== action.payload)
            };

        case 'ADD_USER':
          return { ...state, users: [...state.users, action.payload] };

        case 'EDIT_USER': {
            const updatedUsers = state.users.map(u => u.id === action.payload.id ? action.payload : u);
            const updatedSession = state.user?.id === action.payload.id ? action.payload : state.user;
            return { ...state, users: updatedUsers, user: updatedSession };
        }

        case 'REMOVE_USER':
          return { ...state, users: state.users.filter(u => u.id !== action.payload) };

        case 'UPDATE_SETTINGS':
            return { ...state, settings: { ...state.settings, ...action.payload } };

        case 'IMPORT_DATA':
            return { ...action.payload, user: state.user };

        case 'RESET_APP':
          localStorage.removeItem(STORAGE_KEY);
          // Return the factory default state, not a variable from the outer scope
          return factoryDefaultState;

        default:
          return state;
    }
  })();

  if (action.type === 'IMPORT_DATA') {
    return { ...newState, lastUpdated: action.payload.lastUpdated || Date.now() };
  }
  
  // For any other action, update the timestamp to mark a change.
  return { ...newState, lastUpdated: Date.now() };
}

const printer = new ThermalPrinter();

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize reducer with our new robust function
  const [state, dispatch] = useReducer(appReducer, getInitialState());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('IDLE');
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>('disconnected');
  const stateRef = useRef(state);
  const debouncedUploadRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Core State and Storage Effect ---
  useEffect(() => {
    stateRef.current = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // --- Debounced Auto-Upload on State Change ---
    if (state.settings?.googleScriptUrl) {
        if (debouncedUploadRef.current) {
            clearTimeout(debouncedUploadRef.current);
        }
        debouncedUploadRef.current = setTimeout(() => {
            setSyncStatus('SYNCING');
            fetch(state.settings.googleScriptUrl!, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(state)
            })
            .then(response => response.ok ? response.json() : Promise.reject(`HTTP error ${response.status}`))
            .then(data => {
                if (data && data.status === 'success') {
                    setSyncStatus('SUCCESS');
                } else {
                    throw new Error('Invalid server response');
                }
            })
            .catch(e => {
                console.error('Auto-sync (upload) failed:', e);
                setSyncStatus('ERROR');
            });
        }, 1500); // Wait 1.5 seconds after the last change to upload
    }
  }, [state]);

  // --- Real-time Polling for Updates Effect ---
  useEffect(() => {
      const pollForUpdates = async () => {
          const url = stateRef.current.settings?.googleScriptUrl;
          if (!url) return;

          try {
              const response = await fetch(url);
              if (!response.ok) throw new Error(`HTTP error ${response.status}`);
              
              const cloudState: AppState = await response.json();
              
              if (cloudState.lastUpdated && cloudState.lastUpdated > (stateRef.current.lastUpdated || 0)) {
                  console.log("Newer state found on cloud, updating local state.");
                  dispatch({ type: 'IMPORT_DATA', payload: cloudState });
              }
          } catch (error) {
              console.warn('Polling for updates failed:', error);
          }
      };
      
      // Immediately check for updates on app start, then set interval.
      pollForUpdates(); 
      const intervalId = setInterval(pollForUpdates, 10000); // Check every 10 seconds

      return () => clearInterval(intervalId);
  }, []); // Runs only once on mount

  // --- Bluetooth Printer Logic ---
  const connectPrinter = async () => {
    if (!("bluetooth" in navigator)) {
      alert("Browser Anda tidak mendukung Web Bluetooth. Mohon gunakan Chrome di Android/Desktop, atau browser Bluefy di iOS.");
      setPrinterStatus('error');
      return;
    }

    setPrinterStatus('connecting');
    try {
      await printer.connect();
      setPrinterStatus('connected');
      alert("Printer berhasil terhubung!");
    } catch (error: any) {
      console.error("Gagal menghubungkan printer:", error);
      setPrinterStatus('error');
      alert("Gagal menghubungkan printer: " + (error.message || "Unknown error"));
    }
  };

  const printReceipt = async (receiptData: ReceiptData) => {
    if (!printer.isConnected()) {
      alert("Printer belum terhubung. Mohon sambungkan printer terlebih dahulu dari menu Admin > Sistem.");
      setPrinterStatus('disconnected');
      return;
    }
    try {
      await printer.printReceipt(receiptData);
    } catch (error: any) {
      console.error("Gagal mencetak struk:", error);
      alert("Gagal mencetak struk: " + (error.message || "Unknown error"));
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, syncStatus, printerStatus, connectPrinter, printReceipt }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};