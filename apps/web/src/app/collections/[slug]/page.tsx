import { apiFetch } from '@/lib/api';
import { ShopCatalog } from '@/components/ShopCatalog';

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let collection: { name: string; description?: string | null; bannerUrl?: string | null } = {
    name: slug.replace(/-/g, ' ').toUpperCase(),
  };

  try {
    collection = await apiFetch(`/storefront/collections/${slug}`);
  } catch {
    // fallback title
  }

  return (
    <ShopCatalog
      title={collection.name}
      description={collection.description}
      bannerUrl={collection.bannerUrl}
      fixedCollection={slug}
    />
  );
}
