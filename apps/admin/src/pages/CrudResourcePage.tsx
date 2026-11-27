import React, { useEffect, useState, useCallback } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { adminFetch } from '../lib/api';
import { ImageUploader } from '../components/ImageUploader';

interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'checkbox' | 'select' | 'image';
  options?: string[];
  required?: boolean;
  recommendedSize?: string;
}

export function CrudResourcePage({
  title,
  endpoint,
  columns,
  createFields,
  allowCreate = true,
  allowEdit = true,
  allowDelete = false,
  toggleField,
  previewType,
}: {
  title: string;
  endpoint: string;
  columns: Array<{ key: string; label: string; isImage?: boolean }>;
  createFields?: FieldDef[];
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  toggleField?: { key: string; label: string };
  previewType?: 'tile' | 'instagram';
}) {
  const [rows, setRows] = useState<Array<Record<string, any>>>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    const data = await adminFetch<Array<Record<string, any>>>(endpoint);
    setRows(data);
  }, [endpoint]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm({});
    setShowModal(true);
  };

  const openEdit = (row: Record<string, any>) => {
    setEditingId(row.id);
    const initial: Record<string, any> = {};
    for (const f of createFields || []) {
      initial[f.key] = row[f.key] ?? '';
    }
    setForm(initial);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {};
    for (const f of createFields || []) {
      const val = form[f.key];
      if (editingId && f.key === 'password' && !val) continue;
      if (val !== undefined) {
        payload[f.key] = val === '' && !f.required ? null : val;
      }
    }

    if (editingId) {
      await adminFetch(`${endpoint}/${editingId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    } else {
      await adminFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    setForm({});
    setEditingId(null);
    setShowModal(false);
    load();
  };

  const handleDelete = async (id: string) => {
    await adminFetch(`${endpoint}/${id}`, { method: 'DELETE' });
    load();
  };

  const handleToggle = async (row: Record<string, any>) => {
    if (!toggleField) return;
    await adminFetch(`${endpoint}/${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ [toggleField.key]: !row[toggleField.key] }),
    });
    load();
  };

  const previewImage =
    form.imageUrl || form.mediaUrl || form.coverImageUrl || form.bannerUrl || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {allowCreate && createFields && (
          <button
            type="button"
            onClick={openCreate}
            className="bg-terracotta px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ivory"
          >
            + Add New
          </button>
        )}
      </div>

      <div className="overflow-x-auto border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              {columns.map((c) => (
                <th key={c.key} className="p-3">{c.label}</th>
              ))}
              {toggleField && <th className="p-3">{toggleField.label}</th>}
              {((allowEdit && createFields) || allowDelete) && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id || row.key || idx} className="border-b last:border-0">
                {columns.map((c) => (
                  <td key={c.key} className="p-3">
                    {c.isImage ? (
                      row[c.key] ? (
                        <img src={row[c.key]} alt="" className="h-10 w-10 object-cover bg-stone" />
                      ) : (
                        <span className="text-xs text-gray-400">No image</span>
                      )
                    ) : typeof row[c.key] === 'boolean' ? (
                      row[c.key] ? 'Yes' : 'No'
                    ) : typeof row[c.key] === 'object' && row[c.key] !== null ? (
                      JSON.stringify(row[c.key]).slice(0, 60)
                    ) : (
                      String(row[c.key] ?? '-')
                    )}
                  </td>
                ))}
                {toggleField && (
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => handleToggle(row)}
                      className="text-xs font-semibold text-terracotta hover:underline"
                    >
                      {row[toggleField.key] ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                )}
                {((allowEdit && createFields) || allowDelete) && (
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {allowEdit && createFields && row.id && (
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="flex items-center gap-1 text-xs font-medium text-charcoal hover:text-terracotta"
                        >
                          <Edit2 className="h-3.5 w-3.5" /> Edit
                        </button>
                      )}
                      {allowDelete && row.id && (
                        <button
                          type="button"
                          onClick={() => handleDelete(row.id)}
                          className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && createFields && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`max-h-[92vh] w-full overflow-y-auto bg-white p-6 shadow-xl ${previewType ? 'max-w-3xl' : 'max-w-md'}`}>
            <div className="flex justify-between border-b pb-2">
              <h2 className="text-lg font-semibold">
                {editingId ? `Edit ${title}` : `Add ${title}`}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-xs">Close</button>
            </div>

            <div className={`mt-4 grid gap-6 ${previewType ? 'md:grid-cols-2' : ''}`}>
              <form onSubmit={handleSave} className="space-y-4">
                {createFields.map((f) => (
                  <div key={f.key}>
                    {f.type === 'image' ? (
                      <ImageUploader
                        label={f.label}
                        required={f.required}
                        recommendedSize={f.recommendedSize}
                        value={form[f.key] ?? ''}
                        onChange={(url) => setForm({ ...form, [f.key]: url })}
                      />
                    ) : f.type === 'select' ? (
                      <>
                        <label className="block text-xs font-semibold uppercase">{f.label}</label>
                        <select
                          value={form[f.key] ?? f.options?.[0] ?? ''}
                          onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                          className="mt-1 w-full border px-3 py-2 text-sm"
                        >
                          {f.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        <label className="block text-xs font-semibold uppercase">{f.label}</label>
                        <input
                          type={f.type || 'text'}
                          required={editingId && f.key === 'password' ? false : f.required}
                          value={form[f.key] ?? ''}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                            })
                          }
                          className="mt-1 w-full border px-3 py-2 text-sm"
                        />
                      </>
                    )}
                  </div>
                ))}
                <button type="submit" className="w-full bg-terracotta py-2.5 text-xs font-semibold uppercase text-ivory">
                  {editingId ? 'Update' : 'Save'}
                </button>
              </form>

              {previewType && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Live Storefront Preview
                  </p>
                  <div className="border bg-ivory p-4">
                    <div className={`overflow-hidden bg-stone ${previewType === 'instagram' ? 'aspect-square' : 'aspect-[3/4]'}`}>
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">
                          Upload image to preview
                        </div>
                      )}
                    </div>
                    {(form.name || form.caption) && (
                      <p className="mt-2 text-center font-serif text-lg text-charcoal">
                        {form.name || form.caption}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
