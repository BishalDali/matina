import React, { useEffect, useState, useCallback } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { formatNPR, calculateDiscountPercent } from '@matina/shared';
import { adminFetch } from '../lib/api';
import { ImageUploader } from '../components/ImageUploader';
import { ColorPresetPicker } from '../components/ColorPresetPicker';

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  skuPrefix: string;
  shortDescription: string | null;
  fullDescription: string | null;
  fabricCare: string | null;
  basePriceNpr: number;
  status: 'draft' | 'published' | 'archived';
  category: { id: string; name: string };
  collections: Array<{ collection: { id: string; name: string } }>;
  images: Array<{ id: string; url: string; imageType: string }>;
  variants: Array<{ id: string; sku: string; colourName: string; colourHex: string; size: string; inventory: { availableQty: number } | null }>;
  offers: Array<{ id: string; offerPriceNpr: number; isActive: boolean }>;
}

export function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [collections, setCollections] = useState<Array<{ id: string; name: string }>>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [skuPrefix, setSkuPrefix] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [basePriceNpr, setBasePriceNpr] = useState(2999);
  const [offerPriceNpr, setOfferPriceNpr] = useState<number | ''>('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [fabricCare, setFabricCare] = useState('');
  const [images, setImages] = useState<string[]>(['']);

  // New variant fields (for initial create or adding variant while editing)
  const [variantColour, setVariantColour] = useState('Charcoal Black');
  const [variantColourHex, setVariantColourHex] = useState('#1C1917');
  const [variantSize, setVariantSize] = useState('L');
  const [initialQty, setInitialQty] = useState(10);

  const load = useCallback(async () => {
    const [p, c, cols] = await Promise.all([
      adminFetch<ProductRow[]>('/admin/products'),
      adminFetch<Array<{ id: string; name: string }>>('/admin/categories'),
      adminFetch<Array<{ id: string; name: string }>>('/admin/collections'),
    ]);
    setProducts(p);
    setCategories(c);
    setCollections(cols);
    if (c[0] && !categoryId) setCategoryId(c[0].id);
  }, [categoryId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditingProduct(null);
    setName('');
    setSlug('');
    setSkuPrefix('');
    setCategoryId(categories[0]?.id || '');
    setSelectedCollections([]);
    setBasePriceNpr(2999);
    setOfferPriceNpr('');
    setShortDescription('');
    setFullDescription('');
    setFabricCare('');
    setImages(['']);
    setShowModal(true);
  };

  const openEdit = (p: ProductRow) => {
    setEditingProduct(p);
    setName(p.name);
    setSlug(p.slug);
    setSkuPrefix(p.skuPrefix);
    setCategoryId(p.category.id);
    setSelectedCollections(p.collections.map((c) => c.collection.id));
    setBasePriceNpr(p.basePriceNpr);
    const activeOffer = p.offers.find((o) => o.isActive);
    setOfferPriceNpr(activeOffer ? activeOffer.offerPriceNpr : '');
    setShortDescription(p.shortDescription || '');
    setFullDescription(p.fullDescription || '');
    setFabricCare(p.fabricCare || '');
    setImages(p.images.length > 0 ? p.images.map((i) => i.url) : ['']);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const validImages = images.filter(Boolean).map((url, idx) => ({
      url,
      altText: name,
      imageType: idx === 0 ? 'front' : 'lifestyle',
      displayOrder: idx,
    }));

    if (editingProduct) {
      await adminFetch(`/admin/products/${editingProduct.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          skuPrefix,
          categoryId,
          collectionIds: selectedCollections,
          shortDescription,
          fullDescription,
          fabricCare,
          basePriceNpr: Number(basePriceNpr),
          images: validImages,
        }),
      });
    } else {
      const created = await adminFetch<{ id: string }>('/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name,
          slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          skuPrefix,
          categoryId,
          collectionIds: selectedCollections,
          shortDescription,
          fullDescription,
          fabricCare,
          basePriceNpr: Number(basePriceNpr),
          status: 'published',
          images: validImages,
          variants: [
            {
              colourName: variantColour,
              colourHex: variantColourHex,
              size: variantSize,
              sku: `${skuPrefix}-${variantColour.slice(0, 3)}-${variantSize}`.toUpperCase(),
              initialQty: Number(initialQty),
            },
          ],
        }),
      });

      if (offerPriceNpr && Number(offerPriceNpr) > 0 && Number(offerPriceNpr) < Number(basePriceNpr)) {
        await adminFetch('/admin/offers', {
          method: 'POST',
          body: JSON.stringify({
            productId: created.id,
            offerPriceNpr: Number(offerPriceNpr),
            isActive: true,
          }),
        });
      }
    }

    setShowModal(false);
    load();
  };

  const handleAddVariant = async () => {
    if (!editingProduct) return;
    await adminFetch(`/admin/products/${editingProduct.id}/variants`, {
      method: 'POST',
      body: JSON.stringify({
        colourName: variantColour,
        colourHex: variantColourHex,
        size: variantSize,
        sku: `${skuPrefix}-${variantColour.slice(0, 3)}-${variantSize}`.toUpperCase(),
        initialQty: Number(initialQty),
      }),
    });
    const refreshed = await adminFetch<ProductRow[]>('/admin/products');
    setProducts(refreshed);
    const updated = refreshed.find((p) => p.id === editingProduct.id);
    if (updated) setEditingProduct(updated);
  };

  const handleDelete = async (id: string) => {
    await adminFetch(`/admin/products/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleStatus = async (p: ProductRow) => {
    const next = p.status === 'published' ? 'draft' : 'published';
    await adminFetch(`/admin/products/${p.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    load();
  };

  const toggleCollection = (id: string) => {
    setSelectedCollections((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const primaryImage = images.find(Boolean) || '';
  const hasOffer = Boolean(offerPriceNpr && Number(offerPriceNpr) < Number(basePriceNpr));
  const discountPct = hasOffer
    ? calculateDiscountPercent(Number(basePriceNpr), Number(offerPriceNpr))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <button
          type="button"
          onClick={openCreate}
          className="bg-terracotta px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ivory"
        >
          + Add Product
        </button>
      </div>

      <div className="overflow-x-auto border bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Variants / Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const totalStock = p.variants.reduce((s, v) => s + (v.inventory?.availableQty ?? 0), 0);
              return (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="flex items-center gap-3 p-3 font-medium">
                    {p.images[0]?.url && (
                      <img src={p.images[0].url} alt={p.name} className="h-10 w-8 object-cover bg-stone" />
                    )}
                    {p.name}
                  </td>
                  <td className="p-3 text-xs text-gray-500">{p.skuPrefix}</td>
                  <td className="p-3">{p.category.name}</td>
                  <td className="p-3">{formatNPR(p.basePriceNpr)}</td>
                  <td className="p-3 text-xs">{p.variants.length} variants ({totalStock} units)</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => toggleStatus(p)}
                      className={`px-2 py-0.5 text-xs uppercase ${
                        p.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {p.status}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="flex items-center gap-1 text-xs font-medium text-charcoal hover:text-terracotta"
                      >
                        <Edit2 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto bg-white p-6 shadow-xl">
            <div className="flex justify-between border-b pb-3">
              <h2 className="text-lg font-semibold">
                {editingProduct ? `Edit Product — ${editingProduct.name}` : 'New Product & Live Card Preview'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="text-xs">Close</button>
            </div>

            <div className="mt-5 grid gap-8 lg:grid-cols-3">
              <form onSubmit={handleSave} className="space-y-4 lg:col-span-2">
                <div className="grid grid-cols-2 gap-3">
                  <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Product Name" className="border px-3 py-2 text-sm" />
                  <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Slug (auto if blank)" className="border px-3 py-2 text-sm" />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <input required value={skuPrefix} onChange={(e) => setSkuPrefix(e.target.value)} placeholder="SKU Prefix" className="border px-3 py-2 text-sm" />
                  <input type="number" required value={basePriceNpr} onChange={(e) => setBasePriceNpr(Number(e.target.value))} placeholder="Regular Price" className="border px-3 py-2 text-sm" />
                  {!editingProduct && (
                    <input type="number" value={offerPriceNpr} onChange={(e) => setOfferPriceNpr(e.target.value ? Number(e.target.value) : '')} placeholder="Offer Price (opt)" className="border px-3 py-2 text-sm" />
                  )}
                </div>

                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border px-3 py-2 text-sm">
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>

                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase">Collections</p>
                  <div className="flex flex-wrap gap-2">
                    {collections.map((col) => (
                      <label key={col.id} className="flex items-center gap-1.5 border px-2.5 py-1 text-xs">
                        <input
                          type="checkbox"
                          checked={selectedCollections.includes(col.id)}
                          onChange={() => toggleCollection(col.id)}
                        />
                        {col.name}
                      </label>
                    ))}
                  </div>
                </div>

                <textarea rows={2} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Short description..." className="w-full border px-3 py-2 text-sm" />
                <textarea rows={2} value={fullDescription} onChange={(e) => setFullDescription(e.target.value)} placeholder="Full description..." className="w-full border px-3 py-2 text-sm" />
                <input value={fabricCare} onChange={(e) => setFabricCare(e.target.value)} placeholder="Fabric & care details..." className="w-full border px-3 py-2 text-sm" />

                <div className="space-y-3 border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase">Product Images</span>
                    <button
                      type="button"
                      onClick={() => setImages([...images, ''])}
                      className="text-xs font-semibold text-terracotta hover:underline"
                    >
                      + Add Image Slot
                    </button>
                  </div>
                  {images.map((imgUrl, idx) => (
                    <ImageUploader
                      key={idx}
                      label={idx === 0 ? 'Primary Image' : `Gallery Image ${idx + 1}`}
                      recommendedSize="900 × 1200 px (3:4)"
                      value={imgUrl}
                      onChange={(url) => {
                        const copy = [...images];
                        copy[idx] = url;
                        setImages(copy);
                      }}
                    />
                  ))}
                </div>

                {editingProduct ? (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-semibold uppercase">Existing Variants</p>
                    <div className="space-y-1 text-xs">
                      {editingProduct.variants.map((v) => (
                        <div key={v.id} className="flex items-center justify-between border bg-stone/30 px-2.5 py-1">
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-charcoal/20"
                              style={{ backgroundColor: v.colourHex || '#1C1917' }}
                            />
                            {v.colourName} / {v.size} ({v.sku})
                          </span>
                          <span>Stock: {v.inventory?.availableQty ?? 0}</span>
                        </div>
                      ))}
                    </div>
                    <p className="pt-2 text-xs font-semibold uppercase">Add New Variant</p>
                    <ColorPresetPicker
                      selectedName={variantColour}
                      selectedHex={variantColourHex}
                      onSelect={(name, hex) => {
                        setVariantColour(name);
                        setVariantColourHex(hex);
                      }}
                    />
                    <div className="grid grid-cols-5 gap-2">
                      <input value={variantColour} onChange={(e) => setVariantColour(e.target.value)} placeholder="Colour Name" className="col-span-2 border px-2 py-1.5 text-xs" />
                      <input type="color" value={variantColourHex} onChange={(e) => setVariantColourHex(e.target.value)} title="Colour Swatch" className="h-8 w-full cursor-pointer border p-0.5" />
                      <input value={variantSize} onChange={(e) => setVariantSize(e.target.value)} placeholder="Size" className="border px-2 py-1.5 text-xs" />
                      <input type="number" value={initialQty} onChange={(e) => setInitialQty(Number(e.target.value))} placeholder="Stock" className="border px-2 py-1.5 text-xs" />
                    </div>
                    <button type="button" onClick={handleAddVariant} className="border border-charcoal px-3 py-1.5 text-xs font-semibold hover:bg-stone">
                      + Add Variant
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-semibold uppercase">Initial Variant (Colour, Swatch, Size, Stock)</p>
                    <ColorPresetPicker
                      selectedName={variantColour}
                      selectedHex={variantColourHex}
                      onSelect={(name, hex) => {
                        setVariantColour(name);
                        setVariantColourHex(hex);
                      }}
                    />
                    <div className="grid grid-cols-5 gap-2">
                      <input value={variantColour} onChange={(e) => setVariantColour(e.target.value)} placeholder="Colour Name" className="col-span-2 border px-2 py-1.5 text-xs" />
                      <input type="color" value={variantColourHex} onChange={(e) => setVariantColourHex(e.target.value)} title="Colour Swatch" className="h-8 w-full cursor-pointer border p-0.5" />
                      <input value={variantSize} onChange={(e) => setVariantSize(e.target.value)} placeholder="Size" className="border px-2 py-1.5 text-xs" />
                      <input type="number" value={initialQty} onChange={(e) => setInitialQty(Number(e.target.value))} placeholder="Stock" className="border px-2 py-1.5 text-xs" />
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full bg-terracotta py-2.5 text-xs font-semibold uppercase text-ivory">
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </form>

              {/* Live Product Card Preview */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Live Storefront Card Preview
                </p>
                <div className="border bg-ivory p-4">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-stone">
                    {primaryImage ? (
                      <img src={primaryImage} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-gray-400">
                        Upload image to preview
                      </div>
                    )}
                    {hasOffer && discountPct > 0 && (
                      <span className="absolute left-2 top-2 bg-terracotta px-2 py-0.5 text-[10px] font-semibold text-ivory">
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">
                      {categories.find((c) => c.id === categoryId)?.name || 'Category'}
                    </p>
                    <p className="font-serif text-lg text-charcoal">{name || 'Product Name'}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">
                        {formatNPR(hasOffer ? Number(offerPriceNpr) : Number(basePriceNpr))}
                      </span>
                      {hasOffer && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatNPR(Number(basePriceNpr))}
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
