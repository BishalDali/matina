'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Search, ShoppingBag, X, ChevronDown } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useCart } from './CartContext';

interface NavData {
  categories: Array<{ id: string; name: string; slug: string }>;
  collections: Array<{ id: string; name: string; slug: string }>;
  announcement: {
    isVisible?: boolean;
    text?: string;
    link?: string;
    backgroundColor?: string;
    textColor?: string;
  } | null;
}

export function Navbar() {
  const { cart } = useCart();
  const router = useRouter();
  const [nav, setNav] = useState<NavData>({
    categories: [],
    collections: [],
    announcement: null,
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    apiFetch<NavData>('/storefront/navigation')
      .then(setNav)
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-cream bg-ivory/95 backdrop-blur">
      {nav.announcement?.isVisible && nav.announcement.text && (
        <div
          className="px-4 py-2 text-center text-xs tracking-wider uppercase"
          style={{
            backgroundColor: nav.announcement.backgroundColor || '#8B3A2B',
            color: nav.announcement.textColor || '#FAF7F2',
          }}
        >
          {nav.announcement.link ? (
            <Link href={nav.announcement.link} className="hover:underline">
              {nav.announcement.text}
            </Link>
          ) : (
            nav.announcement.text
          )}
        </div>
      )}

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="p-2 text-charcoal lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="font-serif text-2xl font-semibold tracking-[0.2em] text-charcoal">
            MATINA
          </Link>
        </div>

        <nav className="hidden items-center gap-7 text-sm font-medium tracking-wide text-charcoal lg:flex">
          <Link href="/" className="hover:text-terracotta transition-colors">
            Home
          </Link>

          <div className="group relative py-5">
            <Link href="/shop" className="flex items-center gap-1 hover:text-terracotta">
              Shop <ChevronDown className="h-3.5 w-3.5" />
            </Link>
            <div className="invisible absolute left-0 top-full w-52 border border-cream bg-ivory p-3 shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              <Link href="/shop" className="block px-3 py-1.5 text-sm hover:bg-stone">
                Shop All
              </Link>
              {nav.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="block px-3 py-1.5 text-sm hover:bg-stone"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="group relative py-5">
            <span className="flex cursor-pointer items-center gap-1 hover:text-terracotta">
              Collections <ChevronDown className="h-3.5 w-3.5" />
            </span>
            <div className="invisible absolute left-0 top-full w-52 border border-cream bg-ivory p-3 shadow-lg opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              {nav.collections.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="block px-3 py-1.5 text-sm hover:bg-stone"
                >
                  {col.name}
                </Link>
              ))}
            </div>
          </div>

          <Link href="/journal" className="hover:text-terracotta transition-colors">
            Journal
          </Link>
          <Link href="/our-story" className="hover:text-terracotta transition-colors">
            Our Story
          </Link>
          <Link href="/track-order" className="hover:text-terracotta transition-colors">
            Track Order
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((s) => !s)}
            className="p-2 text-charcoal hover:text-terracotta"
          >
            <Search className="h-5 w-5" />
          </button>

          <Link
            href="/cart"
            aria-label="Shopping Bag"
            className="relative flex items-center gap-1.5 p-2 text-charcoal hover:text-terracotta"
          >
            <ShoppingBag className="h-5 w-5" />
            {cart.itemCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1 text-[11px] font-semibold text-ivory">
                {cart.itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-cream bg-stone/60 px-4 py-3">
          <form onSubmit={handleSearch} className="mx-auto flex max-w-2xl gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tees, Lakhey, hoodies, accessories..."
              className="w-full border border-cream bg-ivory px-4 py-2 text-sm focus:border-terracotta focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="bg-terracotta px-5 py-2 text-xs font-semibold tracking-wider uppercase text-ivory hover:bg-maroon"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-charcoal/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 flex w-80 max-w-full flex-col bg-ivory p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-cream pb-4">
              <span className="font-serif text-xl font-semibold tracking-[0.2em]">MATINA</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex flex-col gap-4 text-sm font-medium">
              <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
              <Link href="/shop" onClick={() => setMobileOpen(false)}>Shop All</Link>
              <div className="border-t border-cream pt-3">
                <p className="mb-2 text-xs uppercase tracking-wider text-charcoal/60">Categories</p>
                <div className="flex flex-col gap-2 pl-2">
                  {nav.categories.map((cat) => (
                    <Link key={cat.id} href={`/category/${cat.slug}`} onClick={() => setMobileOpen(false)}>
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="border-t border-cream pt-3">
                <p className="mb-2 text-xs uppercase tracking-wider text-charcoal/60">Collections</p>
                <div className="flex flex-col gap-2 pl-2">
                  {nav.collections.map((col) => (
                    <Link key={col.id} href={`/collections/${col.slug}`} onClick={() => setMobileOpen(false)}>
                      {col.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="border-t border-cream pt-3 flex flex-col gap-3">
                <Link href="/journal" onClick={() => setMobileOpen(false)}>Journal</Link>
                <Link href="/our-story" onClick={() => setMobileOpen(false)}>Our Story</Link>
                <Link href="/track-order" onClick={() => setMobileOpen(false)}>Track Order</Link>
                <Link href="/faq" onClick={() => setMobileOpen(false)}>FAQ & Shipping</Link>
                <Link href="/contact" onClick={() => setMobileOpen(false)}>Contact</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
