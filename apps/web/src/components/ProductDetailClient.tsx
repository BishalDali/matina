'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatNPR } from '@matina/shared';
import { useCart } from './CartContext';
import { ProductCard, ProductCardProps } from './ProductCard';

interface Variant {
  id: string;
  colourName: string;
  colourHex: string;
  size: string;
  sku: string;
  availableQty: number;
  stockState: 'in_stock' | 'low_stock' | 'out_of_stock';
  regularPriceNpr: number;
  effectivePriceNpr: number;
  discountPercent: number;
  hasActiveOffer: boolean;
}

export interface ProductDetailData {
  id: string;
  name: string;
  slug: string;
  skuPrefix: string;
  shortDescription: string | null;
  fullDescription: string | null;
  fabricCare: string | null;
  sizeGuide: { unit?: string; rows?: Array<{ size: string; chest: string; length: string }> } | null;
  badges: string[];
  category: { name: string; slug: string };
  collections: Array<{ name: string; slug: string }>;
  images: Array<{ id: string; url: string; altText: string | null }>;
  regularPriceNpr: number;
  effectivePriceNpr: number;
  discountPercent: number;
  hasActiveOffer: boolean;
  variants: Variant[];
  relatedProducts: ProductCardProps[];
}

export function ProductDetailClient({ product }: { product: ProductDetailData }) {
  const { addToCart, loading } = useCart();
  const [activeImage, setActiveImage] = useState(product.images[0]?.url || '');

  const colours = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of product.variants) map.set(v.colourName, v.colourHex);
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [product.variants]);

  const [selectedColour, setSelectedColour] = useState(colours[0]?.name || '');

  const sizesForColour = useMemo(
    () => product.variants.filter((v) => v.colourName === selectedColour),
    [product.variants, selectedColour]
  );

  const [selectedSize, setSelectedSize] = useState(
    sizesForColour.find((v) => v.availableQty > 0)?.size || sizesForColour[0]?.size || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const selectedVariant = product.variants.find(
    (v) => v.colourName === selectedColour && v.size === selectedSize
  );

  const displayRegular = selectedVariant?.regularPriceNpr ?? product.regularPriceNpr;
  const displayEffective = selectedVariant?.effectivePriceNpr ?? product.effectivePriceNpr;
  const displayDiscount = selectedVariant?.discountPercent ?? product.discountPercent;
  const displayOffer = selectedVariant?.hasActiveOffer ?? product.hasActiveOffer;

  const handleColourChange = (colour: string) => {
    setSelectedColour(colour);
    const matching = product.variants.filter((v) => v.colourName === colour);
    const firstInStock = matching.find((v) => v.availableQty > 0) ?? matching[0];
    setSelectedSize(firstInStock?.size || '');
    setQuantity(1);
    setFeedback(null);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      setFeedback({ type: 'err', msg: 'Please select a colour and size.' });
      return;
    }
    try {
      await addToCart(selectedVariant.id, quantity);
      setFeedback({ type: 'ok', msg: 'Added to your shopping bag.' });
    } catch (err) {
      setFeedback({
        type: 'err',
        msg: err instanceof Error ? err.message : 'Could not add to bag',
      });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 text-xs uppercase tracking-wider text-charcoal/60">
        <Link href="/shop" className="hover:text-terracotta">Shop</Link>
        {' / '}
        <Link href={`/category/${product.category.slug}`} className="hover:text-terracotta">
          {product.category.name}
        </Link>
        {' / '}
        <span className="text-charcoal">{product.name}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Image Gallery */}
        <div>
          <div className="aspect-[3/4] overflow-hidden bg-stone">
            {activeImage && (
              <img
                src={activeImage}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(img.url)}
                  className={`aspect-square overflow-hidden border ${
                    activeImage === img.url ? 'border-terracotta' : 'border-cream'
                  }`}
                >
                  <img src={img.url} alt={img.altText || product.name} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info & Variant Matrix */}
        <div>
          <div className="flex flex-wrap gap-2">
            {product.collections.map((c) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="text-xs font-semibold uppercase tracking-widest text-terracotta hover:underline"
              >
                {c.name}
              </Link>
            ))}
          </div>

          <h1 className="mt-2 font-serif text-3xl font-medium text-charcoal sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-1 text-xs text-charcoal/55">
            SKU: {selectedVariant?.sku || product.skuPrefix}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <span className="text-2xl font-semibold text-charcoal">
              {formatNPR(displayEffective)}
            </span>
            {displayOffer && (
              <>
                <span className="text-base text-charcoal/50 line-through">
                  {formatNPR(displayRegular)}
                </span>
                <span className="bg-terracotta px-2.5 py-0.5 text-xs font-semibold text-ivory">
                  {displayDiscount}% OFF — Save {formatNPR(displayRegular - displayEffective)}
                </span>
              </>
            )}
          </div>

          {product.shortDescription && (
            <p className="mt-4 text-sm leading-relaxed text-charcoal/80">
              {product.shortDescription}
            </p>
          )}

          {/* Colour Selector */}
          <div className="mt-7">
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal">
              Colour: <span className="font-normal text-charcoal/70">{selectedColour}</span>
            </p>
            <div className="mt-2.5 flex flex-wrap gap-3">
              {colours.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleColourChange(c.name)}
                  aria-label={c.name}
                  className={`flex items-center gap-2 border px-3 py-1.5 text-xs ${
                    selectedColour === c.name
                      ? 'border-charcoal bg-stone font-semibold'
                      : 'border-cream bg-ivory'
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-charcoal/20"
                    style={{ backgroundColor: c.hex }}
                  />
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                Size: <span className="font-normal text-charcoal/70">{selectedSize}</span>
              </p>
              {product.sizeGuide?.rows && (
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="text-xs underline text-charcoal/70 hover:text-terracotta"
                >
                  Size Guide
                </button>
              )}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              {sizesForColour.map((v) => {
                const disabled = v.availableQty <= 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => { setSelectedSize(v.size); setQuantity(1); setFeedback(null); }}
                    className={`min-w-12 border px-4 py-2 text-xs font-medium ${
                      selectedSize === v.size
                        ? 'border-charcoal bg-charcoal text-ivory'
                        : disabled
                        ? 'border-cream bg-stone/50 text-charcoal/40 line-through'
                        : 'border-cream bg-ivory text-charcoal hover:border-charcoal'
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Status */}
          {selectedVariant && (
            <div className="mt-4 text-xs font-medium">
              {selectedVariant.stockState === 'out_of_stock' ? (
                <span className="text-red-700">Out of Stock for this variant</span>
              ) : selectedVariant.stockState === 'low_stock' ? (
                <span className="text-terracotta">
                  Low Stock — Only {selectedVariant.availableQty} left
                </span>
              ) : (
                <span className="text-emerald-800">
                  In Stock ({selectedVariant.availableQty} available)
                </span>
              )}
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center border border-cream bg-ivory">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3.5 py-3 text-sm"
              >
                -
              </button>
              <span className="px-3 text-sm font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) =>
                    Math.min(selectedVariant?.availableQty || 1, q + 1)
                  )
                }
                className="px-3.5 py-3 text-sm"
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={loading || !selectedVariant || selectedVariant.availableQty <= 0}
              onClick={handleAddToCart}
              className="flex-1 bg-terracotta py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-maroon disabled:cursor-not-allowed disabled:bg-charcoal/30"
            >
              {selectedVariant?.availableQty === 0
                ? 'Out of Stock'
                : loading
                ? 'Adding...'
                : 'Add to Bag'}
            </button>
          </div>

          {feedback && (
            <div
              className={`mt-4 border p-3 text-xs ${
                feedback.type === 'ok'
                  ? 'border-emerald-700/30 bg-emerald-50 text-emerald-900'
                  : 'border-red-700/30 bg-red-50 text-red-900'
              }`}
            >
              {feedback.msg}{' '}
              {feedback.type === 'ok' && (
                <Link href="/cart" className="ml-2 font-semibold underline">
                  View Bag &rarr;
                </Link>
              )}
            </div>
          )}

          {/* Details & COD Info */}
          <div className="mt-8 space-y-4 border-t border-cream pt-6 text-sm text-charcoal/80">
            <div className="bg-stone/70 p-4 text-xs">
              <p className="font-semibold uppercase tracking-wider text-charcoal">
                Cash on Delivery Available
              </p>
              <p className="mt-1 text-charcoal/70">
                Pay in cash when your order arrives anywhere in Nepal.
              </p>
            </div>

            {product.fullDescription && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                  Description
                </h2>
                <p className="mt-2 leading-relaxed">{product.fullDescription}</p>
              </div>
            )}

            {product.fabricCare && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal">
                  Fabric &amp; Care
                </h2>
                <p className="mt-2 leading-relaxed">{product.fabricCare}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {product.relatedProducts.length > 0 && (
        <section className="mt-20 border-t border-cream pt-12">
          <h2 className="mb-8 font-serif text-3xl font-medium text-charcoal">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {product.relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Size Guide Modal */}
      {showSizeGuide && product.sizeGuide?.rows && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4">
          <div className="w-full max-w-md bg-ivory p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-cream pb-3">
              <h3 className="font-serif text-xl">Size Guide ({product.sizeGuide.unit || 'inches'})</h3>
              <button type="button" onClick={() => setShowSizeGuide(false)} className="text-sm">
                Close
              </button>
            </div>
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="border-b border-cream text-xs uppercase text-charcoal/60">
                  <th className="py-2">Size</th>
                  <th className="py-2">Chest</th>
                  <th className="py-2">Length</th>
                </tr>
              </thead>
              <tbody>
                {product.sizeGuide.rows.map((r) => (
                  <tr key={r.size} className="border-b border-cream/60">
                    <td className="py-2 font-medium">{r.size}</td>
                    <td className="py-2">{r.chest}</td>
                    <td className="py-2">{r.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
