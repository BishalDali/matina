import React, { useEffect, useState } from 'react';
import { adminFetch } from '../lib/api';
import { ImageUploader } from '../components/ImageUploader';

interface BrandInfo {
  name?: string;
  tagline?: string;
  desktopLogoUrl?: string;
  mobileLogoUrl?: string;
  svgIconUrl?: string;
  instagramHandle?: string;
  instagramUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

interface AnnouncementBar {
  isVisible?: boolean;
  text?: string;
  link?: string;
  backgroundColor?: string;
  textColor?: string;
}

export function SettingsPage() {
  const [brand, setBrand] = useState<BrandInfo>({ name: 'Matina Clothing' });
  const [announcement, setAnnouncement] = useState<AnnouncementBar>({
    isVisible: true,
    text: '',
    link: '/shop',
    backgroundColor: '#8B3A2B',
    textColor: '#FAF7F2',
  });
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    adminFetch<Array<{ key: string; valueJson: any }>>('/admin/settings')
      .then((rows) => {
        const b = rows.find((r) => r.key === 'brand_info');
        const a = rows.find((r) => r.key === 'announcement_bar');
        if (b?.valueJson) setBrand(b.valueJson);
        if (a?.valueJson) setAnnouncement(a.valueJson);
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg('');
    await Promise.all([
      adminFetch('/admin/settings/brand_info', {
        method: 'PUT',
        body: JSON.stringify({ valueJson: brand }),
      }),
      adminFetch('/admin/settings/announcement_bar', {
        method: 'PUT',
        body: JSON.stringify({ valueJson: announcement }),
      }),
    ]);
    setSavedMsg('Settings saved and live on storefront.');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Brand Logo &amp; Site Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand Logos */}
        <div className="border bg-white p-6 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600">
            Brand Logos &amp; Icon
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            <ImageUploader
              label="Desktop Logo (PNG/SVG)"
              recommendedSize="240 × 60 px"
              value={brand.desktopLogoUrl || ''}
              onChange={(url) => setBrand({ ...brand, desktopLogoUrl: url })}
            />
            <ImageUploader
              label="Mobile Logo (PNG/SVG)"
              recommendedSize="160 × 44 px"
              value={brand.mobileLogoUrl || ''}
              onChange={(url) => setBrand({ ...brand, mobileLogoUrl: url })}
            />
            <ImageUploader
              label="SVG Icon / Favicon"
              recommendedSize="64 × 64 px (SVG/PNG)"
              value={brand.svgIconUrl || ''}
              onChange={(url) => setBrand({ ...brand, svgIconUrl: url })}
            />
          </div>
        </div>

        {/* Brand Details */}
        <div className="border bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600">
            Brand &amp; Contact Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={brand.name || ''}
              onChange={(e) => setBrand({ ...brand, name: e.target.value })}
              placeholder="Brand Name"
              className="border px-3 py-2 text-sm"
            />
            <input
              value={brand.tagline || ''}
              onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
              placeholder="Tagline"
              className="border px-3 py-2 text-sm"
            />
            <input
              value={brand.instagramHandle || ''}
              onChange={(e) => setBrand({ ...brand, instagramHandle: e.target.value })}
              placeholder="Instagram Handle (@matina.clo)"
              className="border px-3 py-2 text-sm"
            />
            <input
              value={brand.instagramUrl || ''}
              onChange={(e) => setBrand({ ...brand, instagramUrl: e.target.value })}
              placeholder="Instagram URL"
              className="border px-3 py-2 text-sm"
            />
            <input
              value={brand.contactEmail || ''}
              onChange={(e) => setBrand({ ...brand, contactEmail: e.target.value })}
              placeholder="Contact Email"
              className="border px-3 py-2 text-sm"
            />
            <input
              value={brand.contactPhone || ''}
              onChange={(e) => setBrand({ ...brand, contactPhone: e.target.value })}
              placeholder="Contact Phone"
              className="border px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Announcement Bar */}
        <div className="border bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-600">
              Announcement Bar
            </h2>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(announcement.isVisible)}
                onChange={(e) => setAnnouncement({ ...announcement, isVisible: e.target.checked })}
              />
              Visible
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <input
              value={announcement.text || ''}
              onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
              placeholder="Announcement text"
              className="border px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              value={announcement.link || ''}
              onChange={(e) => setAnnouncement({ ...announcement, link: e.target.value })}
              placeholder="Link (/shop)"
              className="border px-3 py-2 text-sm"
            />
          </div>
        </div>

        {savedMsg && <p className="text-sm font-medium text-emerald-700">{savedMsg}</p>}

        <button
          type="submit"
          className="bg-terracotta px-8 py-3 text-xs font-semibold uppercase tracking-widest text-ivory"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
}
