'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export interface CartItemData {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  colourName: string;
  colourHex: string;
  size: string;
  sku: string;
  quantity: number;
  availableQty: number;
  inStock: boolean;
  regularPriceNpr: number;
  effectivePriceNpr: number;
  offerPriceNpr: number | null;
  discountPercent: number;
  hasActiveOffer: boolean;
  lineTotalNpr: number;
}

export interface CartState {
  items: CartItemData[];
  subtotalNpr: number;
  itemCount: number;
  hasOfferItems: boolean;
}

interface CartContextValue {
  cart: CartState;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
}

const emptyCart: CartState = { items: [], subtotalNpr: 0, itemCount: 0, hasOfferItems: false };

const CartContext = createContext<CartContextValue>({
  cart: emptyCart,
  loading: false,
  refreshCart: async () => {},
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>(emptyCart);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    try {
      const data = await apiFetch<CartState>('/cart');
      setCart(data);
    } catch {
      // ignore initial offline error
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (variantId: string, quantity = 1) => {
    setLoading(true);
    try {
      const data = await apiFetch<CartState>('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ variantId, quantity }),
      });
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    setLoading(true);
    try {
      const data = await apiFetch<CartState>(`/cart/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity }),
      });
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoading(true);
    try {
      const data = await apiFetch<CartState>(`/cart/items/${itemId}`, {
        method: 'DELETE',
      });
      setCart(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, loading, refreshCart, addToCart, updateQuantity, removeItem }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
