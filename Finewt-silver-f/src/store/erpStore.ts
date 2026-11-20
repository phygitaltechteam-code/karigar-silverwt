/**
 * Gold Chain Manufacturing ERP - Local Store & Pre-populated Mock Data
 * Complete state management with localStorage persistence and full CRUD operations.
 */

export interface ItemMasterItem {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Inactive';
}

export interface SizeMasterItem {
  id: string;
  size: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface PurityMasterItem {
  id: string;
  name: string;
  purityPercent: number; // e.g. 91.6
  status: 'Active' | 'Inactive';
}

export interface BoxMasterItem {
  id: string;
  boxNumber: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface WorkerMasterItem {
  id: string;
  name: string;
  department: 'Box' | 'Soldering' | 'Joint' | 'Cutting';
  phone: string;
  status: 'Active' | 'Inactive';
}

export interface CustomerMasterItem {
  id: string;
  name: string;
  gst: string;
  mobile: string;
  address: string;
  openingBalance: number;
  status: 'Active' | 'Inactive';
}

export interface RateMasterItem {
  id: string;
  date: string;
  rate22k: number; // ₹ per gram
  rate24k: number; // ₹ per gram
  makingCharge: number; // ₹ per gram
  gstPercent: number; // e.g. 3%
}

export interface WastageMasterItem {
  id: string;
  department: 'Box' | 'Soldering' | 'Joint' | 'Cutting';
  allowedPercent: number;
}

export interface UserMasterItem {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role:
  | 'Admin'
  | 'Manager'
  | 'Stock Operator'
  | 'Box Operator'
  | 'Soldering Operator'
  | 'Joint Operator'
  | 'Cutting Operator'
  | 'Billing Operator';
  status: 'Active' | 'Inactive';
}

export type PipelineStage =
  | 'RAW_STOCK'
  | 'BOX'
  | 'SOLDERING'
  | 'JOINT'
  | 'CUTTING'
  | 'FINISHED_STOCK'
  | 'BILLED';

export interface LotBatchTransaction {
  id: string;
  lotNo: string;
  date: string;
  item: string;
  size: string;
  purity: string;
  stage: PipelineStage;
  stockWeight: number; // input weight g (3 decimals)
  currentWeight: number; // remaining/output weight g (3 decimals)
  lossWeight: number; // accumulated loss g (3 decimals)

  // Department specific fields
  boxNumber?: string;
  solderUsed?: number; // g
  piecesCount?: number;
  location?: string; // Vault/Tray info
  assignedWorker?: string;
  remarks?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Rejected';
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceNo: string;
  date: string;
  customerName: string;
  customerGst: string;
  item: string;
  size: string;
  purity: string;
  grossWeight: number; // g
  ratePerGram: number; // ₹
  makingChargePerGram: number; // ₹
  goldAmount: number; // ₹
  makingChargeAmount: number; // ₹
  taxableAmount: number; // ₹
  gstPercent: number; // %
  gstAmount: number; // ₹
  totalAmount: number; // ₹
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  lotNo?: string;
}

export interface AuditLogItem {
  id: string;
  timeStamp: string;
  user: string;
  action: string;
  details: string;
}

// Key for LocalStorage
const STORAGE_KEY = 'GOLD_CHAIN_ERP_DATA_V1';

// Initial Default Static Records
const defaultItems: ItemMasterItem[] = [];

const defaultSizes: SizeMasterItem[] = [];

const defaultPurities: PurityMasterItem[] = [];

const defaultBoxes: BoxMasterItem[] = [];

const defaultWorkers: WorkerMasterItem[] = [];

const defaultCustomers: CustomerMasterItem[] = [];

const defaultRates: RateMasterItem[] = [];

const defaultWastages: WastageMasterItem[] = [];

const defaultUsers: UserMasterItem[] = [];

// Pre-populated Manufacturing Pipeline Batches
const defaultBatches: LotBatchTransaction[] = [];

const defaultInvoices: InvoiceItem[] = [];

const defaultLogs: AuditLogItem[] = [];

export interface ERPStoreData {
  items: ItemMasterItem[];
  sizes: SizeMasterItem[];
  purities: PurityMasterItem[];
  boxes: BoxMasterItem[];
  workers: WorkerMasterItem[];
  customers: CustomerMasterItem[];
  rates: RateMasterItem[];
  wastages: WastageMasterItem[];
  users: UserMasterItem[];
  batches: LotBatchTransaction[];
  invoices: InvoiceItem[];
  auditLogs: AuditLogItem[];
}

export class ERPStore {
  private data: ERPStoreData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): ERPStoreData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse stored ERP data', e);
    }

    return {
      items: defaultItems,
      sizes: defaultSizes,
      purities: defaultPurities,
      boxes: defaultBoxes,
      workers: defaultWorkers,
      customers: defaultCustomers,
      rates: defaultRates,
      wastages: defaultWastages,
      users: defaultUsers,
      batches: defaultBatches,
      invoices: defaultInvoices,
      auditLogs: defaultLogs,
    };
  }

  private saveData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save ERP data to localStorage', e);
    }
  }

  public getData(): ERPStoreData {
    return this.data;
  }

  public resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.loadData();
  }

  // AUDIT LOG
  public addAuditLog(user: string, action: string, details: string) {
    const newLog: AuditLogItem = {
      id: Date.now().toString(),
      timeStamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      user,
      action,
      details,
    };
    this.data.auditLogs.unshift(newLog);
    this.saveData();
  }

  // MASTERS CRUD
  public addItem(item: Omit<ItemMasterItem, 'id'>) {
  const newItem: ItemMasterItem = { ...item, id: Date.now().toString() };
  this.data.items.push(newItem);
  this.addAuditLog(
    'admin',
    'ADD_ITEM',
    `Added item ${item.name} (${item.code})`,
  );
  this.saveData();
  return newItem;
}

  public updateItem(id: string, updates: Partial<ItemMasterItem>) {
  this.data.items = this.data.items.map((it) =>
    it.id === id ? { ...it, ...updates } : it,
  );
  this.saveData();
}

  public deleteItem(id: string) {
  this.data.items = this.data.items.filter((it) => it.id !== id);
  this.saveData();
}

  public addSize(size: Omit<SizeMasterItem, 'id'>) {
  const newSize: SizeMasterItem = { ...size, id: Date.now().toString() };
  this.data.sizes.push(newSize);
  this.addAuditLog('admin', 'ADD_SIZE', `Added size ${size.size}`);
  this.saveData();
  return newSize;
}

  public updateSize(id: string, updates: Partial<SizeMasterItem>) {
  this.data.sizes = this.data.sizes.map((s) =>
    s.id === id ? { ...s, ...updates } : s,
  );
  this.saveData();
}

  public deleteSize(id: string) {
  this.data.sizes = this.data.sizes.filter((s) => s.id !== id);
  this.saveData();
}

  public addWorker(worker: Omit<WorkerMasterItem, 'id'>) {
  const newWorker: WorkerMasterItem = { ...worker, id: Date.now().toString() };
  this.data.workers.push(newWorker);
  this.addAuditLog(
    'admin',
    'ADD_WORKER',
    `Added worker ${worker.name} (${worker.department})`,
  );
  this.saveData();
  return newWorker;
}

  public updateWorker(id: string, updates: Partial<WorkerMasterItem>) {
  this.data.workers = this.data.workers.map((w) =>
    w.id === id ? { ...w, ...updates } : w,
  );
  this.saveData();
}

  public deleteWorker(id: string) {
  this.data.workers = this.data.workers.filter((w) => w.id !== id);
  this.saveData();
}

  public addCustomer(customer: Omit<CustomerMasterItem, 'id'>) {
  const newCust: CustomerMasterItem = {
    ...customer,
    id: Date.now().toString(),
  };
  this.data.customers.push(newCust);
  this.addAuditLog(
    'admin',
    'ADD_CUSTOMER',
    `Added customer ${customer.name}`,
  );
  this.saveData();
  return newCust;
}

  public updateCustomer(id: string, updates: Partial<CustomerMasterItem>) {
  this.data.customers = this.data.customers.map((c) =>
    c.id === id ? { ...c, ...updates } : c,
  );
  this.saveData();
}

  public deleteCustomer(id: string) {
  this.data.customers = this.data.customers.filter((c) => c.id !== id);
  this.saveData();
}

  public updateRates(rates: Omit<RateMasterItem, 'id'>) {
  const newRate: RateMasterItem = { ...rates, id: Date.now().toString() };
  this.data.rates.unshift(newRate);
  this.addAuditLog(
    'admin',
    'UPDATE_RATES',
    `Updated 22K Rate: ₹${rates.rate22k}/g, 24K: ₹${rates.rate24k}/g`,
  );
  this.saveData();
  return newRate;
}

  // LOT BATCH TRANSACTIONS
  public generateLotNumber(): string {
  const dateStr = new Date().toISOString().substring(0, 10).replace(/-/g, '');
  const count = this.data.batches.length + 1;
  const seq = count.toString().padStart(3, '0');
  return `LOT-${dateStr}-${seq}`;
}

  public addGoldStock(
  batchData: Omit<
    LotBatchTransaction,
    'id' | 'lotNo' | 'stage' | 'status' | 'updatedAt'
  >,
) {
  const lotNo = this.generateLotNumber();
  const newBatch: LotBatchTransaction = {
    ...batchData,
    id: Date.now().toString(),
    lotNo,
    stage: 'RAW_STOCK',
    currentWeight: batchData.stockWeight,
    lossWeight: 0.0,
    status: 'Completed',
    updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  };
  this.data.batches.unshift(newBatch);
  this.addAuditLog(
    'admin',
    'GOLD_STOCK_INTAKE',
    `Added stock ${lotNo} - ${batchData.stockWeight.toFixed(3)}g`,
  );
  this.saveData();
  return newBatch;
}

  public updateBatchStage(
  batchId: string,
  nextStage: PipelineStage,
  updates: Partial<LotBatchTransaction>,
) {
  this.data.batches = this.data.batches.map((b) => {
    if (b.id === batchId) {
      return {
        ...b,
        ...updates,
        stage: nextStage,
        updatedAt: new Date()
          .toISOString()
          .replace('T', ' ')
          .substring(0, 19),
      };
    }
    return b;
  });
  this.addAuditLog(
    'operator',
    'STAGE_TRANSITION',
    `Updated Batch ID ${batchId} to ${nextStage}`,
  );
  this.saveData();
}

  // INVOICING
  public addInvoice(inv: Omit<InvoiceItem, 'id' | 'invoiceNo'>) {
  const seq = (this.data.invoices.length + 1).toString().padStart(3, '0');
  const invoiceNo = `INV-2026-${seq}`;
  const newInv: InvoiceItem = {
    ...inv,
    id: Date.now().toString(),
    invoiceNo,
  };
  this.data.invoices.unshift(newInv);
  this.addAuditLog(
    'billing_op',
    'CREATE_INVOICE',
    `Created Invoice ${invoiceNo} for ${inv.customerName} (₹${inv.totalAmount.toFixed(2)})`,
  );
  this.saveData();
  return newInv;
}
}

// Singleton Export
export const erpStore = new ERPStore();
