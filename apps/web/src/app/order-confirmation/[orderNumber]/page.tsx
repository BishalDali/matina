import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-terracotta" />
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-terracotta">
        Order Confirmed
      </p>
      <h1 className="mt-2 font-serif text-4xl font-medium text-charcoal">
        Thank you for your order
      </h1>
      <p className="mt-4 text-sm text-charcoal/75">
        Your Cash on Delivery order has been placed. Keep your order number handy to track your delivery.
      </p>

      <div className="mt-8 border border-cream bg-stone/60 p-6">
        <p className="text-xs uppercase tracking-widest text-charcoal/60">Order Number</p>
        <p className="mt-1 font-serif text-3xl font-semibold tracking-wider text-charcoal">
          {orderNumber}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/track-order"
          className="bg-terracotta px-7 py-3 text-xs font-semibold uppercase tracking-widest text-ivory hover:bg-maroon"
        >
          Track Order
        </Link>
        <Link
          href="/shop"
          className="border border-charcoal px-7 py-3 text-xs font-semibold uppercase tracking-widest text-charcoal hover:bg-charcoal hover:text-ivory"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
