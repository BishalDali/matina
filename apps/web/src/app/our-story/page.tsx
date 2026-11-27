import { apiFetch } from '@/lib/api';

async function loadPage(slug: string) {
  try {
    return await apiFetch<{ title: string; excerpt?: string; contentJson?: { body?: string } }>(
      `/storefront/pages/${slug}`
    );
  } catch {
    return null;
  }
}

export default async function OurStoryPage() {
  const page = await loadPage('our-story');
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terracotta">Heritage</p>
      <h1 className="mt-2 font-serif text-4xl font-medium text-charcoal">
        {page?.title || 'Our Story'}
      </h1>
      {page?.excerpt && <p className="mt-4 text-lg text-charcoal/75">{page.excerpt}</p>}
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-charcoal/85">
        <p>
          {page?.contentJson?.body ||
            "Matina Clothing was born in the Kathmandu Valley to celebrate Nepal's living culture through contemporary streetwear."}
        </p>
      </div>
    </div>
  );
}
