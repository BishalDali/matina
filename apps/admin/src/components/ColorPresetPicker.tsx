import { useEffect, useState, useCallback } from 'react';
import { Check, Edit2, Plus, Trash2 } from 'lucide-react';
import { adminFetch } from '../lib/api';

export interface ColorPreset {
  id: string;
  name: string;
  hex: string;
}

export function ColorPresetPicker({
  selectedName,
  selectedHex,
  onSelect,
}: {
  selectedName: string;
  selectedHex: string;
  onSelect: (name: string, hex: string) => void;
}) {
  const [presets, setPresets] = useState<ColorPreset[]>([]);
  const [editingPreset, setEditingPreset] = useState<ColorPreset | null>(null);
  const [showManage, setShowManage] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetHex, setPresetHex] = useState('#1C1917');

  const load = useCallback(async () => {
    const data = await adminFetch<ColorPreset[]>('/admin/color-presets');
    setPresets(data);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    if (editingPreset) {
      const updated = await adminFetch<ColorPreset>(`/admin/color-presets/${editingPreset.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: presetName, hex: presetHex }),
      });
      onSelect(updated.name, updated.hex);
    } else {
      const created = await adminFetch<ColorPreset>('/admin/color-presets', {
        method: 'POST',
        body: JSON.stringify({ name: presetName, hex: presetHex }),
      });
      onSelect(created.name, created.hex);
    }
    setPresetName('');
    setEditingPreset(null);
    setShowManage(false);
    load();
  };

  const handleDeletePreset = async (id: string) => {
    await adminFetch(`/admin/color-presets/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="space-y-2 border border-stone bg-stone/20 p-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">
          Color Presets (Click to Select)
        </span>
        <button
          type="button"
          onClick={() => {
            setEditingPreset(null);
            setPresetName(selectedName || '');
            setPresetHex(selectedHex || '#1C1917');
            setShowManage((s) => !s);
          }}
          className="flex items-center gap-1 text-[11px] font-semibold text-terracotta hover:underline"
        >
          <Plus className="h-3 w-3" /> {showManage ? 'Close' : 'New / Edit Preset'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const isSelected = p.name.toLowerCase() === selectedName.toLowerCase();
          return (
            <div key={p.id} className="group flex items-center border bg-white">
              <button
                type="button"
                onClick={() => onSelect(p.name, p.hex)}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs ${
                  isSelected ? 'bg-stone font-semibold' : 'hover:bg-stone/40'
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full border border-charcoal/20"
                  style={{ backgroundColor: p.hex }}
                />
                {p.name}
                {isSelected && <Check className="h-3 w-3 text-terracotta" />}
              </button>
              {showManage && (
                <div className="flex items-center border-l px-1 gap-1">
                  <button
                    type="button"
                    title="Edit preset"
                    onClick={() => {
                      setEditingPreset(p);
                      setPresetName(p.name);
                      setPresetHex(p.hex);
                    }}
                    className="p-0.5 text-gray-500 hover:text-charcoal"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    title="Delete preset"
                    onClick={() => handleDeletePreset(p.id)}
                    className="p-0.5 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showManage && (
        <div className="flex flex-wrap items-center gap-2 border-t border-stone pt-2">
          <input
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name (e.g. Maroon)"
            className="flex-1 border bg-white px-2.5 py-1 text-xs"
          />
          <input
            type="color"
            value={presetHex}
            onChange={(e) => setPresetHex(e.target.value)}
            className="h-7 w-9 cursor-pointer border bg-white p-0.5"
          />
          <button
            type="button"
            onClick={handleSavePreset}
            className="bg-charcoal px-3 py-1 text-xs font-semibold text-ivory hover:bg-terracotta"
          >
            {editingPreset ? 'Update Preset' : 'Save Preset'}
          </button>
        </div>
      )}
    </div>
  );
}
