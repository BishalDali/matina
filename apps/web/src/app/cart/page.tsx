'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { formatNPR } from '@matina/shared';
import { useCart } from '@/components/CartContext';

export default function CartPage() {
  const { cart, loading, updateQuantity, removeItem } = useCart();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-4xl font-medium text-charcoal">Shopping Bag</h1>

      {cart.items.length === 0 ? (
        <div className="mt-10 border border-cream bg-stone/40 py-16 text-center">
          <p className="font-serif text-2xl text-charcoal">Your bag is empty</p>
          <p className="mt-2 text-sm text-charcoal/65">
            Discover our latest Nepali cultural streetwear drops.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-block bg-terracotta px-8 py-3 text-xs font-semibold uppercase tracking-widest text-ivory hover:bg-maroon"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <div className="divide-y divide-cream lg:col-span-2">
            {cart.items.map((item) => (
              <div key={item.id} className="flex gap-5 py-6">
                <Link href={`/product/${item.productSlug}`} className="h-28 w-24 shrink-0 bg-stone">
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  )}
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link
                        href={`/product/${item.productSlug}`}
                        className="font-serif text-lg text-charcoal hover:text-terracotta"
                      >
                        {item.productName}
                      </Link>
                      <p className="mt-1 text-xs text-charcoal/65">
                        {item.colourName} / Size {item.size}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <span className="font-medium">{formatNPR(item.effectivePriceNpr)}</span>
                        {item.hasActiveOffer && (
                          <span className="text-xs text-charcoal/45 line-through">
                            {formatNPR(item.regularPriceNpr)}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{formatNPR(item.lineTotalNpr)}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center border border-cream">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1 text-sm"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={loading || item.quantity >= item.availableQty}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-1 text-sm disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="flex items-center gap-1 text-xs text-charcoal/60 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit border border-cream bg-stone/50 p-6">
            <h2 className="font-serif text-2xl font-medium">Order Summary</h2>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal/70">Subtotal</span>
                <span className="font-medium">{formatNPR(cart.subtotalNpr)}</span>
              </div>
              <div className="flex justify-between text-xs text-charcoal/60">
                <span>Delivery Charge</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-6 block w-full bg-terracotta py-3.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-ivory hover:bg-maroon"
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/shop"
              className="mt-3 block text-center text-xs uppercase tracking-wider text-charcoal/70 hover:underline"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
