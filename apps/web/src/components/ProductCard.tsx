import Link from 'next/link';
import { formatNPR } from '@matina/shared';

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  imageAlt: string;
  category: { name: string; slug: string };
  badges: string[];
  inStock: boolean;
  regularPriceNpr: number;
  effectivePriceNpr: number;
  discountPercent: number;
  hasActiveOffer: boolean;
}

export function ProductCard({ product }: { product: ProductCardProps }) {
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.imageAlt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-charcoal/40">
            No image
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {product.hasActiveOffer && product.discountPercent > 0 && (
            <span className="bg-terracotta px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ivory">
              {product.discountPercent}% OFF
            </span>
          )}
          {product.badges
            .filter((b) => b !== 'sale')
            .slice(0, 2)
            .map((badge) => (
              <span
                key={badge}
                className="bg-charcoal/85 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ivory"
              >
                {badge.replace('_', ' ')}
              </span>
            ))}
        </div>

        {!product.inStock && (
          <div className="absolute inset-x-0 bottom-0 bg-charcoal/80 py-1.5 text-center text-[11px] font-medium uppercase tracking-widest text-ivory">
            Out of Stock
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <p className="text-[11px] uppercase tracking-wider text-charcoal/60">
          {product.category.name}
        </p>
        <h3 className="font-serif text-lg leading-snug text-charcoal group-hover:text-terracotta transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-charcoal">
            {formatNPR(product.effectivePriceNpr)}
          </span>
          {product.hasActiveOffer && (
            <span className="text-xs text-charcoal/50 line-through">
              {formatNPR(product.regularPriceNpr)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
