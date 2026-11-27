import React, { useEffect, useState, useCallback } from 'react';
import { Monitor, Smartphone, Trash2, Edit2 } from 'lucide-react';
import { adminFetch } from '../lib/api';
import { ImageUploader } from '../components/ImageUploader';

interface BannerRow {
  id: string;
  placement: 'hero' | 'category' | 'promotion' | 'collection';
  desktopImageUrl: string;
  mobileImageUrl: string | null;
  heading: string | null;
  subheading: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  displayOrder: number;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
}

const emptyBanner = {
  placement: 'hero' as BannerRow['placement'],
  desktopImageUrl: '',
  mobileImageUrl: '',
  heading: 'CULTURE ON WEAR',
  subheading: "Contemporary streetwear inspired by Nepal's living heritage.",
  ctaText: 'SHOP COLLECTION',
  ctaLink: '/shop',
  displayOrder: 1,
  startsAt: '',
  endsAt: '',
  isActive: true,
};

export function BannersPage() {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyBanner);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  const load = useCallback(async () => {
    const data = await adminFetch<BannerRow[]>('/admin/banners');
    setBanners(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyBanner);
    setShowModal(true);
  };

  const openEdit = (b: BannerRow) => {
    setEditingId(b.id);
    setForm({
      placement: b.placement,
      desktopImageUrl: b.desktopImageUrl,
      mobileImageUrl: b.mobileImageUrl || '',
      heading: b.heading || '',
      subheading: b.subheading || '',
      ctaText: b.ctaText || '',
      ctaLink: b.ctaLink || '',
      displayOrder: b.displayOrder,
      startsAt: b.startsAt ? b.startsAt.slice(0, 16) : '',
      endsAt: b.endsAt ? b.endsAt.slice(0, 16) : '',
      isActive: b.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      placement: form.placement,
      desktopImageUrl: form.desktopImageUrl,
      mobileImageUrl: form.mobileImageUrl || null,
      heading: form.heading || null,
      subheading: form.subheading || null,
      ctaText: form.ctaText || null,
      ctaLink: form.ctaLink || null,
      displayOrder: Number(form.displayOrder) || 0,
      ...(form.startsAt ? { startsAt: new Date(form.startsAt).toISOString() } : {}),
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      isActive: form.isActive,
    };

    if (editingId) {
      await adminFetch(`/admin/banners/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } else {
      await adminFetch('/admin/banners', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await adminFetch(`/admin/banners/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleActive = async (b: BannerRow) => {
    await adminFetch(`/admin/banners/${b.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    load();
  };

  const previewImg =
    previewMode === 'mobile' && form.mobileImageUrl
      ? form.mobileImageUrl
      : form.desktopImageUrl;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Banners &amp; Sliders</h1>
          <p className="text-xs text-gray-500">
            Upload desktop &amp; mobile images, schedule campaigns, and preview before publishing.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-terracotta px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ivory"
        >
          + New Banner / Slide
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((b) => (
          <div key={b.id} className="border bg-white p-4 shadow-sm">
            <div className="relative h-44 overflow-hidden bg-charcoal">
              <img
                src={b.desktopImageUrl}
                alt={b.heading || 'Banner'}
                className="h-full w-full object-cover opacity-75"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent p-4 text-ivory">
                <span className="text-[10px] uppercase tracking-widest text-ivory/75">
                  {b.placement} &bull; Order {b.displayOrder}
                </span>
                <p className="font-serif text-xl">{b.heading || '(No heading)'}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => toggleActive(b)}
                className={`px-2 py-0.5 font-semibold uppercase ${
                  b.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {b.isActive ? 'Active' : 'Inactive'}
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => openEdit(b)}
                  className="flex items-center gap-1 font-medium text-charcoal hover:text-terracotta"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit &amp; Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  className="flex items-center gap-1 text-red-600 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Edit Banner & Live Preview' : 'Create Banner & Live Preview'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-xs">
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-8 lg:grid-cols-2">
              {/* Form */}
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase">Placement</label>
                    <select
                      value={form.placement}
                      onChange={(e) =>
                        setForm({ ...form, placement: e.target.value as BannerRow['placement'] })
                      }
                      className="mt-1 w-full border px-3 py-2 text-sm"
                    >
                      <option value="hero">Hero Slider</option>
                      <option value="promotion">Promotional Banner</option>
                      <option value="category">Category Banner</option>
                      <option value="collection">Collection Banner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase">Display Order</label>
                    <input
                      type="number"
                      value={form.displayOrder}
                      onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                      className="mt-1 w-full border px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <ImageUploader
                  label="Desktop Image"
                  required
                  recommendedSize="1800 × 900 px"
                  value={form.desktopImageUrl}
                  onChange={(url) => setForm({ ...form, desktopImageUrl: url })}
                />

                <ImageUploader
                  label="Mobile Image (Optional)"
                  recommendedSize="900 × 1200 px"
                  value={form.mobileImageUrl}
                  onChange={(url) => setForm({ ...form, mobileImageUrl: url })}
                />

                <div>
                  <label className="block text-xs font-semibold uppercase">Heading</label>
                  <input
                    value={form.heading}
                    onChange={(e) => setForm({ ...form, heading: e.target.value })}
                    className="mt-1 w-full border px-3 py-2 text-sm"
                    placeholder="CULTURE ON WEAR"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase">Subheading</label>
                  <input
                    value={form.subheading}
                    onChange={(e) => setForm({ ...form, subheading: e.target.value })}
                    className="mt-1 w-full border px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase">CTA Text</label>
                    <input
                      value={form.ctaText}
                      onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                      className="mt-1 w-full border px-3 py-2 text-sm"
                      placeholder="SHOP COLLECTION"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase">CTA Link</label>
                    <input
                      value={form.ctaLink}
                      onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                      className="mt-1 w-full border px-3 py-2 text-sm"
                      placeholder="/shop"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase">Start Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                      className="mt-1 w-full border px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase">End Date (Optional)</label>
                    <input
                      type="datetime-local"
                      value={form.endsAt}
                      onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                      className="mt-1 w-full border px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active / Published
                </label>

                <button
                  type="submit"
                  className="w-full bg-terracotta py-2.5 text-xs font-semibold uppercase tracking-widest text-ivory"
                >
                  Save Banner
                </button>
              </form>

              {/* Live Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Live Storefront Preview
                  </span>
                  <div className="flex border">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('desktop')}
                      className={`flex items-center gap-1 px-3 py-1 text-xs ${
                        previewMode === 'desktop' ? 'bg-charcoal text-ivory' : 'bg-white'
                      }`}
                    >
                      <Monitor className="h-3.5 w-3.5" /> Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('mobile')}
                      className={`flex items-center gap-1 px-3 py-1 text-xs ${
                        previewMode === 'mobile' ? 'bg-charcoal text-ivory' : 'bg-white'
                      }`}
                    >
                      <Smartphone className="h-3.5 w-3.5" /> Mobile
                    </button>
                  </div>
                </div>

                <div className="flex justify-center border bg-stone/40 p-4">
                  <div
                    className={`relative overflow-hidden bg-charcoal transition-all ${
                      previewMode === 'mobile' ? 'h-[420px] w-[240px]' : 'h-[320px] w-full'
                    }`}
                  >
                    {previewImg ? (
                      <img
                        src={previewImg}
                        alt="Live preview"
                        className="absolute inset-0 h-full w-full object-cover opacity-75"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-ivory/50">
                        Upload an image to preview
                      </div>
                    )}
                    <div
                      className={`relative z-10 flex h-full flex-col justify-end bg-gradient-to-t from-black/75 via-transparent to-transparent p-6 ${
                        form.placement === 'promotion' ? 'items-center justify-center text-center' : ''
                      }`}
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-ivory/80">
                        Matina Clothing
                      </p>
                      <h3
                        className={`mt-1 font-serif font-medium leading-tight text-ivory ${
                          previewMode === 'mobile' ? 'text-2xl' : 'text-3xl'
                        }`}
                      >
                        {form.heading || 'HEADING PREVIEW'}
                      </h3>
                      {form.subheading && (
                        <p className="mt-2 max-w-md text-xs text-ivory/90">{form.subheading}</p>
                      )}
                      {form.ctaText && (
                        <span className="mt-4 inline-block w-fit bg-terracotta px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ivory">
                          {form.ctaText}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
