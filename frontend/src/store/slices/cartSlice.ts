import { StateCreator } from 'zustand';
import type { Product, Customer } from '@types';

interface CartItem extends Product {
  quantity: number;
  discount?: { amount: number; type: 'fixed' | 'percentage' };
}

export interface CartState {
  cart: CartItem[];
  selectedCustomer: Customer | null;
  total: number;
  addToCart: (product: Product, quantity: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setSelectedCustomer: (customer: Customer | null) => void;
}

export const createCartSlice: StateCreator<CartState> = (set, get) => ({
  cart: [],
  selectedCustomer: null,
  total: 0,
  addToCart: (product, quantity) => {
    const { cart } = get();
    const existing = cart.find(item => item.id === product.id);
    
    let newCart;
    if (existing) {
      newCart = cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newCart = [...cart, { ...product, quantity }];
    }
    
    const total = newCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    set({ cart: newCart, total });
  },
  updateQuantity: (productId, quantity) => {
    const { cart } = get();
    const newCart = quantity === 0 
      ? cart.filter(item => item.id !== productId)
      : cart.map(item => item.id === productId ? { ...item, quantity } : item);
    
    const total = newCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    set({ cart: newCart, total });
  },
  clearCart: () => set({ cart: [], total: 0 }),
  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
});