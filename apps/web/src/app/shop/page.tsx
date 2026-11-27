import { ShopCatalog } from '@/components/ShopCatalog';

export const metadata = {
  title: 'Shop All | Matina Clothing',
};

export default function ShopPage() {
  return (
    <ShopCatalog
      title="Shop All"
      description="Explore contemporary Nepali cultural streetwear crafted in limited batches."
    />
  );
}
