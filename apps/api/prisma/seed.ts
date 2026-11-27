import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Matina Clothing database...');

  // 1. Admin User
  const passwordHash = await bcrypt.hash('MatinaAdmin@2026!', 12);
  await prisma.adminUser.upsert({
    where: { email: 'admin@matina.clo' },
    update: {},
    create: {
      name: 'Matina Owner',
      email: 'admin@matina.clo',
      passwordHash,
      role: 'super_admin',
      isActive: true,
    },
  });

  // 2. Site Settings
  const settings = [
    {
      key: 'announcement_bar',
      valueJson: {
        isVisible: true,
        text: 'Free delivery across Nepal on orders above Rs. 5,000 — Cash on Delivery available',
        link: '/shop',
        backgroundColor: '#8B3A2B',
        textColor: '#FAF7F2',
      },
    },
    {
      key: 'brand_info',
      valueJson: {
        name: 'Matina Clothing',
        tagline: "Nepal's heritage, reimagined for today.",
        instagramHandle: '@matina.clo',
        instagramUrl: 'https://instagram.com/matina.clo',
        contactEmail: 'hello@matina.clo',
        contactPhone: '+977-9800000000',
        address: 'Patan Durbar Square Vicinity, Lalitpur, Nepal',
      },
    },
  ];
  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { valueJson: s.valueJson },
      create: s,
    });
  }

  // 3. Shipping Rules
  const existingShipping = await prisma.shippingRule.count();
  if (existingShipping === 0) {
    await prisma.shippingRule.createMany({
      data: [
        {
          name: 'Kathmandu Valley Delivery',
          ruleType: 'district',
          province: 'Bagmati',
          district: 'Kathmandu',
          feeNpr: 100,
          freeShippingThresholdNpr: 5000,
        },
        {
          name: 'Lalitpur Delivery',
          ruleType: 'district',
          province: 'Bagmati',
          district: 'Lalitpur',
          feeNpr: 100,
          freeShippingThresholdNpr: 5000,
        },
        {
          name: 'Bhaktapur Delivery',
          ruleType: 'district',
          province: 'Bagmati',
          district: 'Bhaktapur',
          feeNpr: 100,
          freeShippingThresholdNpr: 5000,
        },
        {
          name: 'Standard Nepal Delivery',
          ruleType: 'flat',
          feeNpr: 200,
          freeShippingThresholdNpr: 5000,
        },
      ],
    });
  }

  // 4. Categories
  const categoryData = [
    { name: 'T-Shirts', slug: 't-shirts', displayOrder: 1, description: 'Heavyweight cotton streetwear tees.' },
    { name: 'Hoodies', slug: 'hoodies', displayOrder: 2, description: 'Structured fleece hoodies with heritage motifs.' },
    { name: 'Sweatshirts', slug: 'sweatshirts', displayOrder: 3, description: 'Relaxed crewnecks crafted for everyday comfort.' },
    { name: 'Jackets', slug: 'jackets', displayOrder: 4, description: 'Editorial outerwear inspired by Nepali architecture.' },
    { name: 'Caps', slug: 'caps', displayOrder: 5, description: 'Embroidered cultural headwear.' },
    { name: 'Accessories', slug: 'accessories', displayOrder: 6, description: 'Totes, pins, and limited cultural objects.' },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, displayOrder: cat.displayOrder },
      create: {
        ...cat,
        imageUrl: `https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&q=80`,
        isPublished: true,
      },
    });
    categories[cat.slug] = created.id;
  }

  // 5. Collections
  const collectionData = [
    { name: 'Lakhey', slug: 'lakhey', isFeatured: true, displayOrder: 1, description: 'Fierce protector spirit reimagined in contemporary heavyweight silhouettes.' },
    { name: 'Kumari', slug: 'kumari', isFeatured: true, displayOrder: 2, description: 'Reverence, grace, and crimson accents inspired by the Living Goddess.' },
    { name: 'Bhairav', slug: 'bhairav', isFeatured: true, displayOrder: 3, description: 'Bold monochrome & terracotta graphics rooted in Kathmandu Valley folklore.' },
    { name: 'Mahadev', slug: 'mahadev', isFeatured: true, displayOrder: 4, description: 'Minimalist sacred geometry and Himalayan stillness.' },
    { name: 'Indra Jatra', slug: 'indra-jatra', isFeatured: false, displayOrder: 5, description: 'Celebrating Kathmandu’s grandest street festival.' },
    { name: 'Limited Drops', slug: 'limited-drops', isFeatured: true, displayOrder: 6, description: 'Small-batch numbered releases.' },
  ];

  const collections: Record<string, string> = {};
  for (const col of collectionData) {
    const created = await prisma.collection.upsert({
      where: { slug: col.slug },
      update: { name: col.name, isFeatured: col.isFeatured, displayOrder: col.displayOrder },
      create: {
        ...col,
        imageUrl: `https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=900&q=80`,
        isPublished: true,
      },
    });
    collections[col.slug] = created.id;
  }

  // 6. Sample Products
  const sampleProducts = [
    {
      name: 'Lakhey Heavyweight Oversized Tee',
      slug: 'lakhey-heavyweight-oversized-tee',
      skuPrefix: 'MTN-LKY-TEE',
      categorySlug: 't-shirts',
      collectionSlugs: ['lakhey', 'limited-drops'],
      basePriceNpr: 2999,
      offerPriceNpr: 2699,
      isFeatured: true,
      badges: ['new', 'limited_drop', 'sale'],
      shortDescription: '280 GSM combed cotton oversized tee featuring original Lakhey back artwork.',
      fullDescription: 'Crafted from 100% heavyweight Nepali-sourced combed cotton, the Lakhey Oversized Tee pairs dropped shoulders with intricate screen-printed artwork faithful to traditional Newari mask craftsmanship.',
      fabricCare: '100% Combed Cotton (280 GSM). Cold wash inside out. Do not iron directly on print.',
      image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=80',
      variants: [
        { colourName: 'Charcoal Black', colourHex: '#1C1917', size: 'M', qty: 8 },
        { colourName: 'Charcoal Black', colourHex: '#1C1917', size: 'L', qty: 5 },
        { colourName: 'Charcoal Black', colourHex: '#1C1917', size: 'XL', qty: 3 },
        { colourName: 'Warm Ivory', colourHex: '#FAF7F2', size: 'L', qty: 4 },
      ],
    },
    {
      name: 'Kumari Crimson Embroidered Hoodie',
      slug: 'kumari-crimson-embroidered-hoodie',
      skuPrefix: 'MTN-KMR-HD',
      categorySlug: 'hoodies',
      collectionSlugs: ['kumari'],
      basePriceNpr: 5499,
      offerPriceNpr: null,
      isFeatured: true,
      badges: ['bestseller'],
      shortDescription: '420 GSM French terry hoodie with subtle Kumari motif embroidery.',
      fullDescription: 'Structured boxy fit with double-lined hood, antique gold aglets, and tonal crimson embroidery inspired by Kathmandu Durbar Square.',
      fabricCare: '420 GSM Cotton Fleece. Gentle machine wash cold. Dry flat.',
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
      variants: [
        { colourName: 'Deep Maroon', colourHex: '#6B221B', size: 'M', qty: 6 },
        { colourName: 'Deep Maroon', colourHex: '#6B221B', size: 'L', qty: 7 },
        { colourName: 'Stone Cream', colourHex: '#E7E0D3', size: 'L', qty: 2 },
      ],
    },
    {
      name: 'Bhairav Architectural Sweatshirt',
      slug: 'bhairav-architectural-sweatshirt',
      skuPrefix: 'MTN-BHR-SW',
      categorySlug: 'sweatshirts',
      collectionSlugs: ['bhairav'],
      basePriceNpr: 4299,
      offerPriceNpr: 3899,
      isFeatured: true,
      badges: ['sale'],
      shortDescription: 'Relaxed crewneck sweatshirt with Newari lattice-inspired back graphic.',
      fullDescription: 'Designed for effortless layering, featuring ribbed cuffs and high-density pigment print.',
      fabricCare: '380 GSM Loopback Cotton. Wash with similar colours.',
      image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=80',
      variants: [
        { colourName: 'Obsidian', colourHex: '#18181B', size: 'M', qty: 10 },
        { colourName: 'Obsidian', colourHex: '#18181B', size: 'L', qty: 6 },
        { colourName: 'Terracotta', colourHex: '#8B3A2B', size: 'XL', qty: 0 },
      ],
    },
    {
      name: 'Mahadev Heritage Dad Cap',
      slug: 'mahadev-heritage-dad-cap',
      skuPrefix: 'MTN-MHD-CAP',
      categorySlug: 'caps',
      collectionSlugs: ['mahadev'],
      basePriceNpr: 1499,
      offerPriceNpr: null,
      isFeatured: true,
      badges: ['new'],
      shortDescription: 'Washed cotton twill 6-panel cap with antique gold embroidery.',
      fullDescription: 'Unstructured silhouette with brass buckle strap and breathable eyelets.',
      fabricCare: '100% Cotton Twill. Spot clean only.',
      image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=80',
      variants: [
        { colourName: 'Washed Charcoal', colourHex: '#292524', size: 'One Size', qty: 15 },
        { colourName: 'Warm Sand', colourHex: '#D6CCBE', size: 'One Size', qty: 12 },
      ],
    },
  ];

  for (const p of sampleProducts) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) continue;

    const product = await prisma.product.create({
      data: {
        categoryId: categories[p.categorySlug],
        name: p.name,
        slug: p.slug,
        skuPrefix: p.skuPrefix,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
        fabricCare: p.fabricCare,
        basePriceNpr: p.basePriceNpr,
        status: 'published',
        isFeatured: p.isFeatured,
        badges: p.badges,
        seoTitle: `${p.name} | Matina Clothing`,
        seoDescription: p.shortDescription,
        sizeGuideJson: {
          unit: 'inches',
          rows: [
            { size: 'M', chest: '42', length: '28' },
            { size: 'L', chest: '44', length: '29' },
            { size: 'XL', chest: '46', length: '30' },
          ],
        },
        images: {
          create: [
            { url: p.image, altText: p.name, imageType: 'front', displayOrder: 0 },
          ],
        },
        collections: {
          create: p.collectionSlugs.map((cSlug) => ({
            collectionId: collections[cSlug],
          })),
        },
      },
    });

    if (p.offerPriceNpr) {
      await prisma.productOffer.create({
        data: {
          productId: product.id,
          offerPriceNpr: p.offerPriceNpr,
          isActive: true,
        },
      });
    }

    for (const v of p.variants) {
      const sku = `${p.skuPrefix}-${v.colourName.slice(0, 3).toUpperCase()}-${v.size.replace(/\s+/g, '').toUpperCase()}`;
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          colourName: v.colourName,
          colourHex: v.colourHex,
          size: v.size,
          sku,
          isActive: true,
        },
      });
      await prisma.inventory.create({
        data: {
          variantId: variant.id,
          availableQty: v.qty,
          lowStockThreshold: 5,
        },
      });
      await prisma.inventoryMovement.create({
        data: {
          variantId: variant.id,
          delta: v.qty,
          reason: 'opening_stock',
          note: 'Initial seed stock',
        },
      });
    }
  }

  // 7. Hero Banner & Promo Banner
  if ((await prisma.banner.count()) === 0) {
    await prisma.banner.createMany({
      data: [
        {
          placement: 'hero',
          desktopImageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1800&q=80',
          mobileImageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
          heading: 'CULTURE ON WEAR',
          subheading: "Contemporary streetwear inspired by Nepal's living heritage.",
          ctaText: 'SHOP COLLECTION',
          ctaLink: '/shop',
          displayOrder: 1,
          isActive: true,
        },
        {
          placement: 'promotion',
          desktopImageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1600&q=80',
          heading: 'THE LAKHEY DROP',
          subheading: 'Small-batch heavyweight pieces crafted in Kathmandu.',
          ctaText: 'EXPLORE LAKHEY',
          ctaLink: '/collections/lakhey',
          displayOrder: 1,
          isActive: true,
        },
      ],
    });
  }

  // 8. Homepage Sections
  if ((await prisma.homepageSection.count()) === 0) {
    await prisma.homepageSection.createMany({
      data: [
        { sectionType: 'hero', title: 'Hero Banner', displayOrder: 1, isVisible: true },
        { sectionType: 'categories', title: 'Shop by Category', subtitle: 'Curated silhouettes', displayOrder: 2, isVisible: true },
        { sectionType: 'collections', title: 'Featured Collections', subtitle: "Nepal's heritage, reimagined for today.", displayOrder: 3, isVisible: true },
        { sectionType: 'featured_products', title: 'New Drops', subtitle: 'Limited cultural streetwear', displayOrder: 4, isVisible: true, configJson: { rule: 'featured' } },
        { sectionType: 'promo_banner', title: 'Campaign Feature', displayOrder: 5, isVisible: true },
        { sectionType: 'brand_story', title: 'Our Story', subtitle: 'Crafted in the Kathmandu Valley', displayOrder: 6, isVisible: true, configJson: { body: "Matina Clothing bridges centuries-old Newari artistry and contemporary streetwear. Every piece honours Nepal's living culture without compromise.", ctaText: 'READ OUR STORY', ctaLink: '/our-story' } },
        { sectionType: 'instagram', title: 'Follow Matina on Instagram', subtitle: '@matina.clo', displayOrder: 7, isVisible: true },
      ],
    });
  }

  // 9. Sample Coupon
  await prisma.coupon.upsert({
    where: { code: 'MATINA10' },
    update: {},
    create: {
      code: 'MATINA10',
      discountType: 'percentage',
      discountValue: 10,
      minOrderNpr: 2000,
      combinableWithOffer: false,
      isActive: true,
    },
  });

  // 10. Instagram Fallback Posts
  if ((await prisma.instagramPost.count()) === 0) {
    await prisma.instagramPost.createMany({
      data: [
        { mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80', permalink: 'https://instagram.com/matina.clo', caption: 'Lakhey Drop in Patan', displayOrder: 1 },
        { mediaUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80', permalink: 'https://instagram.com/matina.clo', caption: 'Kumari Studio Lookbook', displayOrder: 2 },
        { mediaUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80', permalink: 'https://instagram.com/matina.clo', caption: 'Heavyweight 280 GSM Cotton', displayOrder: 3 },
        { mediaUrl: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=600&q=80', permalink: 'https://instagram.com/matina.clo', caption: 'Bhairav Heritage Series', displayOrder: 4 },
      ],
    });
  }

  // 11. Content Pages
  const pages = [
    { pageType: 'story' as const, title: 'Our Story', slug: 'our-story', excerpt: "Nepal's living culture reimagined through contemporary streetwear.", contentJson: { body: 'Matina Clothing was born in the Kathmandu Valley with a singular vision: to carry the richness of Nepali and Newari heritage into contemporary everyday streetwear.' } },
    { pageType: 'faq' as const, title: 'FAQ & Shipping', slug: 'faq', excerpt: 'Answers about Cash on Delivery, sizing, and exchanges across Nepal.', contentJson: { body: 'We deliver across all 77 districts of Nepal with Cash on Delivery (COD). Kathmandu Valley orders arrive within 1–2 business days; outside valley orders arrive within 3–5 business days.' } },
    { pageType: 'policy' as const, title: 'Privacy Policy', slug: 'privacy-policy', excerpt: 'How Matina Clothing protects your personal and order information.', contentJson: { body: 'We collect only the contact and delivery information required to fulfil your order and provide order tracking.' } },
    { pageType: 'policy' as const, title: 'Terms & Conditions', slug: 'terms-conditions', excerpt: 'Terms of service for Matina Clothing.', contentJson: { body: 'All prices are listed in Nepalese Rupees (NPR / Rs.). Cash on Delivery orders are subject to phone confirmation if required.' } },
  ];
  for (const page of pages) {
    await prisma.contentPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: { ...page, isPublished: true, publishedAt: new Date() },
    });
  }

  // 12. Custom Wear Templates (T-Shirt, Sweatshirt, Hoodie)
  const customTemplates = [
    {
      name: 'Heavyweight Oversized T-Shirt',
      slug: 'custom-tshirt',
      garmentType: 'tshirt',
      description: '280 GSM 100% combed cotton drop-shoulder tee ready for your custom artwork.',
      basePriceNpr: 2499,
      displayOrder: 1,
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
      availableColors: [
        { name: 'Charcoal Black', hex: '#1C1917' },
        { name: 'Warm Ivory', hex: '#FAF7F2' },
        { name: 'Terracotta', hex: '#8B3A2B' },
        { name: 'Deep Maroon', hex: '#6B221B' },
        { name: 'Stone Beige', hex: '#D6CCBE' },
        { name: 'Forest Olive', hex: '#3F4E3A' },
      ],
    },
    {
      name: 'Editorial Crewneck Sweatshirt',
      slug: 'custom-sweatshirt',
      garmentType: 'sweatshirt',
      description: '380 GSM loopback cotton crewneck with ribbed cuffs and relaxed boxy fit.',
      basePriceNpr: 3999,
      displayOrder: 2,
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
      availableColors: [
        { name: 'Charcoal Black', hex: '#1C1917' },
        { name: 'Stone Cream', hex: '#E7E0D3' },
        { name: 'Terracotta', hex: '#8B3A2B' },
        { name: 'Slate Navy', hex: '#1E293B' },
        { name: 'Forest Olive', hex: '#3F4E3A' },
      ],
    },
    {
      name: 'Structured Fleece Hoodie',
      slug: 'custom-hoodie',
      garmentType: 'hoodie',
      description: '420 GSM French terry hoodie with double-lined hood and kangaroo pocket.',
      basePriceNpr: 4999,
      displayOrder: 3,
      availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
      availableColors: [
        { name: 'Charcoal Black', hex: '#1C1917' },
        { name: 'Deep Maroon', hex: '#6B221B' },
        { name: 'Warm Ivory', hex: '#FAF7F2' },
        { name: 'Stone Beige', hex: '#D6CCBE' },
        { name: 'Espresso', hex: '#3E2723' },
      ],
    },
  ];

  for (const tpl of customTemplates) {
    await prisma.customWearTemplate.upsert({
      where: { slug: tpl.slug },
      update: { name: tpl.name, basePriceNpr: tpl.basePriceNpr, availableColors: tpl.availableColors },
      create: tpl,
    });
  }

  // 13. Color Presets
  const defaultPresets = [
    { name: 'Charcoal Black', hex: '#1C1917' },
    { name: 'Warm Ivory', hex: '#FAF7F2' },
    { name: 'Stone Cream', hex: '#E7E0D3' },
    { name: 'Warm Sand', hex: '#D6CCBE' },
    { name: 'Terracotta', hex: '#8B3A2B' },
    { name: 'Deep Maroon', hex: '#6B221B' },
    { name: 'Forest Olive', hex: '#3F4E3A' },
    { name: 'Slate Navy', hex: '#1E293B' },
  ];
  for (const preset of defaultPresets) {
    await prisma.colorPreset.upsert({
      where: { name: preset.name },
      update: { hex: preset.hex },
      create: preset,
    });
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
