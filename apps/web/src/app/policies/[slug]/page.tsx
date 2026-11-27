import { apiFetch } from '@/lib/api';

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let page: { title: string; contentJson?: { body?: string } } | null = null;
  try {
    page = await apiFetch(`/storefront/pages/${slug}`);
  } catch {
    page = null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-4xl font-medium text-charcoal">
        {page?.title || slug.replace(/-/g, ' ').toUpperCase()}
      </h1>
      <p className="mt-6 text-sm leading-relaxed text-charcoal/85">
        {page?.contentJson?.body || 'Policy details can be managed from the Admin Dashboard.'}
      </p>
    </div>
  );
}
