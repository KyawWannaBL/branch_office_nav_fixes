export const ROUTE_PATHS = {
  DASHBOARD: '/',
  SUPERVISOR: '/supervisor',
  DRIVER: '/driver',
  WAREHOUSE: '/warehouse',
  CUSTOMER_SERVICE: '/customer-service',
  CREATE_DELIVERY: '/create-delivery',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  DATA_ENTRY: '/data-entry',
  WAYPLAN: '/wayplan',
  MARKETING: '/marketing',
  HR: '/hr',
  FINANCE: '/finance',
  MERCHANT: '/merchant',
  CUSTOMER: '/customer',
  QR_CODE: '/qr-code',
  BRANCH_OFFICE: '/branch-office',
} as const;

export type RoutePathKey = keyof typeof ROUTE_PATHS;
export type RoutePath = typeof ROUTE_PATHS[RoutePathKey];

export type DeliveryStatus = 'pending' | 'assigned' | 'picked-up' | 'in-transit' | 'out-for-delivery' | 'delivered' | 'failed' | 'cancelled' | 'returned';
export type ServiceType = 'standard' | 'express' | 'same-day' | 'next-day' | 'economy';
export type PaymentMethod = 'cod' | 'prepaid' | 'credit';
export type TaskStatus = 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type EmployeeRole = 
  | 'super-admin'
  | 'admin' 
  | 'branch-office'
  | 'supervisor' 
  | 'wayplan-manager'
  | 'driver' 
  | 'rider'
  | 'warehouse-staff' 
  | 'customer-service' 
  | 'data-entry'
  | 'marketing'
  | 'hr-admin'
  | 'finance'
  | 'merchant'
  | 'customer';
export type VehicleType = 'bike' | 'van' | 'truck';

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Contact {
  name: string;
  phone: string;
  email?: string;
}

export interface Shipment {
  id: string;
  awb: string;
  serviceType: ServiceType;
  status: DeliveryStatus;
  sender: Contact & { address: Address };
  recipient: Contact & { address: Address };
  packageDetails: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    value: number;
    description: string;
  };
  codAmount?: number;
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  branchId: string;
  warehouseId?: string;
}

export interface Delivery {
  id: string;
  shipmentId: string;
  manifestId?: string;
  driverId?: string;
  status: DeliveryStatus;
  assignedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  proofOfDelivery?: {
    signature?: string;
    photo?: string;
    otp?: string;
    gpsLocation: {
      lat: number;
      lng: number;
    };
    timestamp: string;
    recipientName: string;
  };
  ndrCase?: {
    id: string;
    reason: string;
    attempts: number;
    nextAttemptDate?: string;
  };
  codCollected?: number;
  notes?: string;
}

export interface Manifest {
  id: string;
  manifestNumber: string;
  driverId: string;
  vehicleId: string;
  branchId: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  deliveries: string[];
  route: {
    waypoints: Array<{
      deliveryId: string;
      sequence: number;
      address: Address;
      estimatedArrival: string;
    }>;
    totalDistance: number;
    estimatedDuration: number;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
}

export interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  branchId: string;
  status: 'active' | 'inactive' | 'on-leave';
  vehicleAssignment?: {
    vehicleId: string;
    vehicleType: VehicleType;
    licensePlate: string;
  };
  performance?: {
    totalDeliveries: number;
    successRate: number;
    averageRating: number;
    onTimeRate: number;
  };
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  type: 'delivery' | 'pickup' | 'transfer' | 'sorting' | 'inspection';
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  assignedBy: string;
  relatedEntityId?: string;
  relatedEntityType?: 'shipment' | 'delivery' | 'manifest';
  dueDate?: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: 'hub' | 'branch' | 'sorting-center';
  address: Address;
  capacity: {
    total: number;
    current: number;
    unit: 'cubic-meters' | 'pallets';
  };
  operatingHours: {
    open: string;
    close: string;
    timezone: string;
  };
  contactPerson: Contact;
  status: 'operational' | 'maintenance' | 'closed';
  facilities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: Address;
  warehouseId?: string;
  managerId: string;
  contactPhone: string;
  contactEmail: string;
  serviceArea: {
    postalCodes: string[];
    radius?: number;
  };
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: EmployeeRole;
  branchId?: string;
  permissions: string[];
  preferences: {
    language: 'en' | 'mm';
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KPI {
  label: string;
  value: number | string;
  unit?: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon?: string;
}

const STATUS_LABELS: Record<DeliveryStatus, string> = {
  'pending': 'Pending',
  'assigned': 'Assigned',
  'picked-up': 'Picked Up',
  'in-transit': 'In Transit',
  'out-for-delivery': 'Out for Delivery',
  'delivered': 'Delivered',
  'failed': 'Failed',
  'cancelled': 'Cancelled',
  'returned': 'Returned',
};

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  'pending': 'bg-muted text-muted-foreground',
  'assigned': 'bg-accent text-accent-foreground',
  'picked-up': 'bg-accent text-accent-foreground',
  'in-transit': 'bg-primary text-primary-foreground',
  'out-for-delivery': 'bg-primary text-primary-foreground',
  'delivered': 'bg-chart-3 text-white',
  'failed': 'bg-destructive text-destructive-foreground',
  'cancelled': 'bg-muted text-muted-foreground',
  'returned': 'bg-chart-4 text-white',
};

export function formatStatus(status: DeliveryStatus): string {
  return STATUS_LABELS[status] || status;
}

export function getStatusColor(status: DeliveryStatus): string {
  return STATUS_COLORS[status] || 'bg-muted text-muted-foreground';
}

export function formatDate(date: string | Date, format: 'short' | 'long' | 'time' | 'datetime' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  const formatOptions: Record<string, Intl.DateTimeFormatOptions> = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' },
    datetime: { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
  };

  return new Intl.DateTimeFormat('en-US', formatOptions[format]).format(d);
}

export function formatCurrency(amount: number, currency: string = 'MMK'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWeight(weight: number, unit: 'kg' | 'lb' = 'kg'): string {
  return `${weight.toFixed(2)} ${unit}`;
}

export function formatDistance(distance: number, unit: 'km' | 'mi' = 'km'): string {
  return `${distance.toFixed(1)} ${unit}`;
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  }
  
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

export function calculateDeliveryMetrics(deliveries: Delivery[]): {
  total: number;
  delivered: number;
  pending: number;
  failed: number;
  successRate: number;
  onTimeRate: number;
  averageDeliveryTime: number;
} {
  const total = deliveries.length;
  const delivered = deliveries.filter(d => d.status === 'delivered').length;
  const pending = deliveries.filter(d => ['pending', 'assigned', 'picked-up', 'in-transit', 'out-for-delivery'].includes(d.status)).length;
  const failed = deliveries.filter(d => d.status === 'failed').length;
  
  const successRate = total > 0 ? (delivered / total) * 100 : 0;
  
  const deliveredWithTime = deliveries.filter(d => d.status === 'delivered' && d.deliveredAt && d.assignedAt);
  const onTimeDeliveries = deliveredWithTime.filter(d => {
    if (!d.deliveredAt || !d.assignedAt) return false;
    const deliveryTime = new Date(d.deliveredAt).getTime();
    const assignedTime = new Date(d.assignedAt).getTime();
    const hoursDiff = (deliveryTime - assignedTime) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  }).length;
  
  const onTimeRate = deliveredWithTime.length > 0 ? (onTimeDeliveries / deliveredWithTime.length) * 100 : 0;
  
  const totalDeliveryTime = deliveredWithTime.reduce((sum, d) => {
    if (!d.deliveredAt || !d.assignedAt) return sum;
    const deliveryTime = new Date(d.deliveredAt).getTime();
    const assignedTime = new Date(d.assignedAt).getTime();
    return sum + (deliveryTime - assignedTime);
  }, 0);
  
  const averageDeliveryTime = deliveredWithTime.length > 0 
    ? totalDeliveryTime / deliveredWithTime.length / (1000 * 60 * 60)
    : 0;
  
  return {
    total,
    delivered,
    pending,
    failed,
    successRate: Math.round(successRate * 10) / 10,
    onTimeRate: Math.round(onTimeRate * 10) / 10,
    averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10,
  };
}

export function calculateRevenue(deliveries: Delivery[], shipments: Shipment[]): {
  totalRevenue: number;
  codCollected: number;
  prepaidRevenue: number;
  pendingCod: number;
} {
  const shipmentMap = new Map(shipments.map(s => [s.id, s]));
  
  let totalRevenue = 0;
  let codCollected = 0;
  let prepaidRevenue = 0;
  let pendingCod = 0;
  
  deliveries.forEach(delivery => {
    const shipment = shipmentMap.get(delivery.shipmentId);
    if (!shipment) return;
    
    const serviceRates: Record<ServiceType, number> = {
      'standard': 5000,
      'express': 8000,
      'same-day': 12000,
      'next-day': 10000,
      'economy': 3000,
    };
    
    const baseRate = serviceRates[shipment.serviceType] || 5000;
    const weightCharge = Math.max(0, shipment.packageDetails.weight - 1) * 1000;
    const deliveryCharge = baseRate + weightCharge;
    
    totalRevenue += deliveryCharge;
    
    if (shipment.paymentMethod === 'cod') {
      if (delivery.status === 'delivered' && delivery.codCollected !== undefined) {
        codCollected += delivery.codCollected;
      } else if (delivery.status !== 'delivered' && delivery.status !== 'failed' && delivery.status !== 'cancelled') {
        pendingCod += (shipment.codAmount || 0);
      }
    } else if (shipment.paymentMethod === 'prepaid') {
      prepaidRevenue += deliveryCharge;
    }
  });
  
  return {
    totalRevenue: Math.round(totalRevenue),
    codCollected: Math.round(codCollected),
    prepaidRevenue: Math.round(prepaidRevenue),
    pendingCod: Math.round(pendingCod),
  };
}

export function groupByStatus<T extends { status: string }>(items: T[]): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const status = item.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export function sortByDate<T extends { createdAt: string }>(items: T[], order: 'asc' | 'desc' = 'desc'): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
}

export function filterByDateRange<T extends { createdAt: string }>(items: T[], startDate: string, endDate: string): T[] {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return items.filter(item => {
    const itemDate = new Date(item.createdAt).getTime();
    return itemDate >= start && itemDate <= end;
  });
}

export function generateAWB(): string {
  const prefix = 'BRX';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${timestamp}${random}`;
}

export function generateManifestNumber(): string {
  const prefix = 'MNF';
  const date = new Date();
  const dateStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${dateStr}-${random}`;
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[0-9]{8,15}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePostalCode(postalCode: string, country: string = 'MM'): boolean {
  const patterns: Record<string, RegExp> = {
    'MM': /^[0-9]{5}$/,
    'US': /^[0-9]{5}(-[0-9]{4})?$/,
    'UK': /^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i,
  };
  
  const pattern = patterns[country] || /^[0-9A-Z\s-]{3,10}$/i;
  return pattern.test(postalCode);
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Additional type definitions for production API
export interface Vehicle {
  id: string;
  registration_number: string;
  type: VehicleType;
  capacity: any;
  current_driver_id?: string;
  warehouse_id?: string;
  status: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  ticket_number: string;
  shipment_id?: string;
  customer_id?: string;
  category: string;
  status: string;
  priority: TaskPriority;
  subject: string;
  description: string;
  assigned_to?: string;
  resolution?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: string;
  location?: any;
  notes?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface CODCollection {
  id: string;
  delivery_id: string;
  shipment_id: string;
  driver_id: string;
  amount: number;
  collected_at: string;
  deposited_at?: string;
  deposit_reference?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  merchant_id: string;
  billing_period_start: string;
  billing_period_end: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  due_date?: string;
  paid_at?: string;
  payment_reference?: string;
  line_items: any;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface QRCode {
  id: string;
  code: string;
  type: string;
  entity_id: string;
  entity_type: string;
  data?: any;
  is_active: boolean;
  scanned_count: number;
  last_scanned_at?: string;
  last_scanned_by?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
