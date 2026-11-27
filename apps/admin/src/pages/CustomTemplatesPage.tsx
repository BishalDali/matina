import React, { useEffect, useState, useCallback } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { formatNPR } from '@matina/shared';
import { adminFetch } from '../lib/api';
import { ImageUploader } from '../components/ImageUploader';

interface ColorMockup {
  name: string;
  hex: string;
  frontMockupUrl?: string;
  backMockupUrl?: string;
}

interface CustomTemplateRow {
  id: string;
  name: string;
  slug: string;
  garmentType: 'tshirt' | 'sweatshirt' | 'hoodie';
  description: string | null;
  basePriceNpr: number;
  availableColors: ColorMockup[];
  isActive: boolean;
  displayOrder: number;
}

export function CustomTemplatesPage() {
  const [templates, setTemplates] = useState<CustomTemplateRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [garmentType, setGarmentType] = useState<'tshirt' | 'sweatshirt' | 'hoodie'>('hoodie');
  const [basePriceNpr, setBasePriceNpr] = useState(4999);
  const [description, setDescription] = useState('');
  const [colors, setColors] = useState<ColorMockup[]>([
    { name: 'Charcoal Black', hex: '#1C1917', frontMockupUrl: '', backMockupUrl: '' },
  ]);

  const load = useCallback(async () => {
    const data = await adminFetch<CustomTemplateRow[]>('/admin/custom-templates');
    setTemplates(data);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setSlug('');
    setGarmentType('hoodie');
    setBasePriceNpr(4999);
    setDescription('');
    setColors([{ name: 'Charcoal Black', hex: '#1C1917', frontMockupUrl: '', backMockupUrl: '' }]);
    setShowModal(true);
  };

  const openEdit = (t: CustomTemplateRow) => {
    setEditingId(t.id);
    setName(t.name);
    setSlug(t.slug);
    setGarmentType(t.garmentType);
    setBasePriceNpr(t.basePriceNpr);
    setDescription(t.description || '');
    setColors(
      Array.isArray(t.availableColors) && t.availableColors.length > 0
        ? t.availableColors.map((c) => ({
            name: c.name,
            hex: c.hex,
            frontMockupUrl: c.frontMockupUrl || '',
            backMockupUrl: c.backMockupUrl || '',
          }))
        : [{ name: 'Charcoal Black', hex: '#1C1917', frontMockupUrl: '', backMockupUrl: '' }]
    );
    setShowModal(true);
  };

  const updateColor = (idx: number, patch: Partial<ColorMockup>) => {
    setColors((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const addColor = () => {
    setColors((prev) => [
      ...prev,
      { name: 'New Colour', hex: '#8B3A2B', frontMockupUrl: '', backMockupUrl: '' },
    ]);
  };

  const removeColor = (idx: number) => {
    setColors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      garmentType,
      basePriceNpr: Number(basePriceNpr),
      description: description || null,
      availableColors: colors.map((c) => ({
        name: c.name,
        hex: c.hex,
        ...(c.frontMockupUrl ? { frontMockupUrl: c.frontMockupUrl } : {}),
        ...(c.backMockupUrl ? { backMockupUrl: c.backMockupUrl } : {}),
      })),
    };

    if (editingId) {
      await adminFetch(`/admin/custom-templates/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } else {
      await adminFetch('/admin/custom-templates', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    setShowModal(false);
    load();
  };

  const toggleActive = async (t: CustomTemplateRow) => {
    await adminFetch(`/admin/custom-templates/${t.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !t.isActive }),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Custom Wear Mockups</h1>
          <p className="text-xs text-gray-500">
            Upload Front &amp; Back PNG mockups for each colour of your T-Shirts, Sweatshirts, and Hoodies.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-terracotta px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ivory"
        >
          + New Template
        </button>
      </div>

      <div className="overflow-x-auto border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <th className="p-3">Template</th>
              <th className="p-3">Type</th>
              <th className="p-3">Base Price</th>
              <th className="p-3">Colours &amp; PNG Mockups</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3 text-xs uppercase">{t.garmentType}</td>
                <td className="p-3">{formatNPR(t.basePriceNpr)}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {(t.availableColors || []).map((c, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 border bg-stone/30 px-2 py-0.5 text-xs">
                        <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: c.hex }} />
                        <span>{c.name}</span>
                        {c.frontMockupUrl && (
                          <span className="text-[10px] font-semibold text-emerald-700">PNG</span>
                        )}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(t)}
                    className={`px-2 py-0.5 text-xs font-semibold uppercase ${
                      t.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {t.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    onClick={() => openEdit(t)}
                    className="flex items-center gap-1 text-xs font-semibold text-terracotta hover:underline"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit Colours &amp; Mockups
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-semibold">
                {editingId ? `Edit ${name}` : 'New Custom Wear Template'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-xs">Close</button>
            </div>

            <form onSubmit={handleSave} className="mt-5 space-y-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Template Name"
                  className="border px-3 py-2 text-sm sm:col-span-2"
                />
                <select
                  value={garmentType}
                  onChange={(e) => setGarmentType(e.target.value as CustomTemplateRow['garmentType'])}
                  className="border px-3 py-2 text-sm"
                >
                  <option value="tshirt">T-Shirt</option>
                  <option value="sweatshirt">Sweatshirt</option>
                  <option value="hoodie">Hoodie</option>
                </select>
                <input
                  type="number"
                  required
                  value={basePriceNpr}
                  onChange={(e) => setBasePriceNpr(Number(e.target.value))}
                  placeholder="Price (NPR)"
                  className="border px-3 py-2 text-sm"
                />
              </div>

              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description..."
                className="w-full border px-3 py-2 text-sm"
              />

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider">
                    Colour Variants &amp; Per-Colour PNG Mockups
                  </p>
                  <button
                    type="button"
                    onClick={addColor}
                    className="flex items-center gap-1 border border-charcoal px-3 py-1 text-xs font-semibold hover:bg-stone/40"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Colour
                  </button>
                </div>

                {colors.map((c, idx) => (
                  <div key={idx} className="space-y-3 border border-stone bg-stone/20 p-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        required
                        value={c.name}
                        onChange={(e) => updateColor(idx, { name: e.target.value })}
                        placeholder="Colour Name (e.g. Charcoal Black)"
                        className="flex-1 border bg-white px-3 py-1.5 text-sm"
                      />
                      <label className="flex items-center gap-2 text-xs">
                        Swatch:
                        <input
                          type="color"
                          value={c.hex}
                          onChange={(e) => updateColor(idx, { hex: e.target.value })}
                          className="h-8 w-10 cursor-pointer border p-0.5"
                        />
                        <span className="font-mono text-[11px]">{c.hex}</span>
                      </label>
                      {colors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeColor(idx)}
                          className="flex items-center gap-1 text-xs text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <ImageUploader
                        label={`${c.name} — Front Mockup (PNG)`}
                        recommendedSize="900 × 1100 px transparent PNG"
                        value={c.frontMockupUrl || ''}
                        onChange={(url) => updateColor(idx, { frontMockupUrl: url })}
                      />
                      <ImageUploader
                        label={`${c.name} — Back Mockup (PNG)`}
                        recommendedSize="900 × 1100 px transparent PNG"
                        value={c.backMockupUrl || ''}
                        onChange={(url) => updateColor(idx, { backMockupUrl: url })}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-terracotta py-3 text-xs font-semibold uppercase tracking-widest text-ivory"
              >
                Save Template &amp; Mockups
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
