import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-cream bg-stone text-charcoal">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <h3 className="font-serif text-2xl font-semibold tracking-[0.2em]">MATINA</h3>
          <p className="mt-3 text-sm leading-relaxed text-charcoal/75">
            Nepal&apos;s living culture reimagined through contemporary streetwear.
          </p>
          <p className="mt-4 text-xs uppercase tracking-wider text-terracotta">
            Cash on Delivery across Nepal
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">
            Shop
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/shop" className="hover:text-terracotta">Shop All</Link></li>
            <li><Link href="/customize" className="hover:text-terracotta">Customize Your Wear</Link></li>
            <li><Link href="/category/t-shirts" className="hover:text-terracotta">T-Shirts</Link></li>
            <li><Link href="/category/hoodies" className="hover:text-terracotta">Hoodies</Link></li>
            <li><Link href="/category/sweatshirts" className="hover:text-terracotta">Sweatshirts</Link></li>
            <li><Link href="/collections/lakhey" className="hover:text-terracotta">Lakhey Collection</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">
            Customer Care
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/track-order" className="hover:text-terracotta">Track Order</Link></li>
            <li><Link href="/faq" className="hover:text-terracotta">FAQ &amp; Shipping</Link></li>
            <li><Link href="/our-story" className="hover:text-terracotta">Our Story</Link></li>
            <li><Link href="/journal" className="hover:text-terracotta">Journal</Link></li>
            <li><Link href="/contact" className="hover:text-terracotta">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">
            Connect &amp; Policies
          </h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <a
                href="https://instagram.com/matina.clo"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-terracotta"
              >
                Instagram (@matina.clo)
              </a>
            </li>
            <li><Link href="/policies/privacy-policy" className="hover:text-terracotta">Privacy Policy</Link></li>
            <li><Link href="/policies/terms-conditions" className="hover:text-terracotta">Terms &amp; Conditions</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream px-4 py-5 text-center text-xs text-charcoal/60">
        &copy; {new Date().getFullYear()} Matina Clothing. All rights reserved.
      </div>
    </footer>
  );
}
