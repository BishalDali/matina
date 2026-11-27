import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { ProductCard, ProductCardProps } from '@/components/ProductCard';

interface HomeResponse {
  sections: Array<{
    id: string;
    sectionType: string;
    title: string;
    subtitle?: string;
    configJson: Record<string, any>;
    displayOrder: number;
  }>;
  heroBanners: Array<{
    id: string;
    desktopImageUrl: string;
    mobileImageUrl: string | null;
    heading: string | null;
    subheading: string | null;
    ctaText: string | null;
    ctaLink: string | null;
  }>;
  promoBanners: Array<{
    id: string;
    desktopImageUrl: string;
    heading: string | null;
    subheading: string | null;
    ctaText: string | null;
    ctaLink: string | null;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
  }>;
  collections: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
  }>;
  featuredProducts: ProductCardProps[];
  instagramPosts: Array<{
    id: string;
    mediaUrl: string;
    permalink: string;
    caption: string | null;
  }>;
}

export default async function HomePage() {
  let data: HomeResponse | null = null;
  try {
    data = await apiFetch<HomeResponse>('/storefront/home');
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h1 className="font-serif text-5xl tracking-wide text-charcoal">CULTURE ON WEAR</h1>
        <p className="mt-4 text-charcoal/70">
          Contemporary streetwear inspired by Nepal&apos;s living heritage.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block bg-terracotta px-8 py-3.5 text-xs font-semibold uppercase tracking-widest text-ivory hover:bg-maroon"
        >
          Shop Collection
        </Link>
      </section>
    );
  }

  const hero = data.heroBanners[0];
  const promo = data.promoBanners[0];

  return (
    <div>
      {data.sections.map((section) => {
        switch (section.sectionType) {
          case 'hero':
            if (!hero) return null;
            return (
              <section key={section.id} className="relative min-h-[72vh] w-full overflow-hidden bg-charcoal">
                <picture>
                  {hero.mobileImageUrl && (
                    <source media="(max-width: 767px)" srcSet={hero.mobileImageUrl} />
                  )}
                  <img
                    src={hero.desktopImageUrl}
                    alt={hero.heading || 'Matina Clothing'}
                    className="absolute inset-0 h-full w-full object-cover opacity-75"
                  />
                </picture>
                <div className="relative z-10 mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-end px-4 pb-16 sm:px-6 lg:px-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-ivory/85">
                    Matina Clothing
                  </p>
                  <h1 className="mt-3 max-w-2xl font-serif text-4xl font-medium leading-tight tracking-wide text-ivory sm:text-6xl">
                    {hero.heading || 'CULTURE ON WEAR'}
                  </h1>
                  {hero.subheading && (
                    <p className="mt-4 max-w-xl text-base text-ivory/90 sm:text-lg">
                      {hero.subheading}
                    </p>
                  )}
                  {hero.ctaText && (
                    <div className="mt-8">
                      <Link
                        href={hero.ctaLink || '/shop'}
                        className="inline-block bg-terracotta px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-maroon"
                      >
                        {hero.ctaText}
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            );

          case 'categories':
            return (
              <section key={section.id} className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <h2 className="font-serif text-3xl font-medium text-charcoal sm:text-4xl">
                      {section.title}
                    </h2>
                    {section.subtitle && (
                      <p className="mt-1 text-sm text-charcoal/65">{section.subtitle}</p>
                    )}
                  </div>
                  <Link href="/shop" className="text-xs font-semibold uppercase tracking-widest text-terracotta hover:underline">
                    View All
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  {data!.categories.map((cat) => (
                    <Link key={cat.id} href={`/category/${cat.slug}`} className="group block">
                      <div className="aspect-[3/4] overflow-hidden bg-stone">
                        {cat.imageUrl && (
                          <img
                            src={cat.imageUrl}
                            alt={cat.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <p className="mt-2.5 text-center font-serif text-lg text-charcoal group-hover:text-terracotta">
                        {cat.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            );

          case 'collections':
            return (
              <section key={section.id} className="bg-stone py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="mb-8">
                    <h2 className="font-serif text-3xl font-medium text-charcoal sm:text-4xl">
                      {section.title}
                    </h2>
                    {section.subtitle && (
                      <p className="mt-1 text-sm text-charcoal/65">{section.subtitle}</p>
                    )}
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {data!.collections.map((col) => (
                      <Link
                        key={col.id}
                        href={`/collections/${col.slug}`}
                        className="group relative aspect-[4/5] overflow-hidden bg-charcoal"
                      >
                        {col.imageUrl && (
                          <img
                            src={col.imageUrl}
                            alt={col.name}
                            loading="lazy"
                            className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
                        <div className="absolute bottom-5 left-5 right-5 text-ivory">
                          <h3 className="font-serif text-2xl font-medium">{col.name}</h3>
                          {col.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-ivory/80">
                              {col.description}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            );

          case 'featured_products':
            return (
              <section key={section.id} className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-end justify-between">
                  <div>
                    <h2 className="font-serif text-3xl font-medium text-charcoal sm:text-4xl">
                      {section.title}
                    </h2>
                    {section.subtitle && (
                      <p className="mt-1 text-sm text-charcoal/65">{section.subtitle}</p>
                    )}
                  </div>
                  <Link href="/shop" className="text-xs font-semibold uppercase tracking-widest text-terracotta hover:underline">
                    Shop All
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
                  {data!.featuredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            );

          case 'promo_banner':
            if (!promo) return null;
            return (
              <section key={section.id} className="relative my-6 overflow-hidden bg-charcoal py-24 text-ivory">
                <img
                  src={promo.desktopImageUrl}
                  alt={promo.heading || 'Campaign'}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover opacity-50"
                />
                <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
                  <h2 className="font-serif text-4xl font-medium sm:text-5xl">
                    {promo.heading}
                  </h2>
                  {promo.subheading && (
                    <p className="mt-3 text-base text-ivory/90">{promo.subheading}</p>
                  )}
                  {promo.ctaText && (
                    <Link
                      href={promo.ctaLink || '/shop'}
                      className="mt-8 inline-block border border-ivory px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-ivory hover:bg-ivory hover:text-charcoal transition-colors"
                    >
                      {promo.ctaText}
                    </Link>
                  )}
                </div>
              </section>
            );

          case 'brand_story':
            return (
              <section key={section.id} className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terracotta">
                  {section.subtitle || 'Heritage'}
                </p>
                <h2 className="mt-2 font-serif text-3xl font-medium text-charcoal sm:text-4xl">
                  {section.title}
                </h2>
                <p className="mt-4 text-base leading-relaxed text-charcoal/80">
                  {section.configJson?.body ||
                    "Matina Clothing bridges centuries-old Nepali artistry and contemporary streetwear."}
                </p>
                <Link
                  href={section.configJson?.ctaLink || '/our-story'}
                  className="mt-7 inline-block border border-charcoal px-7 py-3 text-xs font-semibold uppercase tracking-widest text-charcoal hover:bg-charcoal hover:text-ivory transition-colors"
                >
                  {section.configJson?.ctaText || 'Read Our Story'}
                </Link>
              </section>
            );

          case 'instagram':
            return (
              <section key={section.id} className="border-t border-cream bg-stone/50 py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <div className="mb-8 flex flex-col items-center text-center">
                    <h2 className="font-serif text-3xl font-medium text-charcoal">
                      {section.title}
                    </h2>
                    <a
                      href="https://instagram.com/matina.clo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 text-sm font-medium text-terracotta hover:underline"
                    >
                      {section.subtitle || '@matina.clo'}
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {data!.instagramPosts.map((post) => (
                      <a
                        key={post.id}
                        href={post.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group aspect-square overflow-hidden bg-stone"
                      >
                        <img
                          src={post.mediaUrl}
                          alt={post.caption || 'Matina Instagram'}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
