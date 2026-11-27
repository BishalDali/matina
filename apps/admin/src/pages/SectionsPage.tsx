import React, { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '../lib/api';

interface SectionRow {
  id: string;
  sectionType: string;
  title: string;
  subtitle: string | null;
  configJson: Record<string, any>;
  displayOrder: number;
  isVisible: boolean;
}

export function SectionsPage() {
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [editing, setEditing] = useState<SectionRow | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [bodyText, setBodyText] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');

  const load = useCallback(async () => {
    const data = await adminFetch<SectionRow[]>('/admin/sections');
    setSections(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (s: SectionRow) => {
    setEditing(s);
    setTitle(s.title);
    setSubtitle(s.subtitle || '');
    setDisplayOrder(s.displayOrder);
    setBodyText(s.configJson?.body || '');
    setCtaText(s.configJson?.ctaText || '');
    setCtaLink(s.configJson?.ctaLink || '');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    await adminFetch(`/admin/sections/${editing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        title,
        subtitle: subtitle || null,
        displayOrder: Number(displayOrder),
        configJson: {
          ...editing.configJson,
          ...(bodyText ? { body: bodyText } : {}),
          ...(ctaText ? { ctaText } : {}),
          ...(ctaLink ? { ctaLink } : {}),
        },
      }),
    });
    setEditing(null);
    load();
  };

  const toggleVisibility = async (s: SectionRow) => {
    await adminFetch(`/admin/sections/${s.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isVisible: !s.isVisible }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Homepage Sections</h1>
        <p className="text-xs text-gray-500">
          Reorder, toggle visibility, edit headings, and preview section content before publishing.
        </p>
      </div>

      <div className="overflow-x-auto border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <th className="p-3">Order</th>
              <th className="p-3">Type</th>
              <th className="p-3">Title</th>
              <th className="p-3">Visibility</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{s.displayOrder}</td>
                <td className="p-3 text-xs uppercase text-gray-500">{s.sectionType}</td>
                <td className="p-3">
                  <p className="font-medium">{s.title}</p>
                  {s.subtitle && <p className="text-xs text-gray-500">{s.subtitle}</p>}
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => toggleVisibility(s)}
                    className={`px-2 py-0.5 text-xs font-semibold uppercase ${
                      s.isVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s.isVisible ? 'Visible' : 'Hidden'}
                  </button>
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="text-xs font-semibold text-terracotta hover:underline"
                  >
                    Edit &amp; Preview
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl bg-white p-6 shadow-xl">
            <div className="flex justify-between border-b pb-3">
              <h2 className="text-lg font-semibold">Edit Section: {editing.sectionType}</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-xs">Close</button>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <form onSubmit={handleSave} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase">Title</label>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase">Subtitle</label>
                  <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="mt-1 w-full border px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase">Display Order</label>
                  <input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} className="mt-1 w-full border px-3 py-2 text-sm" />
                </div>
                {editing.sectionType === 'brand_story' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold uppercase">Story Copy</label>
                      <textarea rows={3} value={bodyText} onChange={(e) => setBodyText(e.target.value)} className="mt-1 w-full border px-3 py-2 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="CTA Label" className="border px-3 py-2 text-xs" />
                      <input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} placeholder="CTA Link" className="border px-3 py-2 text-xs" />
                    </div>
                  </>
                )}
                <button type="submit" className="w-full bg-terracotta py-2.5 text-xs font-semibold uppercase text-ivory">
                  Save Section
                </button>
              </form>

              {/* Live Section Preview */}
              <div className="border bg-ivory p-6 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-terracotta">
                  Live Section Preview
                </p>
                <h3 className="mt-3 font-serif text-3xl text-charcoal">{title || 'Section Title'}</h3>
                {subtitle && <p className="mt-1 text-xs text-charcoal/70">{subtitle}</p>}
                {bodyText && <p className="mt-4 text-xs leading-relaxed text-charcoal/80">{bodyText}</p>}
                {ctaText && (
                  <span className="mt-5 inline-block border border-charcoal px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-charcoal">
                    {ctaText}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
