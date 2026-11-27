import { apiFetch } from '@/lib/api';

export default async function FaqPage() {
  let page: { title: string; contentJson?: { body?: string } } | null = null;
  try {
    page = await apiFetch('/storefront/pages/faq');
  } catch {
    page = null;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-serif text-4xl font-medium text-charcoal">
        {page?.title || 'FAQ & Shipping'}
      </h1>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-charcoal/85">
        <p>
          {page?.contentJson?.body ||
            'We deliver across all 77 districts of Nepal with Cash on Delivery (COD). Kathmandu Valley orders arrive within 1–2 business days; outside valley orders arrive within 3–5 business days.'}
        </p>
        <div className="border-t border-cream pt-6">
          <h2 className="font-serif text-xl">Size Exchanges</h2>
          <p className="mt-2 text-charcoal/75">
            Unused items with original tags may be exchanged within 7 days of delivery.
          </p>
        </div>
      </div>
    </div>
  );
}
