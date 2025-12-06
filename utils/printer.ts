
// utils/printer.ts

import { CartItem, Transaction } from '../types';
import { STORE_LOGO_BASE64 } from '../constants';

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
  private readonly SERVICE_UUID: string = '000018f0-0000-1000-8000-00805f9b34fb';
  private readonly textEncoder = new TextEncoder();

  // ESC/POS Commands
  private readonly ESC = '\x1B';
  private readonly GS = '\x1D';
  
  private readonly CMD_INIT = this.ESC + '@';
  private readonly TEXT_ALIGN_LEFT = this.ESC + 'a' + '\x00';
  private readonly TEXT_ALIGN_CENTER = this.ESC + 'a' + '\x01';
  private readonly TEXT_ALIGN_RIGHT = this.ESC + 'a' + '\x02';
  private readonly TEXT_NORMAL = this.ESC + '\x21' + '\x00';
  private readonly TEXT_DOUBLE_HW = this.ESC + '\x21' + '\x30';
  private readonly BOLD_ON = this.ESC + 'E' + '\x01';
  private readonly BOLD_OFF = this.ESC + 'E' + '\x00';
  private readonly CUT_PARTIAL = this.GS + 'V' + '\x01';
  private readonly FEED_LINES = (lines: number) => this.ESC + 'd' + String.fromCharCode(lines);

  public async connect(): Promise<boolean> {
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.SERVICE_UUID] }],
        optionalServices: [this.SERVICE_UUID],
      });

      if (!this.device || !this.device.gatt) throw new Error('GATT server not available.');
      
      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(this.SERVICE_UUID);
      const characteristics = await service.getCharacteristics();

      this.characteristic = characteristics.find(c => c.properties.write || c.properties.writeWithoutResponse) || null;

      if (!this.characteristic) throw new Error('No writable characteristic found.');

      this.device.addEventListener('gattserverdisconnected', this.onDisconnected);
      console.log('Connected to printer:', this.device.name);
      return true;
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      this.disconnect();
      throw error;
    }
  }

  public async disconnect() {
    this.device?.gatt?.disconnect();
    this.device?.removeEventListener('gattserverdisconnected', this.onDisconnected);
    this.device = null;
    this.server = null;
    this.characteristic = null;
    console.log('Disconnected from printer.');
  }

  private onDisconnected = () => {
    console.log('Printer GATT server disconnected.');
    this.disconnect();
  };

  public isConnected(): boolean {
    return !!this.characteristic && !!this.device?.gatt?.connected;
  }

  private async write(data: Uint8Array) {
    if (!this.characteristic) throw new Error('Printer not connected.');
    // Split data into chunks to avoid exceeding BLE MTU size limits
    const chunkSize = 100; 
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await this.characteristic.writeValueWithoutResponse(chunk);
    }
  }
  
  private sendCommand(command: string) {
    return this.write(this.textEncoder.encode(command));
  }

  private async printLine(text: string = '', centered: boolean = false) {
    await this.sendCommand(centered ? this.TEXT_ALIGN_CENTER : this.TEXT_ALIGN_LEFT);
    await this.write(this.textEncoder.encode(text + '\n'));
  }

  private async printDivider() {
    await this.printLine('-'.repeat(32));
  }

  /**
   * Converts a base64 image to ESC/POS raster format and prints it.
   * @param base64Image The base64 encoded image string (e.g., from constants).
   * @param maxWidth The maximum width of the printer in dots (usually 384 for 58mm paper).
   */
  public async printImage(base64Image: string, maxWidth: number = 384): Promise<void> {
    if (!base64Image) return;

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = async () => {
            try {
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d', { willReadFrequently: true });
                if (!context) return reject('Could not get canvas context');

                // Scale image to fit printer width
                const aspectRatio = img.width / img.height;
                const width = maxWidth;
                const height = Math.round(width / aspectRatio);
                canvas.width = width;
                canvas.height = height;
                context.drawImage(img, 0, 0, width, height);

                const imageData = context.getImageData(0, 0, width, height);
                const data = imageData.data;
                const dots = new Uint8Array(width * height);

                // Convert to monochrome (black/white)
                for (let i = 0; i < data.length; i += 4) {
                    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    dots[i / 4] = luminance < 128 ? 1 : 0; // 1 for black, 0 for white
                }

                // Pack monochrome data into bytes for the printer
                const bytes = new Uint8Array(width * Math.ceil(height / 8));
                let byteIndex = 0;
                for (let x = 0; x < width; x++) {
                    for (let y = 0; y < height; y += 8) {
                        let slice = 0;
                        for (let bit = 0; bit < 8; bit++) {
                            slice <<= 1;
                            if (y + bit < height && dots[(y + bit) * width + x] === 1) {
                                slice |= 1;
                            }
                        }
                        bytes[byteIndex++] = slice;
                    }
                }
                
                // Send raster image command
                await this.sendCommand(this.TEXT_ALIGN_CENTER);
                const commandHeader = new Uint8Array([0x1D, 0x76, 0x30, 0x00, width % 256, Math.floor(width / 256), Math.ceil(height/8) % 256, Math.floor(Math.ceil(height/8) / 256)]);
                const fullCommand = new Uint8Array([...commandHeader, ...bytes]);
                await this.write(fullCommand);
                resolve();

            } catch (e) {
                reject(e);
            }
        };
        img.onerror = (e) => reject(`Failed to load image: ${e}`);
        img.src = base64Image;
    });
  }

  public async printReceipt(data: ReceiptData) {
    if (!this.isConnected()) throw new Error('Printer not connected.');
    
    const { transaction, cart, storeName, storeAddress, storePhone, cashierName, customReceiptFooter } = data;
    const now = new Date(transaction.timestamp);

    try {
      await this.sendCommand(this.CMD_INIT);
      
      // Print Logo
      if (STORE_LOGO_BASE64) {
        await this.printImage(STORE_LOGO_BASE64);
        await this.sendCommand(this.FEED_LINES(1));
      }

      // Header
      await this.sendCommand(this.TEXT_ALIGN_CENTER);
      await this.sendCommand(this.TEXT_DOUBLE_HW);
      await this.printLine(storeName);
      await this.sendCommand(this.TEXT_NORMAL);
      if (storeAddress) await this.printLine(storeAddress);
      if (storePhone) await this.printLine(storePhone);
      await this.printLine();

      // Transaction Info
      await this.sendCommand(this.TEXT_ALIGN_LEFT);
      await this.printLine(`Tgl: ${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID')}`);
      await this.printLine(`Kasir: ${cashierName}`);
      await this.printLine(`ID Transaksi: ${transaction.id.slice(-8).toUpperCase()}`);
      if (transaction.customerName && transaction.customerName !== 'Pelanggan Umum') {
        await this.printLine(`Pelanggan: ${transaction.customerName}`);
      }
      await this.printDivider();
      
      // Cart Items Header
      await this.printLine(this.BOLD_ON + 'Item          Qty  Harga   Subtotal' + this.BOLD_OFF);
      await this.printDivider();
      
      // Cart Items
      for (const item of cart) {
        const itemName = item.name.substring(0, 14).padEnd(14);
        const qty = item.quantity.toString().padEnd(4);
        const price = item.price.toLocaleString('id-ID').padStart(6);
        const subtotal = (item.price * item.quantity).toLocaleString('id-ID').padStart(8);
        await this.printLine(`${itemName} ${qty} ${price} ${subtotal}`);
      }
      await this.printDivider();

      // Totals
      await this.sendCommand(this.TEXT_ALIGN_RIGHT);
      await this.sendCommand(this.BOLD_ON);
      await this.printLine(`Total: Rp ${transaction.total.toLocaleString('id-ID')}`);
      await this.sendCommand(this.BOLD_OFF);
      await this.printLine();

      // Footer
      await this.sendCommand(this.TEXT_ALIGN_CENTER);
      await this.printLine('Terima kasih atas kunjungan Anda!');
      if (customReceiptFooter) await this.printLine(customReceiptFooter);
      
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