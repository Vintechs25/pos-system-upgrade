import { create } from "zustand";
import type { CartItem, Customer, HardwareProduct, SaleRecord, TimberWoodType } from "./types";
import { seedCustomers, seedHardware, seedSales, seedTimber } from "./seed-data";

interface POSState {
  hardware: HardwareProduct[];
  timber: TimberWoodType[];
  customers: Customer[];
  sales: SaleRecord[];
  cart: CartItem[];
  activeCustomerId: string;
  cartDiscountPct: number;

  addCartItem: (item: Omit<CartItem, "lineId" | "total">) => void;
  updateCartItem: (lineId: string, qty: number) => void;
  removeCartItem: (lineId: string) => void;
  clearCart: () => void;
  setCustomer: (id: string) => void;
  setDiscount: (pct: number) => void;

  addCustomer: (c: Omit<Customer, "id" | "createdAt" | "balance">) => void;
  addHardware: (p: Omit<HardwareProduct, "id" | "kind">) => void;
  addTimber: (t: Omit<TimberWoodType, "id" | "kind">) => void;

  completeSale: (payment: SaleRecord["payment"]) => SaleRecord;
}

const fmtMoney = (n: number) => Math.round(n * 100) / 100;

export const usePOS = create<POSState>((set, get) => ({
  hardware: seedHardware,
  timber: seedTimber,
  customers: seedCustomers,
  sales: seedSales,
  cart: [],
  activeCustomerId: "c-walkin",
  cartDiscountPct: 0,

  addCartItem: (item) =>
    set((s) => {
      const lineId = `L-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const total = fmtMoney(item.unitPrice * item.quantity);
      return { cart: [...s.cart, { ...item, lineId, total }] };
    }),

  updateCartItem: (lineId, qty) =>
    set((s) => ({
      cart: s.cart.map((c) =>
        c.lineId === lineId ? { ...c, quantity: qty, total: fmtMoney(c.unitPrice * qty) } : c,
      ),
    })),

  removeCartItem: (lineId) => set((s) => ({ cart: s.cart.filter((c) => c.lineId !== lineId) })),
  clearCart: () => set({ cart: [], cartDiscountPct: 0, activeCustomerId: "c-walkin" }),
  setCustomer: (id) => set({ activeCustomerId: id }),
  setDiscount: (pct) => set({ cartDiscountPct: Math.max(0, Math.min(100, pct)) }),

  addCustomer: (c) =>
    set((s) => ({
      customers: [
        ...s.customers,
        { ...c, id: `c-${Date.now()}`, balance: 0, createdAt: new Date().toISOString() },
      ],
    })),

  addHardware: (p) =>
    set((s) => ({
      hardware: [...s.hardware, { ...p, kind: "hardware", id: `h-${Date.now()}` }],
    })),

  addTimber: (t) =>
    set((s) => ({ timber: [...s.timber, { ...t, kind: "timber", id: `w-${Date.now()}` }] })),

  completeSale: (payment) => {
    const state = get();
    const subtotal = state.cart.reduce((sum, i) => sum + i.total, 0);
    const customer = state.customers.find((c) => c.id === state.activeCustomerId);
    const discPct = state.cartDiscountPct + (customer?.discountPct ?? 0);
    const discount = fmtMoney((subtotal * discPct) / 100);
    const total = fmtMoney(subtotal - discount);

    const sale: SaleRecord = {
      id: `s-${Date.now()}`,
      date: new Date().toISOString(),
      customerId: state.activeCustomerId,
      customerName: customer?.name ?? "Walk-in Customer",
      items: state.cart,
      subtotal: fmtMoney(subtotal),
      discount,
      total,
      payment,
      status: payment === "credit" ? "credit" : "paid",
    };

    set((s) => {
      // decrement stock
      const hardware = s.hardware.map((h) => {
        const sold = state.cart
          .filter((c) => c.kind === "hardware" && c.productId === h.id)
          .reduce((sum, c) => sum + c.quantity, 0);
        return sold ? { ...h, stock: Math.max(0, h.stock - sold) } : h;
      });
      const timber = s.timber.map((w) => {
        const piecesSold = state.cart
          .filter((c) => c.kind === "timber" && c.productId === w.id)
          .reduce((sum, c) => sum + (c.meta?.pieces ?? 0), 0);
        return piecesSold ? { ...w, pieces: Math.max(0, w.pieces - piecesSold) } : w;
      });
      const customers =
        payment === "credit"
          ? s.customers.map((c) =>
              c.id === state.activeCustomerId ? { ...c, balance: c.balance + total } : c,
            )
          : s.customers;
      return {
        sales: [sale, ...s.sales],
        hardware,
        timber,
        customers,
        cart: [],
        cartDiscountPct: 0,
        activeCustomerId: "c-walkin",
      };
    });
    return sale;
  },
}));

export const formatKsh = (n: number) =>
  `KSh ${n.toLocaleString("en-KE", { maximumFractionDigits: 2 })}`;
