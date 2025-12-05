
// utils/printer.ts

import { CartItem, Transaction, ProductCategory } from '../types'; // Jalur impor diperbaiki

export interface ReceiptData {
  transaction: Transaction;
  cart: CartItem[];
  storeName: string;
  storeAddress?: string; // New: Address for receipt
  storePhone?: string;   // New: Phone for receipt
  cashierName: string;
  customReceiptFooter?: string; // New: Custom message for receipt footer (e.g., WiFi password)
  totalBeforeTax?: number; // Optional if you have tax logic
  taxAmount?: number;      // Optional
}

export class ThermalPrinter {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  // Make SERVICE_UUID and CHARACTERISTIC_UUID readonly and initialize them in the constructor.
  private readonly SERVICE_UUID: string;
  private readonly CHARACTERISTIC_UUID: string;

  // ESC/POS Commands
  private readonly ESC = '\x1B';
  private readonly GS = '\x1D';

  // Text formatting
  private readonly TEXT_ALIGN_LEFT = this.ESC + 'a' + '\x00';
  private readonly TEXT_ALIGN_CENTER = this.ESC + 'a' + '\x01';
  private readonly TEXT_ALIGN_RIGHT = this.ESC + 'a' + '\x02';
  private readonly TEXT_NORMAL = this.ESC + '\x21' + '\x00';
  private readonly TEXT_DOUBLE_HEIGHT = this.ESC + '\x21' + '\x10';
  private readonly TEXT_DOUBLE_WIDTH = this.ESC + '\x21' + '\x20';
  private readonly TEXT_DOUBLE_HW = this.ESC + '\x21' + '\x30';
  private readonly BOLD_ON = this.ESC + 'E' + '\x01';
  private readonly BOLD_OFF = this.ESC + 'E' + '\x00';
  private readonly UNDERLINE_ON = this.ESC + '-' + '\x01';
  private readonly UNDERLINE_OFF = this.ESC + '-' + '\x00';
  private readonly CUT_FULL = this.GS + 'V' + '\x00';
  private readonly CUT_PARTIAL = this.GS + 'V' + '\x01';
  private readonly FEED_LINES = (lines: number) => this.ESC + 'd' + String.fromCharCode(lines);

  constructor() {
    // A basic heuristic to try and find common printer characteristic UUIDs
    const commonSerialServiceUUIDs = [
      '000018f0-0000-1000-8000-00805f9b34fb', // Serial Port Service (SPP-like)
      '0000ff00-0000-1000-8000-00805f9b34fb', // Usually used by HM-10/11 modules (custom)
      '49535343-fe7d-4ae5-8fa9-9fbd34fb',     // Specific to some printers like Dymo or custom
      '0000180a-0000-1000-8000-00805f9b34fb', // Device Information Service (not for data, but can be present)
    ];

    this.SERVICE_UUID = commonSerialServiceUUIDs[0];
    this.CHARACTERISTIC_UUID = '00002a01-0000-1000-8000-00805f9b34fb';
  }

  public async connect(): Promise<boolean> {
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.SERVICE_UUID] }],
        optionalServices: [this.SERVICE_UUID], // Make sure it's discoverable
      });

      if (!this.device || !this.device.gatt) {
        throw new Error('No Bluetooth device selected or GATT server not available.');
      }

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(this.SERVICE_UUID);

      // Try to find a characteristic that allows writing (TX)
      const characteristics = await service.getCharacteristics();
      for (const char of characteristics) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          this.characteristic = char;
          break;
        }
      }

      if (!this.characteristic) {
        throw new Error('No writable characteristic found for printer.');
      }

      this.device.addEventListener('gattserverdisconnected', this.onDisconnected);
      console.log('Connected to printer:', this.device.name);
      return true;
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      this.disconnect(); // Ensure clean state
      throw error;
    }
  }

  public async disconnect() {
    if (this.device?.gatt?.connected) {
      await this.device.gatt.disconnect();
    }
    this.device?.removeEventListener('gattserverdisconnected', this.onDisconnected);
    this.device = null;
    this.server = null;
    this.characteristic = null;
    console.log('Disconnected from printer.');
  }

  private onDisconnected = () => {
    console.log('Printer GATT server disconnected.');
    this.device?.removeEventListener('gattserverdisconnected', this.onDisconnected);
    this.device = null;
    this.server = null;
    this.characteristic = null;
  };

  public isConnected(): boolean {
    return !!this.characteristic && !!this.device?.gatt?.connected;
  }

  private async write(data: Uint8Array) {
    if (!this.characteristic) {
      throw new Error('Printer not connected or characteristic not found.');
    }
    await this.characteristic.writeValueWithoutResponse(data);
  }

  private textEncoder = new TextEncoder();

  private sendCommand(command: string) {
    return this.write(this.textEncoder.encode(command));
  }

  private async printLine(text: string = '', centered: boolean = false) {
    await this.sendCommand(centered ? this.TEXT_ALIGN_CENTER : this.TEXT_ALIGN_LEFT);
    await this.write(this.textEncoder.encode(text + '\n'));
  }

  private async printDivider() {
    await this.printLine('-'.repeat(32)); // Adjust for printer width
  }

  public async printReceipt(data: ReceiptData) {
    if (!this.isConnected()) {
      throw new Error('Printer not connected.');
    }

    const { transaction, cart, storeName, storeAddress, storePhone, cashierName, customReceiptFooter } = data;
    const now = new Date(transaction.timestamp);

    try {
      // Initialize printer
      await this.sendCommand(this.ESC + '@'); // Initialize printer
      await this.sendCommand(this.TEXT_NORMAL);
      await this.sendCommand(this.TEXT_ALIGN_CENTER);

      // Header
      await this.sendCommand(this.TEXT_DOUBLE_HW);
      await this.printLine(storeName);
      await this.sendCommand(this.TEXT_NORMAL);
      if (storeAddress) await this.printLine(storeAddress);
      if (storePhone) await this.printLine(storePhone);
      await this.printLine(); // Empty line for spacing

      // Transaction Info
      await this.sendCommand(this.TEXT_ALIGN_LEFT);
      await this.printLine(`Tgl: ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}`);
      await this.printLine(`Kasir: ${cashierName}`);
      await this.printLine(`ID Transaksi: ${transaction.id.slice(-8).toUpperCase()}`);
      if (transaction.customerName && transaction.customerName !== 'Pelanggan Umum') {
        await this.printLine(`Pelanggan: ${transaction.customerName}`);
      }
      await this.printDivider();

      // Cart Items
      // Max width 32 characters
      // Item (14) Qty (4) Harga (6) Subtotal (8)
      await this.printLine(this.BOLD_ON + 'Item          Qty  Harga   Subtotal' + this.BOLD_OFF);
      await this.printDivider();

      for (const item of cart) {
        const itemName = item.name.substring(0, 14).padEnd(14); // Truncate and pad
        const qty = item.quantity.toString().padEnd(4);
        const price = (item.price).toLocaleString('id-ID').padStart(6); // Full price, pad
        const subtotal = (item.price * item.quantity).toLocaleString('id-ID').padStart(8); // Full subtotal, pad
        await this.printLine(`${itemName} ${qty} ${price} ${subtotal}`);
      }
      await this.printDivider();

      // Totals
      await this.sendCommand(this.TEXT_ALIGN_RIGHT);
      await this.sendCommand(this.BOLD_ON);
      await this.printLine(`Total: Rp ${transaction.total.toLocaleString('id-ID')}`);
      await this.sendCommand(this.BOLD_OFF);
      await this.printLine();

      // Footer Message
      await this.sendCommand(this.TEXT_ALIGN_CENTER);
      await this.printLine('Terima kasih atas kunjungan Anda!');
      await this.printLine('Sampai jumpa kembali!');
      if (customReceiptFooter) {
        await this.printLine(customReceiptFooter);
      }
      await this.printLine();

      // Feed and Cut
      await this.sendCommand(this.FEED_LINES(5));
      await this.sendCommand(this.CUT_PARTIAL);

      console.log('Receipt printed successfully.');
    } catch (error) {
      console.error('Failed to print receipt:', error);
      throw error;
    }
  }
}
    