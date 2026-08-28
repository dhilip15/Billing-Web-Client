// ─── Enums ───────────────────────────────────────────────────────────────────
export enum BillStatus {
  Draft = 1,
  OnHold = 2,
  Paid = 3,
  Cancelled = 4,
  Returned = 5
}

export enum PaymentMode {
  Cash = 1,
  Card = 2,
  UPI = 3,
  Credit = 4
}

export enum UserRole {
  Admin = 1,
  Manager = 2,
  Cashier = 3
}

export enum TransactionType {
  Purchase = 1,
  Sale = 2,
  Adjustment = 3,
  SaleReturn = 4,
  PurchaseReturn = 5
}

export enum StockAdjustmentReason {
  Damage = 1,
  Return = 2,
  ManualCorrection = 3,
  Opening = 4,
  Theft = 5,
  Expiry = 6
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserDto;
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface CategoryDto {
  id: number;
  name: string;
  description?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
}

export interface UpdateCategoryRequest {
  name: string;
  description?: string;
}

// ─── Supplier ────────────────────────────────────────────────────────────────
export interface SupplierDto {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
}

export interface CreateSupplierRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
}

export interface UpdateSupplierRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
}

// ─── Customer ────────────────────────────────────────────────────────────────
export interface CustomerDto {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditBalance: number;
  gstNumber?: string;
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
}

export interface UpdateCustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
}

// ─── Product ─────────────────────────────────────────────────────────────────
export interface ProductDto {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: number;
  categoryName?: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  taxPercent: number;
  currentStock: number;
  reorderLevel: number;
  supplierId?: number;
  supplierName?: string;
  imageUrl?: string;
  description?: string;
  allowNegativeStock: boolean;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  barcode?: string;
  categoryId: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  taxPercent: number;
  reorderLevel: number;
  supplierId?: number;
  imageUrl?: string;
  description?: string;
  allowNegativeStock: boolean;
}

export interface UpdateProductRequest {
  name: string;
  sku: string;
  barcode?: string;
  categoryId: number;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  taxPercent: number;
  reorderLevel: number;
  supplierId?: number;
  imageUrl?: string;
  description?: string;
  allowNegativeStock: boolean;
}

// ─── Bill ────────────────────────────────────────────────────────────────────
export interface BillItemDto {
  productId: number;
  productName: string;
  sku: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  taxAmount: number;
  discount: number;
  total: number;
}

export interface BillPaymentDto {
  mode: PaymentMode;
  amount: number;
  reference?: string;
}

export interface BillDto {
  id: number;
  invoiceNo: string;
  billDate: string;
  customerId?: number;
  customerName?: string;
  subTotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: BillStatus;
  notes?: string;
  cancellationReason?: string;
  createdBy?: string;
  billItems: BillItemDto[];
  items?: BillItemDto[];
  payments: BillPaymentDto[];
}

export interface BillListDto {
  id: number;
  invoiceNo: string;
  billDate: string;
  customerName?: string;
  totalAmount: number;
  taxAmount?: number;
  paidAmount: number;
  balanceDue: number;
  status: BillStatus;
  itemCount: number;
}

export interface CreateBillItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  discountPercent: number;
  discount?: number;
}

export interface CreateBillPaymentRequest {
  mode: PaymentMode;
  amount: number;
  reference?: string;
}

export interface CreateBillRequest {
  customerId?: number;
  notes?: string;
  items: CreateBillItemRequest[];
  payments: CreateBillPaymentRequest[];
}

// ─── Purchase ────────────────────────────────────────────────────────────────
export interface PurchaseItemDto {
  productId: number;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface PurchaseDto {
  id: number;
  purchaseNo: string;
  purchaseDate: string;
  supplierId?: number;
  supplierName?: string;
  totalAmount: number;
  invoiceReference?: string;
}

export interface CreatePurchaseItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  taxPercent?: number;
}

export interface CreatePurchaseRequest {
  supplierId?: number;
  purchaseDate: string;
  invoiceReference?: string;
  notes?: string;
  items: CreatePurchaseItemRequest[];
}

// ─── Stock Ledger ─────────────────────────────────────────────────────────────
export interface StockLedgerDto {
  id: number;
  transactionType: string | TransactionType; // Allow string from backend
  quantity: number;
  balanceAfter: number;
  referenceId?: number;
  referenceType?: string;
  notes?: string;
  transactionDate: string;
  createdBy?: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardDto {
  todaySales: number;
  todayBillCount: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  recentBills: BillListDto[];
  lowStockProducts: ProductDto[];
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export interface SalesReportRequest {
  from: string;
  to: string;
  groupBy?: string;
}

export interface SalesReportDto {
  from: string;
  to: string;
  totalRevenue: number;
  totalTax: number;
  totalDiscount: number;
  totalBills: number;
  paidBills: number;
  items: SalesReportItemDto[];
}

export interface SalesReportItemDto {
  label: string;
  revenue: number;
  billCount: number;
}

export interface StockReportItemDto {
  productId: number;
  productName: string;
  sku: string;
  categoryName: string;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  sellingPrice: number;
  stockValue: number;
}

// ─── API Wrapper ──────────────────────────────────────────────────────────────
export interface ApiResponse<T = void> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
