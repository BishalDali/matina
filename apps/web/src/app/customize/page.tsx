'use client';

import React, { useEffect, useState } from 'react';
import {
  Upload,
  RotateCw,
  CheckCircle2,
  Plus,
  Trash2,
  AlignCenter,
  FlipHorizontal,
  Eye,
  EyeOff,
} from 'lucide-react';
import { formatNPR } from '@matina/shared';
import { apiFetch, API_URL } from '@/lib/api';
import {
  GarmentMockupSvg,
  ArtworkLayer,
  TextLayer,
} from '@/components/GarmentMockupSvg';

interface ColorOption {
  name: string;
  hex: string;
}

interface CustomTemplate {
  id: string;
  name: string;
  slug: string;
  garmentType: string;
  description: string | null;
  basePriceNpr: number;
  availableSizes: string[];
  availableColors: ColorOption[];
}

export default function CustomizePage() {
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CustomTemplate | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorOption>({
    name: 'Charcoal Black',
    hex: '#1C1917',
  });
  const [size, setSize] = useState('L');
  const [quantity, setQuantity] = useState(1);
  const [placement, setPlacement] = useState<'front' | 'back'>('front');
  const [showGuide, setShowGuide] = useState(true);

  // Dynamic layers
  const [artwork, setArtwork] = useState<ArtworkLayer | null>(null);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Checkout / request fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedRequestNumber, setSubmittedRequestNumber] = useState('');

  useEffect(() => {
    apiFetch<CustomTemplate[]>('/custom-wear/templates')
      .then((list) => {
        setTemplates(list);
        if (list[0]) {
          setSelectedTemplate(list[0]);
          if (list[0].availableColors?.[0]) setSelectedColor(list[0].availableColors[0]);
          if (list[0].availableSizes?.[0]) setSize(list[0].availableSizes[2] || list[0].availableSizes[0]);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectTemplate = (tpl: CustomTemplate) => {
    setSelectedTemplate(tpl);
    if (tpl.availableColors?.[0]) setSelectedColor(tpl.availableColors[0]);
    if (tpl.availableSizes?.[0]) setSize(tpl.availableSizes[2] || tpl.availableSizes[0]);
  };

  const handleUploadDesign = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API_URL}/custom-wear/upload`, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Upload failed');
      }
      const data = (await res.json()) as { url: string };
      setArtwork({
        url: data.url,
        x: 0,
        y: -10,
        scale: 1,
        rotation: 0,
        opacity: 1,
        flipX: false,
      });
      setSelectedLayerId('artwork');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addTextLayer = () => {
    const id = `txt-${Date.now()}`;
    const next: TextLayer = {
      id,
      text: 'MATINA',
      x: 0,
      y: artwork ? 70 : 0,
      scale: 1,
      rotation: 0,
      color: selectedColor.hex === '#FAF7F2' || selectedColor.hex === '#E7E0D3' ? '#1C1917' : '#FAF7F2',
      fontFamily: 'serif',
      fontSize: 18,
    };
    setTextLayers((prev) => [...prev, next]);
    setSelectedLayerId(id);
  };

  const handleMoveLayer = (id: string, x: number, y: number) => {
    if (id === 'artwork' && artwork) {
      setArtwork({ ...artwork, x, y });
    } else {
      setTextLayers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, x, y } : l))
      );
    }
  };

  const handleResizeLayer = (id: string, nextScale: number) => {
    if (id === 'artwork' && artwork) {
      setArtwork({ ...artwork, scale: nextScale });
    } else {
      setTextLayers((prev) =>
        prev.map((l) => (l.id === id ? { ...l, scale: nextScale } : l))
      );
    }
  };

  const activeTextLayer = textLayers.find((l) => l.id === selectedLayerId) || null;
  const isArtworkSelected = selectedLayerId === 'artwork' && artwork !== null;

  const updateActiveText = (patch: Partial<TextLayer>) => {
    if (!activeTextLayer) return;
    setTextLayers((prev) =>
      prev.map((l) => (l.id === activeTextLayer.id ? { ...l, ...patch } : l))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    if (!artwork && textLayers.length === 0) {
      setError('Please upload an artwork image or add at least one text layer.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiFetch<{ requestNumber: string }>('/custom-wear/requests', {
        method: 'POST',
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          colourName: selectedColor.name,
          colourHex: selectedColor.hex,
          size,
          quantity,
          placement,
          designImageUrl: artwork?.url || null,
          customText: textLayers.map((t) => t.text).join(' / ') || null,
          designConfig: {
            x: artwork?.x ?? textLayers[0]?.x ?? 0,
            y: artwork?.y ?? textLayers[0]?.y ?? 0,
            scale: artwork?.scale ?? textLayers[0]?.scale ?? 1,
            rotation: artwork?.rotation ?? textLayers[0]?.rotation ?? 0,
            textColor: textLayers[0]?.color ?? '#FAF7F2',
            artwork,
            textLayers,
          },
          customerName,
          phone,
          email,
          deliveryAddress,
          notes,
        }),
      });
      setSubmittedRequestNumber(res.requestNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit custom request');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedRequestNumber) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-terracotta" />
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.25em] text-terracotta">
          Custom Design Submitted
        </p>
        <h1 className="mt-2 font-serif text-4xl font-medium text-charcoal">
          We&apos;ve received your custom wear design
        </h1>
        <p className="mt-3 text-sm text-charcoal/75">
          Our studio team will review your artwork and confirm production via phone.
        </p>
        <div className="mt-6 border border-cream bg-stone/60 p-5">
          <p className="text-xs uppercase tracking-widest text-charcoal/60">Request Number</p>
          <p className="mt-1 font-serif text-3xl font-semibold">{submittedRequestNumber}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSubmittedRequestNumber('');
            setArtwork(null);
            setTextLayers([]);
          }}
          className="mt-8 bg-terracotta px-8 py-3 text-xs font-semibold uppercase tracking-widest text-ivory"
        >
          Design Another Piece
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-cream pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terracotta">
          Matina Studio
        </p>
        <h1 className="mt-1 font-serif text-4xl font-medium text-charcoal">
          Customize Your Wear
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-charcoal/70">
          Choose your garment, pick any colour, upload artwork, add custom text layers, and drag directly on the garment to position your design.
        </p>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        {/* Interactive Drag-and-Drop SVG Studio */}
        <div className="lg:col-span-6">
          <div className="sticky top-24 border border-cream bg-stone/50 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex border border-cream bg-ivory">
                <button
                  type="button"
                  onClick={() => setPlacement('front')}
                  className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${
                    placement === 'front' ? 'bg-charcoal text-ivory' : 'text-charcoal'
                  }`}
                >
                  Front View
                </button>
                <button
                  type="button"
                  onClick={() => setPlacement('back')}
                  className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${
                    placement === 'back' ? 'bg-charcoal text-ivory' : 'text-charcoal'
                  }`}
                >
                  Back View
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowGuide((g) => !g)}
                  className="flex items-center gap-1 text-xs text-charcoal/70 hover:text-terracotta"
                >
                  {showGuide ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {showGuide ? 'Hide Guide' : 'Show Guide'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isArtworkSelected && artwork) setArtwork({ ...artwork, x: 0, y: 0 });
                    if (activeTextLayer) updateActiveText({ x: 0, y: 0 });
                  }}
                  className="flex items-center gap-1 text-xs text-charcoal/70 hover:text-terracotta"
                >
                  <AlignCenter className="h-3.5 w-3.5" /> Center
                </button>
              </div>
            </div>

            <div className="mx-auto aspect-[5/6] max-w-md bg-gradient-to-b from-ivory to-stone/60 p-3">
              <GarmentMockupSvg
                garmentType={selectedTemplate?.garmentType || 'tshirt'}
                colorHex={selectedColor.hex}
                placement={placement}
                designConfig={{
                  artwork: artwork || undefined,
                  textLayers,
                }}
                showPrintGuide={showGuide}
                interactive
                selectedLayerId={selectedLayerId}
                onSelectLayer={setSelectedLayerId}
                onMoveLayer={handleMoveLayer}
                onResizeLayer={handleResizeLayer}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-charcoal/70">
              <span>Tip: Drag artwork to move, or drag the corner handle to resize</span>
              <span className="font-semibold text-charcoal">
                {selectedTemplate ? formatNPR(selectedTemplate.basePriceNpr * quantity) : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Studio Controls */}
        <div className="space-y-6 lg:col-span-6">
          {/* 1. Silhouette */}
          <div className="border border-cream bg-ivory p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-charcoal">
              1. Choose Garment Silhouette
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`border p-3 text-left transition-colors ${
                    selectedTemplate?.id === tpl.id
                      ? 'border-terracotta bg-stone/70'
                      : 'border-cream bg-ivory hover:border-charcoal'
                  }`}
                >
                  <p className="font-serif text-lg font-medium">{tpl.name}</p>
                  <p className="mt-1 text-xs font-semibold text-terracotta">
                    {formatNPR(tpl.basePriceNpr)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Colour & Size */}
          <div className="border border-cream bg-ivory p-5 space-y-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-charcoal">
                2. Garment Colour ({selectedColor.name})
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2.5">
                {(selectedTemplate?.availableColors || []).map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`flex items-center gap-2 border px-3 py-1.5 text-xs ${
                      selectedColor.hex === c.hex
                        ? 'border-charcoal bg-stone font-semibold'
                        : 'border-cream'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-charcoal/20"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name}
                  </button>
                ))}
                <label className="flex items-center gap-1.5 border border-cream px-2.5 py-1 text-xs">
                  Custom:
                  <input
                    type="color"
                    value={selectedColor.hex}
                    onChange={(e) =>
                      setSelectedColor({ name: `Custom (${e.target.value})`, hex: e.target.value })
                    }
                    className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider">Size</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(selectedTemplate?.availableSizes || ['S', 'M', 'L', 'XL']).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`border px-3 py-1.5 text-xs ${
                        size === s ? 'border-charcoal bg-charcoal text-ivory' : 'border-cream'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider">Quantity</p>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="mt-2 w-24 border border-cream bg-ivory px-3 py-1.5 text-sm"
                />
              </div>
            </div>
          </div>

          {/* 3. Dynamic Design Layers */}
          <div className="border border-cream bg-ivory p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-charcoal">
                3. Design Layers (Upload &amp; Text)
              </h2>
              <div className="flex gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 bg-charcoal px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ivory hover:bg-terracotta">
                  <Upload className="h-3.5 w-3.5" />
                  {uploading ? 'Uploading...' : artwork ? 'Replace Artwork (Max 50MB)' : 'Upload Artwork (Max 50MB)'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleUploadDesign}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={addTextLayer}
                  className="inline-flex items-center gap-1 border border-charcoal px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-stone"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Text
                </button>
              </div>
            </div>

            {/* Layer Pills */}
            {(artwork || textLayers.length > 0) && (
              <div className="flex flex-wrap gap-2 border-t border-cream pt-3">
                {artwork && (
                  <button
                    type="button"
                    onClick={() => setSelectedLayerId('artwork')}
                    className={`flex items-center gap-2 border px-3 py-1 text-xs ${
                      selectedLayerId === 'artwork' ? 'border-terracotta bg-stone font-semibold' : 'border-cream'
                    }`}
                  >
                    Artwork Image
                  </button>
                )}
                {textLayers.map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedLayerId(t.id)}
                    className={`flex items-center gap-2 border px-3 py-1 text-xs ${
                      selectedLayerId === t.id ? 'border-terracotta bg-stone font-semibold' : 'border-cream'
                    }`}
                  >
                    Text #{idx + 1}: {t.text.slice(0, 12)}
                  </button>
                ))}
              </div>
            )}

            {/* Active Artwork Controls */}
            {isArtworkSelected && artwork && (
              <div className="space-y-3 border border-cream bg-stone/30 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold uppercase">Artwork Controls</span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setArtwork({ ...artwork, flipX: !artwork.flipX })}
                      className="flex items-center gap-1 hover:text-terracotta"
                    >
                      <FlipHorizontal className="h-3.5 w-3.5" /> Flip
                    </button>
                    <button
                      type="button"
                      onClick={() => setArtwork({ ...artwork, x: 0, y: 0, scale: 1, rotation: 0 })}
                      className="flex items-center gap-1 hover:text-terracotta"
                    >
                      <RotateCw className="h-3.5 w-3.5" /> Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => { setArtwork(null); setSelectedLayerId(textLayers[0]?.id || null); }}
                      className="flex items-center gap-1 text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    Scale ({artwork.scale.toFixed(1)}x)
                    <input type="range" min={0.3} max={1.8} step={0.05} value={artwork.scale} onChange={(e) => setArtwork({ ...artwork, scale: Number(e.target.value) })} className="w-full" />
                  </label>
                  <label>
                    Rotation ({artwork.rotation}&deg;)
                    <input type="range" min={-180} max={180} value={artwork.rotation} onChange={(e) => setArtwork({ ...artwork, rotation: Number(e.target.value) })} className="w-full" />
                  </label>
                  <label className="col-span-2">
                    Opacity ({Math.round(artwork.opacity * 100)}%)
                    <input type="range" min={0.2} max={1} step={0.05} value={artwork.opacity} onChange={(e) => setArtwork({ ...artwork, opacity: Number(e.target.value) })} className="w-full" />
                  </label>
                </div>
              </div>
            )}

            {/* Active Text Layer Controls */}
            {activeTextLayer && (
              <div className="space-y-3 border border-cream bg-stone/30 p-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold uppercase">Text Layer Controls</span>
                  <button
                    type="button"
                    onClick={() => {
                      setTextLayers((prev) => prev.filter((l) => l.id !== activeTextLayer.id));
                      setSelectedLayerId(artwork ? 'artwork' : null);
                    }}
                    className="flex items-center gap-1 text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Text
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={activeTextLayer.text}
                    onChange={(e) => updateActiveText({ text: e.target.value })}
                    placeholder="Enter text..."
                    className="col-span-2 border border-cream bg-ivory px-3 py-1.5 text-sm"
                  />
                  <select
                    value={activeTextLayer.fontFamily}
                    onChange={(e) => updateActiveText({ fontFamily: e.target.value as TextLayer['fontFamily'] })}
                    className="border border-cream bg-ivory px-2.5 py-1.5 text-xs"
                  >
                    <option value="serif">Editorial Serif</option>
                    <option value="sans">Modern Sans</option>
                    <option value="mono">Street Mono</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <span>Colour:</span>
                    <input
                      type="color"
                      value={activeTextLayer.color}
                      onChange={(e) => updateActiveText({ color: e.target.value })}
                      className="h-7 w-12 cursor-pointer border border-cream p-0.5"
                    />
                  </div>
                  <label>
                    Size ({activeTextLayer.fontSize}px)
                    <input type="range" min={10} max={36} value={activeTextLayer.fontSize} onChange={(e) => updateActiveText({ fontSize: Number(e.target.value) })} className="w-full" />
                  </label>
                  <label>
                    Rotation ({activeTextLayer.rotation}&deg;)
                    <input type="range" min={-180} max={180} value={activeTextLayer.rotation} onChange={(e) => updateActiveText({ rotation: Number(e.target.value) })} className="w-full" />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 4. Submit Request */}
          <form onSubmit={handleSubmit} className="border border-cream bg-stone/40 p-5 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-charcoal">
              4. Submit Custom Order Request (COD)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full Name *" className="border border-cream bg-ivory px-3 py-2 text-sm" />
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Mobile (98XXXXXXXX) *" className="border border-cream bg-ivory px-3 py-2 text-sm" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (Optional)" className="border border-cream bg-ivory px-3 py-2 text-sm sm:col-span-2" />
              <input required value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="Full Delivery Address (District, Municipality, Tole) *" className="border border-cream bg-ivory px-3 py-2 text-sm sm:col-span-2" />
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Print instructions / notes (optional)" className="border border-cream bg-ivory px-3 py-2 text-sm sm:col-span-2" />
            </div>

            {error && <p className="text-xs text-red-700">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-terracotta py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-ivory hover:bg-maroon disabled:opacity-50"
            >
              {submitting
                ? 'Submitting...'
                : `Submit Custom Request (${selectedTemplate ? formatNPR(selectedTemplate.basePriceNpr * quantity) : ''})`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
