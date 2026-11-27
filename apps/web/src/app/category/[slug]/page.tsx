import { apiFetch } from '@/lib/api';
import { ShopCatalog } from '@/components/ShopCatalog';

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let category: { name: string; description?: string | null; bannerUrl?: string | null } = {
    name: slug.replace(/-/g, ' ').toUpperCase(),
  };

  try {
    category = await apiFetch(`/storefront/categories/${slug}`);
  } catch {
    // fallback title
  }

  return (
    <ShopCatalog
      title={category.name}
      description={category.description}
      bannerUrl={category.bannerUrl}
      fixedCategory={slug}
    />
  );
}
