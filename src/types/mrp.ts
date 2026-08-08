export type Role = 'ADMIN' | 'PLANT_MANAGER' | 'SHOP_FLOOR_OPERATOR' | 'PROCUREMENT_OFFICER' | 'AUDITOR_COMPLIANCE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isTwoFactorEnabled: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  department: string;
}

export interface BomItem {
  id: string;
  partNumber: string;
  name: string;
  category: 'FINISHED_GOOD' | 'SUB_ASSEMBLY' | 'RAW_MATERIAL' | 'COMPONENT';
  quantityRequired: number; // per 1 parent unit
  unitOfMeasure: string;
  unitCost: number;
  scrapFactor: number; // e.g. 0.05 = 5% scrap
  currentStock: number;
  reorderPoint: number;
  leadTimeDays: number;
  supplierName?: string;
  children?: BomItem[];
}

export type OrderStatus = 'PLANNED' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface WorkOrder {
  id: string;
  moId: string;
  sequence: number;
  operationName: string; // e.g., "Stamping", "Winding", "Assembly", "Quality Control"
  workCenter: string;
  status: OrderStatus;
  assignedOperator?: string;
  plannedDurationHours: number;
  actualDurationHours?: number;
  materialsRequired: { partNumber: string; name: string; qty: number; uom: string; issued: boolean }[];
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface ManufacturingOrder {
  id: string;
  orderNumber: string;
  productPartNumber: string;
  productName: string;
  targetQuantity: number;
  completedQuantity: number;
  status: OrderStatus;
  startDate: string;
  targetCompletionDate: string;
  actualCompletionDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  workOrders: WorkOrder[];
  totalEstimatedCost: number;
  createdBy: string;
}

export interface InventoryTransaction {
  id: string;
  timestamp: string;
  partNumber: string;
  partName: string;
  type: 'STOCK_IN' | 'CONSUMPTION_WO' | 'PRODUCTION_MO' | 'ADJUSTMENT' | 'PROCUREMENT_RECEIPT';
  quantityChange: number; // + or -
  balanceAfter: number;
  referenceId: string; // MO or WO or PO ID
  unitCost: number;
  performedBy: string;
  txHash: string; // Cryptographic hash for audit tamper-proofing
  location: string; // e.g., "Warehouse A-12", "Shop Floor WIP"
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  partNumber: string;
  partName: string;
  quantityOrdered: number;
  unitPrice: number;
  totalCost: number;
  status: 'REQUESTED' | 'APPROVED' | 'IN_TRANSIT' | 'RECEIVED';
  orderDate: string;
  estimatedDeliveryDate: string;
  createdReason: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userRole: Role;
  actionType: 'CREATE_MO' | 'UPDATE_WO_STATUS' | 'STOCK_ADJUSTMENT' | 'RBAC_CHANGE' | 'LOGIN_OTP' | '2FA_VERIFY' | 'E2E_KEY_ROTATE' | 'CLOUD_SYNC' | 'RATE_LIMIT_BLOCKED';
  resourceTarget: string;
  detailsEncrypted: string; // E2E Encrypted payload simulation
  detailsDecryptedForAdmin?: string;
  ipAddress: string;
  complianceFlag: 'NORMAL' | 'SENSITIVE' | 'SECURITY_ALERT';
}

export interface RateLimitStatus {
  totalRequests: number;
  blockedRequests: number;
  currentRps: number;
  tokensAvailable: number;
  maxBucketCapacity: number;
  activeIpCount: number;
}

export interface ServiceMetric {
  serviceName: string;
  status: 'HEALTHY' | 'DEGRADED' | 'SURGE';
  latencyMs: number;
  instancesCount: number;
  cpuUtilizationPct: number;
  memoryMb: number;
  throughputRps: number;
}

export interface CloudStorageConfig {
  provider: 'AWS_S3' | 'GOOGLE_CLOUD_STORAGE' | 'DROPBOX';
  bucketName: string;
  region: string;
  autoSyncIntervalMinutes: number;
  isEncryptedInTransit: boolean;
  lastSyncTimestamp?: string;
  syncStatus: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
}
