
import React, { createContext, useContext, useReducer, ReactNode, useEffect, useState, useRef } from 'react';
import { AppAction, AppState, TableStatus, Transaction, ProductCategory, CashierShift, CartItem } from '../types';
import { INITIAL_PRODUCTS as MOCK_PRODUCTS, INITIAL_TABLES as MOCK_TABLES, INITIAL_USERS as MOCK_USERS, BILLIARD_HOURLY_RATE } from '../constants';
import { ThermalPrinter, ReceiptData } from '../utils/printer'; // Import ThermalPrinter

const initialState: AppState = {
  user: null,
  activeShift: null, // Default null (Tutup)
  tables: MOCK_TABLES,
  products: MOCK_PRODUCTS,
  cart: [],
  transactions: [],
  users: MOCK_USERS,
  settings: {
    googleScriptUrl: 'https://script.google.com/macros/s/AKfycbzcv_DIzZLa8iNN1a4dwaZSK9XzKi_LAClLLyQOlGt0505OSPOcQJK_rQBpp7_7mfuXOQ/exec', 
    storeName: 'ZYRA KASIR',
    storeAddress: 'Jl. Contoh No. 123, Kota Fiktif', // Default address
    storePhone: '0812-3456-7890', // Default phone
    customReceiptFooter: 'Terima Kasih!' // Default custom footer
  },
  lastUpdated: Date.now()
};

const STORAGE_KEY = 'ZYRA_KASIR_POS_DATA_V1';

export type SyncStatus = 'IDLE' | 'PENDING' | 'SYNCING' | 'SUCCESS' | 'ERROR';
export type PrinterStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  syncStatus: SyncStatus;
  printerStatus: PrinterStatus; // Tambah status printer
  connectPrinter: () => Promise<void>; // Tambah fungsi connect printer
  printReceipt: (receiptData: ReceiptData) => Promise<void>; // Tambah fungsi print receipt
} | undefined>(undefined);

const loadState = (defaultState: AppState): AppState => {
  if (typeof window === 'undefined') return defaultState;
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState) {
      const parsed = JSON.parse(serializedState);
      if (parsed.tables && parsed.products && parsed.users) {
        const migratedTables = parsed.tables.map((t: any) => ({
             ...t,
             hourlyRate: t.hourlyRate || BILLIARD_HOURLY_RATE
        }));
        const defaultSettings = defaultState.settings;
        const migratedSettings = {
            ...defaultSettings,
            ...(parsed.settings || {}),
            googleScriptUrl: parsed.settings?.googleScriptUrl || defaultSettings.googleScriptUrl,
            storeAddress: parsed.settings?.storeAddress || defaultSettings.storeAddress, // Migrate new setting
            storePhone: parsed.settings?.storePhone || defaultSettings.storePhone,       // Migrate new setting
            customReceiptFooter: parsed.settings?.customReceiptFooter || defaultSettings.customReceiptFooter // Migrate new setting
        };
        
        return { 
            ...parsed, 
            tables: migratedTables, 
            settings: migratedSettings,
            activeShift: parsed.activeShift || null,
            lastUpdated: parsed.lastUpdated || Date.now()
        };
      }
    }
  } catch (e) {
    console.error("Error loading state from storage:", e);
  }
  return defaultState;
};

function appReducer(state: AppState, action: AppAction): AppState {
  const newState = ((): Omit<AppState, 'lastUpdated'> => {
      switch (action.type) {
        case 'LOGIN':
          return { ...state, user: action.payload };
        case 'LOGOUT':
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
            return { ...state, activeShift: null };
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
          const table = action.payload;
          if (!table || !table.id) return state;

          const tableItemId = `table-${table.id}`;
          const existingItem = state.cart.find(item => item.itemId === tableItemId);
          const rate = table.hourlyRate || BILLIARD_HOURLY_RATE;

          let newCart;
          if (existingItem) {
            newCart = state.cart.map(item => 
              item.itemId === tableItemId
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
            newCart = [...state.cart, { 
              itemId: tableItemId,
              itemType: 'BILLIARD',
              name: `Sewa ${table.name}`, 
              price: rate, 
              quantity: 1, 
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
                return {
                  ...t,
                  durationMinutes: t.durationMinutes + (cartItem.quantity * 60)
                };
              } else {
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
            // Don't update timestamp on import, use the one from payload
            return { ...action.payload, user: state.user };

        case 'RESET_APP':
          localStorage.removeItem(STORAGE_KEY);
          // Don't add timestamp here, it will be added by wrapper
          return initialState;

        default:
          return state;
    }
  })();

  if (action.type === 'IMPORT_DATA') {
    return { ...newState, lastUpdated: action.payload.lastUpdated || Date.now() };
  }
  
  return { ...newState, lastUpdated: Date.now() };
}

const printer = new ThermalPrinter();

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, loadState);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('IDLE');
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>('disconnected');
  const stateRef = useRef(state);
  // FIX: Initialize useRef with null to ensure its type is correctly handled.
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
              
              // CRUCIAL: Only update if cloud data is newer than local data
              if (cloudState.lastUpdated && cloudState.lastUpdated > (stateRef.current.lastUpdated || 0)) {
                  console.log("Newer state found on cloud, updating local state.");
                  dispatch({ type: 'IMPORT_DATA', payload: cloudState });
              }
          } catch (error) {
              console.warn('Polling for updates failed:', error);
              // Don't set status to ERROR on polling failure to avoid constant red icon
          }
      };

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