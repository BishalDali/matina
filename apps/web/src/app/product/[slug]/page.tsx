import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { apiFetch } from '@/lib/api';
import { ProductDetailClient, ProductDetailData } from '@/components/ProductDetailClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await apiFetch<ProductDetailData & { seoTitle?: string; seoDescription?: string }>(
      `/storefront/products/${slug}`
    );
    return {
      title: product.seoTitle || `${product.name} | Matina Clothing`,
      description: product.seoDescription || product.shortDescription || undefined,
    };
  } catch {
    return { title: 'Product | Matina Clothing' };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let product: ProductDetailData | null = null;
  try {
    product = await apiFetch<ProductDetailData>(`/storefront/products/${slug}`);
  } catch {
    product = null;
  }

  if (!product) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    image: product.images.map((i) => i.url),
    sku: product.skuPrefix,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NPR',
      price: product.effectivePriceNpr,
      availability: product.variants.some((v) => v.availableQty > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
