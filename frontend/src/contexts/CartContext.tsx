import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { CartItem, Product, Customer } from '@types';

interface DiscountTarget {
  type: 'total' | 'item';
  itemId?: string;
}

interface CartContextType {
  cart: CartItem[];
  selectedCustomer: Customer | null;
  loyaltyDiscount: { points: number; amount: number };
  subtotal: number;
  promotionalDiscount: number;
  loyaltyDiscountAmount: number;
  total: number;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  applyDiscount: (target: DiscountTarget, amount: number, type: 'fixed' | 'percentage') => void;
  applyLoyaltyPoints: (pointsToRedeem: number, discountAmount: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState({ points: 0, amount: 0 });

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    console.log('[CartContext] Adding product to cart:', product);
    if (!product.id) {
      console.error('[CartContext] Product missing id!', product);
      return;
    }
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      const cartItem = { ...product, quantity };
      console.log('[CartContext] Cart item created:', cartItem);
      return [...prevCart, cartItem];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        return prevCart.filter(item => item.id !== productId);
      }
      return prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCustomer(null);
    setLoyaltyDiscount({ points: 0, amount: 0 });
  }, []);

  const applyDiscount = useCallback((target: DiscountTarget, amount: number, type: 'fixed' | 'percentage') => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (target.type === 'item' && target.itemId) {
      setCart(prevCart => prevCart.map(item => {
        if (item.id === target.itemId) {
          return { ...item, discount: { amount, type } };
        }
        return item;
      }));
    } else {
      if (subtotal === 0) return;
      const totalDiscountValue = type === 'fixed' ? amount : subtotal * (amount / 100);
      setCart(prevCart => prevCart.map(item => {
        const itemTotal = item.price * item.quantity;
        const proportionalDiscount = (itemTotal / subtotal) * totalDiscountValue;
        return { ...item, discount: { amount: proportionalDiscount, type: 'fixed' } };
      }));
    }
  }, [cart]);

  const applyLoyaltyPoints = useCallback((pointsToRedeem: number, discountAmount: number) => {
    setLoyaltyDiscount({ points: pointsToRedeem, amount: discountAmount });
  }, []);

  const { subtotal, promotionalDiscount, loyaltyDiscountAmount, total } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const promotionalDiscount = cart.reduce((sum, item) => {
      if (!item.discount) return sum;
      if (item.discount.type === 'fixed') {
        return sum + item.discount.amount;
      }
      const itemTotal = item.price * item.quantity;
      return sum + (itemTotal * (item.discount.amount / 100));
    }, 0);
    const loyaltyDiscountAmount = loyaltyDiscount.amount;
    const totalValue = subtotal - promotionalDiscount - loyaltyDiscountAmount;
    return { subtotal, promotionalDiscount, loyaltyDiscountAmount, total: totalValue };
  }, [cart, loyaltyDiscount]);

  const value: CartContextType = {
    cart,
    selectedCustomer,
    loyaltyDiscount,
    subtotal,
    promotionalDiscount,
    loyaltyDiscountAmount,
    total,
    addToCart,
    updateQuantity,
    clearCart,
    setSelectedCustomer,
    applyDiscount,
    applyLoyaltyPoints,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
