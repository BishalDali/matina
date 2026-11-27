import { ShopCatalog } from '@/components/ShopCatalog';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  return (
    <ShopCatalog
      title={q ? `Search: "${q}"` : 'Search Products'}
      initialQuery={q}
    />
  );
}
