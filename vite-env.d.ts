interface BluetoothDevice extends EventTarget {
  id: string;
  name: string | undefined;
  gatt: BluetoothRemoteGATTServer | undefined;
  ongattserverdisconnected: ((this: BluetoothDevice, ev: Event) => any) | null;
  addEventListener(type: "gattserverdisconnected", listener: (this: BluetoothDevice, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: "gattserverdisconnected", listener: (this: BluetoothDevice, ev: Event) => any, options?: boolean | EventListenerOptions): void;
}

interface BluetoothCharacteristicProperties {
  broadcast: boolean;
  read: boolean;
  writeWithoutResponse: boolean;
  write: boolean;
  notify: boolean;
  indicate: boolean;
  authenticatedSignedWrites: boolean;
  reliableWrite: boolean;
  writableAuxiliaries: boolean;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  service: BluetoothRemoteGATTService;
  uuid: string;
  properties: BluetoothCharacteristicProperties;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse(value: BufferSource): Promise<void>;
  writeValueWithoutResponse(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  oncharacteristicvaluechanged: ((this: BluetoothRemoteGATTCharacteristic, ev: Event) => any) | null;
  addEventListener(type: "characteristicvaluechanged", listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => any, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: "characteristicvaluechanged", listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => any, options?: boolean | EventListenerOptions): void;
}

interface BluetoothRemoteGATTService {
  device: BluetoothDevice;
  uuid: string;
  isPrimary: boolean;
  getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>;
  getIncludedService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  getIncludedServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>;
}

interface BluetoothNavigator extends EventTarget {
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
  getDevices(): Promise<BluetoothDevice[]>;
  onavailabilitychanged: ((this: BluetoothNavigator, ev: Event) => any) | null;
}

interface Navigator {
  bluetooth: BluetoothNavigator;
}

type BluetoothServiceUUID = number | string;
type BluetoothCharacteristicUUID = number | string;
type RequestDeviceOptions = {
  filters?: (BluetoothDataFilter | BluetoothServiceFilter)[];
  optionalServices?: BluetoothServiceUUID[];
};

interface BluetoothServiceFilter {
  services: BluetoothServiceUUID[];
}

interface BluetoothDataFilter {
  name?: string;
  namePrefix?: string;
}
