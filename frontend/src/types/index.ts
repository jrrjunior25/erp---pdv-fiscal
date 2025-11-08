// === PDV & ERP Shared Types ===

export interface Product {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  price: number;
  cost?: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  category?: string;
  supplierId?: string;
  location?: string;
  imageUrl?: string;
  ncm?: string;
  cfop?: string;
  cstIcms?: string;
  active: boolean;
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    cpf: string;
    loyaltyPoints: number;
    createdAt: string;
    creditLimit: number;
    currentBalance: number;
}

export interface Supplier {
    id:string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    cnpj: string;
}


export interface CartItem extends Product {
  quantity: number;
  discount?: {
    amount: number;
    type: 'fixed' | 'percentage';
  };
}

export type PaymentMethod = 'Dinheiro' | 'PIX' | 'Credito' | 'Debito' | 'Fiado';

export interface Payment {
    method: PaymentMethod;
    amount: number;
}


export interface SaleRecord {
  id: string;
  timestamp: string;
  items: CartItem[];
  total: number;
  payments: Payment[];
  changeGiven: number;
  nfceXml: string;
  customerId?: string;
  customerName?: string;
  totalDiscount: number;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  loyaltyDiscountAmount: number;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'USER';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    active: boolean;
    status: 'Active' | 'Inactive';
}

export interface AccountTransaction {
    id: string;
    description: string;
    amount: number;
    dueDate: string;
    status: 'Pendente' | 'Pago' | 'Atrasado';
    type: 'payable' | 'receivable';
    customerId?: string;
}

export type Permission = 
  | 'view_dashboard'
  | 'manage_products'
  | 'manage_customers'
  | 'manage_suppliers'
  | 'view_reports'
  | 'manage_inventory'
  | 'manage_financials'
  | 'manage_users'
  | 'manage_purchasing';


// === Fiscal Types (NFC-e) ===

// Fix: Add missing NcmCode and CfopCode type definitions.
export interface NcmCode {
  code: string;
  description: string;
}

export interface CfopCode {
  code: string;
  description: string;
}

export interface Emitente {
  CNPJ: string;
  xNome: string;
  xFant: string;
  enderEmit: {
    xLgr: string;
    nro: string;
    xBairro: string;
    cMun: string;
    xMun: string;
    UF: string;
    CEP: string;
    cPais: string;
    xPais: string;
  };
  IE: string;
  CRT: string; // Código de Regime Tributário
}

export interface Destinatario {
  CPF?: string;
  xNome?: string;
}

export interface ProdutoNFCe {
  cProd: string;
  cEAN: string;
  xProd: string;
  NCM: string;
  CFOP: string;
  uCom: string;
  qCom: number;
  vUnCom: number;
  vProd: number;
  vDesc?: number;
  cEANTrib: string;
  uTrib: string;
  qTrib: number;
  vUnTrib: number;
  indTot: number;
  imposto: {
    vTotTrib: number;
    ICMS: {
      ICMSSN102: {
        orig: string;
        CSOSN: string;
      };
    };
    PIS: {
      PISSN: {
        CST: string;
      };
    };
    COFINS: {
      COFINSSN: {
        CST: string;
      };
    };
  };
}

export interface TotalNFCe {
  vBC: number;
  vICMS: number;
  vICMSDeson: number;
  vFCP: number;
  vBCST: number;
  vST: number;
  vFCPST: number;
  vFCPSTRet: number;
  vProd: number;
  vFrete: number;
  vSeg: number;
  vDesc: number;
  vII: number;
  vIPI: number;
  vIPIDevol: number;
  vPIS: number;
  vCOFINS: number;
  vOutro: number;
  vNF: number;
  vTotTrib: number;
}

export interface PagamentoNFCe {
  tpag: string; // Forma de pagamento
  vPag: number; // Valor do pagamento
}

export interface NFCe {
  infNFe: {
    versao: string;
    ide: {
      cUF: string;
      cNF: string;
      natOp: string;
      mod: number;
      serie: number;
      nNF: number;
      dhEmi: string;
      tpNF: number;
      idDest: number;
      cMunFG: string;
      tpImp: number;
      tpEmis: number;
      cDV: number;
      tpAmb: number;
      finNFe: number;
      indFinal: number;
      indPres: number;
      procEmi: number;
      verProc: string;
    };
    emit: Emitente;
    dest?: Destinatario;
    det: ProdutoNFCe[];
    total: {
      ICMSTot: TotalNFCe;
    };
    pag: {
      detPag: PagamentoNFCe[];
    };
  };
}

// === PIX Types ===
export interface PixCharge {
  transactionId: string;
  qrCodeData: string; // The "copia e cola" string
  amount: number;
  createdAt: Date;
}

export interface PixWebhookPayload {
  transactionId: string;
  status: 'PAID';
  paidAt: Date;
  amount: number;
}

// === Offline Sync Types ===
export interface QueuedSale {
  id: string;
  timestamp: string;
  saleData: SaleRecord;
}

// === Homologation Types ===
export interface HomologationItem {
    id: string;
    text: string;
    completed: boolean;
}

// === Inventory Types ===
export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  minStock: number;
  category: string;
  lastMovement: Date;
  status: 'ok' | 'low' | 'out' | 'overstock';
  value: number;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  userId: string;
  location?: string;
  createdAt: Date;
}

export interface InventoryCountItem {
  productId: string;
  counted: number;
  location?: string;
}

export interface InventoryReport {
  totalProducts: number;
  totalValue: number;
  lowStockItems: number;
  outOfStockItems: number;
  topMovements: StockMovement[];
  alerts: InventoryAlert[];
}

export interface InventoryAlert {
  id: string;
  productId: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  message: string;
  currentStock: number;
  threshold: number;
  resolved: boolean;
  createdAt: Date;
}

export interface StockValuation {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
}

export interface InventoryAnalytics {
  period: string;
  totalValue: number;
  totalMovements: number;
  entriesCount: number;
  exitsCount: number;
  adjustmentsCount: number;
  lowStockCount: number;
  categories: Record<string, number>;
}

// === NF-e Import Types ===
export interface NFeImportResult {
  summary: {
    invoiceNumber: string;
    supplierFound: boolean;
    supplierCreated: boolean;
    productsProcessed: number;
    newProductsCreated: number;
    stockEntries: number;
  };
  details: {
    supplierName: string;
    products: {
      code: string;
      name: string;
      quantity: number;
      isNew: boolean;
    }[];
  };
}

// === Cash Shift Types ===
export interface ShiftMovement {
    id: string;
    timestamp: string;
    type: 'Suprimento' | 'Sangria';
    amount: number;
    reason: string;
    userId: string; // User who performed the action
}

export interface CashShift {
    id: string;
    status: 'Aberto' | 'Fechado';
    userId: string;
    userName: string;
    openedAt: string;
    closedAt: string | null;

    // Balances
    openingBalance: number; // Suprimento inicial
    closingBalance: number | null; // Valor contado no fechamento
    expectedBalance: number | null; // Calculado no fechamento
    balanceDifference: number | null; // Quebra/Sobra

    // Aggregates
    totalSales: number;
    totalSuprimentos: number;
    totalSangrias: number;
    
    // Details
    paymentTotals: Record<PaymentMethod, number>;
    movements: ShiftMovement[];
    sales: SaleRecord[];
}

// === Purchasing Types ===
export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  cost: number; // cost per unit
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalCost: number;
  status: 'Pendente' | 'Recebido' | 'Cancelado';
  createdAt: string;
  receivedAt?: string;
}