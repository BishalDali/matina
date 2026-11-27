'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { ProductCard, ProductCardProps } from './ProductCard';

interface Facets {
  categories: Array<{ name: string; slug: string }>;
  collections: Array<{ name: string; slug: string }>;
  sizes: string[];
  colours: Array<{ name: string; hex: string }>;
}

interface ProductsResponse {
  items: ProductCardProps[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  facets: Facets;
}

export function ShopCatalog({
  title,
  description,
  bannerUrl,
  fixedCategory,
  fixedCollection,
  initialQuery = '',
}: {
  title: string;
  description?: string | null;
  bannerUrl?: string | null;
  fixedCategory?: string;
  fixedCollection?: string;
  initialQuery?: string;
}) {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState(fixedCategory || '');
  const [collection, setCollection] = useState(fixedCollection || '');
  const [size, setSize] = useState('');
  const [colour, setColour] = useState('');
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (collection) params.set('collection', collection);
      if (size) params.set('size', size);
      if (colour) params.set('colour', colour);
      if (inStock) params.set('inStock', 'true');
      if (onSale) params.set('onSale', 'true');
      if (initialQuery) params.set('q', initialQuery);
      params.set('sort', sort);
      params.set('page', String(page));

      const res = await apiFetch<ProductsResponse>(`/storefront/products?${params.toString()}`);
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [category, collection, size, colour, inStock, onSale, initialQuery, sort, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const clearFilters = () => {
    if (!fixedCategory) setCategory('');
    if (!fixedCollection) setCollection('');
    setSize('');
    setColour('');
    setInStock(false);
    setOnSale(false);
    setPage(1);
  };

  return (
    <div>
      {bannerUrl && (
        <div className="relative h-56 w-full overflow-hidden bg-charcoal">
          <img src={bannerUrl} alt={title} className="h-full w-full object-cover opacity-65" />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="border-b border-cream pb-6">
          <h1 className="font-serif text-4xl font-medium text-charcoal">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm text-charcoal/70">{description}</p>}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <aside className="space-y-6 border-b border-cream pb-6 lg:border-b-0 lg:border-r lg:pr-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-charcoal">
                Filters
              </h2>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-terracotta hover:underline"
              >
                Clear All
              </button>
            </div>

            {!fixedCategory && data?.facets.categories && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/70">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                  className="mt-2 w-full border border-cream bg-ivory px-3 py-2 text-sm"
                >
                  <option value="">All Categories</option>
                  {data.facets.categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {!fixedCollection && data?.facets.collections && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal/70">
                  Collection
                </label>
                <select
                  value={collection}
                  onChange={(e) => { setCollection(e.target.value); setPage(1); }}
                  className="mt-2 w-full border border-cream bg-ivory px-3 py-2 text-sm"
                >
                  <option value="">All Collections</option>
                  {data.facets.collections.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {data?.facets.sizes && data.facets.sizes.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/70">Size</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.facets.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setSize(size === s ? '' : s); setPage(1); }}
                      className={`border px-3 py-1 text-xs ${
                        size === s
                          ? 'border-charcoal bg-charcoal text-ivory'
                          : 'border-cream bg-ivory text-charcoal hover:border-charcoal'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {data?.facets.colours && data.facets.colours.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal/70">Colour</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.facets.colours.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => { setColour(colour === c.name ? '' : c.name); setPage(1); }}
                      className={`flex items-center gap-1.5 border px-2.5 py-1 text-xs ${
                        colour === c.name ? 'border-charcoal bg-stone' : 'border-cream bg-ivory'
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-charcoal/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(e) => { setInStock(e.target.checked); setPage(1); }}
                />
                In Stock Only
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={onSale}
                  onChange={(e) => { setOnSale(e.target.checked); setPage(1); }}
                />
                On Offer / Sale
              </label>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-charcoal/65">
                {data ? `${data.pagination.total} product(s)` : 'Loading...'}
              </p>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="border border-cream bg-ivory px-3 py-1.5 text-sm"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="bestselling">Bestselling</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="aspect-[3/4] animate-pulse bg-stone" />
                ))}
              </div>
            ) : data && data.items.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 sm:gap-x-6">
                  {data.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {data.pagination.totalPages > 1 && (
                  <div className="mt-12 flex justify-center gap-2">
                    {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`px-3.5 py-1.5 text-xs font-medium ${
                          p === page
                            ? 'bg-charcoal text-ivory'
                            : 'border border-cream bg-ivory text-charcoal'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="border border-cream bg-stone/40 py-16 text-center">
                <p className="font-serif text-2xl text-charcoal">No products match your filters</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 bg-terracotta px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-ivory"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
