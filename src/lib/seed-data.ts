import type { Customer, HardwareProduct, SaleRecord, TimberWoodType } from "./types";

export const seedTimber: TimberWoodType[] = [
  {
    id: "w-cypress",
    kind: "timber",
    name: "Cypress",
    description: "Locally sourced, great for framing",
    pieces: 240,
    multiplier: 1,
    quickLengths: [8, 10, 12, 14, 16],
    sizes: [
      { id: "s-c-2x4", label: "2x4", ratePerFt: 35 },
      { id: "s-c-4x4", label: "4x4", ratePerFt: 75 },
      { id: "s-c-2x6", label: "2x6", ratePerFt: 55 },
      { id: "s-c-1x12", label: "1x12", ratePerFt: 65 },
    ],
  },
  {
    id: "w-pine",
    kind: "timber",
    name: "Pine",
    description: "Soft wood, ideal for interior work",
    pieces: 180,
    multiplier: 0.85,
    quickLengths: [8, 10, 12, 14],
    sizes: [
      { id: "s-p-2x4", label: "2x4", ratePerFt: 30 },
      { id: "s-p-4x4", label: "4x4", ratePerFt: 65 },
      { id: "s-p-2x6", label: "2x6", ratePerFt: 48 },
    ],
  },
  {
    id: "w-mahogany",
    kind: "timber",
    name: "Mahogany",
    description: "Premium hardwood for finishing",
    pieces: 60,
    multiplier: 1.8,
    quickLengths: [10, 12, 14, 16],
    sizes: [
      { id: "s-m-2x4", label: "2x4", ratePerFt: 90 },
      { id: "s-m-4x4", label: "4x4", ratePerFt: 180 },
      { id: "s-m-1x12", label: "1x12", ratePerFt: 160 },
    ],
  },
  {
    id: "w-eucalyptus",
    kind: "timber",
    name: "Eucalyptus",
    description: "Strong, weather resistant",
    pieces: 120,
    multiplier: 0.95,
    quickLengths: [8, 10, 12],
    sizes: [
      { id: "s-e-2x4", label: "2x4", ratePerFt: 32 },
      { id: "s-e-4x4", label: "4x4", ratePerFt: 70 },
    ],
  },
];

export const seedHardware: HardwareProduct[] = [
  { id: "h-1", kind: "hardware", name: "Cement 50kg", sku: "CMT-50", category: "Cement", unit: "bag", price: 850, stock: 320, reorderLevel: 50, supplier: "Bamburi" },
  { id: "h-2", kind: "hardware", name: "Nails 3\" (1kg)", sku: "NL-3", category: "Fasteners", unit: "kg", price: 220, stock: 85, reorderLevel: 20 },
  { id: "h-3", kind: "hardware", name: "Nails 4\" (1kg)", sku: "NL-4", category: "Fasteners", unit: "kg", price: 240, stock: 64, reorderLevel: 20 },
  { id: "h-4", kind: "hardware", name: "Roofing Nails (1kg)", sku: "NL-RF", category: "Fasteners", unit: "kg", price: 320, stock: 40, reorderLevel: 15 },
  { id: "h-5", kind: "hardware", name: "PVC Pipe 4\"", sku: "PVC-4", category: "Pipes", unit: "piece", price: 1200, stock: 28, reorderLevel: 10 },
  { id: "h-6", kind: "hardware", name: "PVC Pipe 2\"", sku: "PVC-2", category: "Pipes", unit: "piece", price: 650, stock: 45, reorderLevel: 10 },
  { id: "h-7", kind: "hardware", name: "Claw Hammer", sku: "TL-HM", category: "Tools", unit: "piece", price: 950, stock: 18, reorderLevel: 5 },
  { id: "h-8", kind: "hardware", name: "Hand Saw 22\"", sku: "TL-SW", category: "Tools", unit: "piece", price: 1450, stock: 9, reorderLevel: 3 },
  { id: "h-9", kind: "hardware", name: "Wood Screws (box)", sku: "FS-WS", category: "Fasteners", unit: "box", price: 480, stock: 52, reorderLevel: 15 },
  { id: "h-10", kind: "hardware", name: "Paint White 4L", sku: "PT-WH", category: "Paint", unit: "piece", price: 2200, stock: 22, reorderLevel: 8 },
  { id: "h-11", kind: "hardware", name: "Wood Glue 500ml", sku: "AD-WG", category: "Adhesives", unit: "piece", price: 380, stock: 30, reorderLevel: 10 },
  { id: "h-12", kind: "hardware", name: "Sand Paper (sheet)", sku: "AB-SP", category: "Abrasives", unit: "piece", price: 45, stock: 200, reorderLevel: 50 },
  { id: "h-13", kind: "hardware", name: "Iron Sheet 28g 3m", sku: "IS-28-3", category: "Roofing", unit: "piece", price: 1850, stock: 14, reorderLevel: 6 },
  { id: "h-14", kind: "hardware", name: "Door Hinge (pair)", sku: "HW-DH", category: "Hardware", unit: "piece", price: 280, stock: 60, reorderLevel: 20 },
];

export const seedCustomers: Customer[] = [
  { id: "c-walkin", name: "Walk-in Customer", type: "walk-in", creditLimit: 0, balance: 0, discountPct: 0, createdAt: new Date().toISOString() },
  { id: "c-1", name: "James Mwangi", type: "contractor", company: "Mwangi Builders", phone: "+254 712 345 678", creditLimit: 200000, balance: 45000, discountPct: 5, createdAt: new Date().toISOString() },
  { id: "c-2", name: "Sarah Kim", type: "contractor", company: "Kim Construction", phone: "+254 722 111 222", creditLimit: 150000, balance: 0, discountPct: 7, createdAt: new Date().toISOString() },
  { id: "c-3", name: "Peter Otieno", type: "contractor", company: "Otieno & Sons", phone: "+254 733 999 888", creditLimit: 100000, balance: 28500, discountPct: 3, createdAt: new Date().toISOString() },
  { id: "c-4", name: "Faith Wanjiru", type: "contractor", company: "Wanjiru Carpentry", phone: "+254 705 222 333", creditLimit: 80000, balance: 12000, discountPct: 4, createdAt: new Date().toISOString() },
];

const today = new Date();
const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000).toISOString();

export const seedSales: SaleRecord[] = [
  { id: "s-1", date: daysAgo(0), customerId: "c-1", customerName: "James Mwangi", items: [], subtotal: 18500, discount: 925, total: 17575, payment: "credit", status: "credit" },
  { id: "s-2", date: daysAgo(0), customerId: "c-walkin", customerName: "Walk-in Customer", items: [], subtotal: 4200, discount: 0, total: 4200, payment: "cash", status: "paid" },
  { id: "s-3", date: daysAgo(1), customerId: "c-2", customerName: "Sarah Kim", items: [], subtotal: 32000, discount: 2240, total: 29760, payment: "mpesa", status: "paid" },
  { id: "s-4", date: daysAgo(1), customerId: "c-walkin", customerName: "Walk-in Customer", items: [], subtotal: 1850, discount: 0, total: 1850, payment: "cash", status: "paid" },
  { id: "s-5", date: daysAgo(2), customerId: "c-3", customerName: "Peter Otieno", items: [], subtotal: 14500, discount: 435, total: 14065, payment: "credit", status: "credit" },
  { id: "s-6", date: daysAgo(3), customerId: "c-walkin", customerName: "Walk-in Customer", items: [], subtotal: 6800, discount: 0, total: 6800, payment: "card", status: "paid" },
  { id: "s-7", date: daysAgo(4), customerId: "c-1", customerName: "James Mwangi", items: [], subtotal: 22000, discount: 1100, total: 20900, payment: "mpesa", status: "paid" },
  { id: "s-8", date: daysAgo(5), customerId: "c-walkin", customerName: "Walk-in Customer", items: [], subtotal: 3400, discount: 0, total: 3400, payment: "cash", status: "paid" },
];
