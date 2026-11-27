import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { resolveProductPrice } from '../lib/pricing';

export const storefrontRouter = Router();

function formatProductCard(product: {
  id: string;
  name: string;
  slug: string;
  basePriceNpr: number;
  badges: string[];
  isFeatured: boolean;
  category: { id: string; name: string; slug: string };
  images: Array<{ url: string; altText: string | null }>;
  offers: Array<{
    variantId: string | null;
    offerPriceNpr: number;
    startsAt: Date;
    endsAt: Date | null;
    isActive: boolean;
  }>;
  variants: Array<{
    id: string;
    colourName: string;
    colourHex: string;
    size: string;
    priceOverrideNpr: number | null;
    isActive: boolean;
    inventory: { availableQty: number; lowStockThreshold: number } | null;
  }>;
}) {
  const pricing = resolveProductPrice(product.basePriceNpr, null, product.offers);
  const activeVariants = product.variants.filter((v) => v.isActive);
  const totalStock = activeVariants.reduce(
    (sum, v) => sum + (v.inventory?.availableQty ?? 0),
    0
  );
  const coloursMap = new Map<string, string>();
  for (const v of activeVariants) {
    coloursMap.set(v.colourName, v.colourHex);
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category,
    imageUrl: product.images[0]?.url ?? null,
    imageAlt: product.images[0]?.altText ?? product.name,
    badges: product.badges,
    isFeatured: product.isFeatured,
    inStock: totalStock > 0,
    totalStock,
    colours: Array.from(coloursMap.entries()).map(([name, hex]) => ({
      name,
      hex,
    })),
    ...pricing,
  };
}

storefrontRouter.get('/navigation', async (_req, res, next) => {
  try {
    const [categories, collections, announcementSetting, brandSetting] =
      await Promise.all([
        prisma.category.findMany({
          where: { isPublished: true, parentId: null },
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            children: {
              where: { isPublished: true },
              orderBy: { displayOrder: 'asc' },
              select: { id: true, name: true, slug: true },
            },
          },
        }),
        prisma.collection.findMany({
          where: { isPublished: true },
          orderBy: { displayOrder: 'asc' },
          select: { id: true, name: true, slug: true, isFeatured: true, imageUrl: true },
        }),
        prisma.siteSetting.findUnique({ where: { key: 'announcement_bar' } }),
        prisma.siteSetting.findUnique({ where: { key: 'brand_info' } }),
      ]);

    res.json({
      categories,
      collections,
      announcement: announcementSetting?.valueJson ?? null,
      brand: brandSetting?.valueJson ?? null,
    });
  } catch (err) {
    next(err);
  }
});

storefrontRouter.get('/home', async (_req, res, next) => {
  try {
    const now = new Date();
    const [
      sections,
      banners,
      categories,
      collections,
      featuredProducts,
      instagramPosts,
      announcementSetting,
    ] = await Promise.all([
      prisma.homepageSection.findMany({
        where: { isVisible: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.banner.findMany({
        where: {
          isActive: true,
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.category.findMany({
        where: { isPublished: true, parentId: null },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.collection.findMany({
        where: { isPublished: true, isFeatured: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.product.findMany({
        where: { status: 'published' },
        orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'desc' }],
        take: 8,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { orderBy: { displayOrder: 'asc' }, take: 1 },
          offers: true,
          variants: { include: { inventory: true } },
        },
      }),
      prisma.instagramPost.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
        take: 6,
      }),
      prisma.siteSetting.findUnique({ where: { key: 'announcement_bar' } }),
    ]);

    res.json({
      announcement: announcementSetting?.valueJson ?? null,
      sections,
      heroBanners: banners.filter((b) => b.placement === 'hero'),
      promoBanners: banners.filter((b) => b.placement === 'promotion'),
      categories,
      collections,
      featuredProducts: featuredProducts.map(formatProductCard),
      instagramPosts,
    });
  } catch (err) {
    next(err);
  }
});

storefrontRouter.get('/products', async (req, res, next) => {
  try {
    const {
      category,
      collection,
      size,
      colour,
      minPrice,
      maxPrice,
      inStock,
      onSale,
      q,
      sort = 'newest',
      page = '1',
      limit = '12',
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.min(48, Math.max(1, parseInt(limit || '12', 10)));

    const where: any = { status: 'published' };

    if (category) {
      where.category = { slug: category };
    }
    if (collection) {
      where.collections = { some: { collection: { slug: collection } } };
    }
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { shortDescription: { contains: q, mode: 'insensitive' } },
        { category: { name: { contains: q, mode: 'insensitive' } } },
        { collections: { some: { collection: { name: { contains: q, mode: 'insensitive' } } } } },
      ];
    }
    if (size || colour || inStock === 'true') {
      where.variants = {
        some: {
          isActive: true,
          ...(size ? { size } : {}),
          ...(colour ? { colourName: { equals: colour, mode: 'insensitive' } } : {}),
          ...(inStock === 'true' ? { inventory: { availableQty: { gt: 0 } } } : {}),
        },
      };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { basePriceNpr: 'asc' };
    else if (sort === 'price_desc') orderBy = { basePriceNpr: 'desc' };
    else if (sort === 'bestselling') orderBy = { salesCount: 'desc' };

    const allMatching = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { displayOrder: 'asc' }, take: 1 },
        offers: true,
        variants: { include: { inventory: true } },
      },
    });

    let cards = allMatching.map(formatProductCard);

    if (onSale === 'true') {
      cards = cards.filter((p) => p.hasActiveOffer);
    }
    if (minPrice) {
      const min = parseInt(minPrice, 10);
      if (!isNaN(min)) cards = cards.filter((p) => p.effectivePriceNpr >= min);
    }
    if (maxPrice) {
      const max = parseInt(maxPrice, 10);
      if (!isNaN(max)) cards = cards.filter((p) => p.effectivePriceNpr <= max);
    }

    const total = cards.length;
    const paginated = cards.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    // Dynamic filter facets from published inventory
    const [availableCategories, availableCollections, variantFacets] =
      await Promise.all([
        prisma.category.findMany({
          where: { isPublished: true },
          orderBy: { displayOrder: 'asc' },
          select: { name: true, slug: true },
        }),
        prisma.collection.findMany({
          where: { isPublished: true },
          orderBy: { displayOrder: 'asc' },
          select: { name: true, slug: true },
        }),
        prisma.productVariant.findMany({
          where: { isActive: true, product: { status: 'published' } },
          select: { size: true, colourName: true, colourHex: true },
        }),
      ]);

    const sizes = Array.from(new Set(variantFacets.map((v) => v.size)));
    const coloursMap = new Map<string, string>();
    for (const v of variantFacets) {
      coloursMap.set(v.colourName, v.colourHex);
    }

    res.json({
      items: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      facets: {
        categories: availableCategories,
        collections: availableCollections,
        sizes,
        colours: Array.from(coloursMap.entries()).map(([name, hex]) => ({
          name,
          hex,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

storefrontRouter.get('/products/:slug', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        collections: { include: { collection: true } },
        images: { orderBy: { displayOrder: 'asc' } },
        offers: true,
        variants: {
          where: { isActive: true },
          include: { inventory: true },
          orderBy: [{ colourName: 'asc' }, { size: 'asc' }],
        },
      },
    });

    if (!product || product.status !== 'published') {
      return res.status(404).json({ error: 'Product not found' });
    }

    const basePricing = resolveProductPrice(product.basePriceNpr, null, product.offers);

    const variants = product.variants.map((v) => {
      const qty = v.inventory?.availableQty ?? 0;
      const threshold = v.inventory?.lowStockThreshold ?? 5;
      const stockState =
        qty <= 0 ? 'out_of_stock' : qty <= threshold ? 'low_stock' : 'in_stock';
      const pricing = resolveProductPrice(
        product.basePriceNpr,
        v.priceOverrideNpr,
        product.offers,
        v.id
      );

      return {
        id: v.id,
        colourName: v.colourName,
        colourHex: v.colourHex,
        size: v.size,
        sku: v.sku,
        availableQty: qty,
        stockState,
        ...pricing,
      };
    });

    const relatedRaw = await prisma.product.findMany({
      where: {
        status: 'published',
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      take: 4,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { displayOrder: 'asc' }, take: 1 },
        offers: true,
        variants: { include: { inventory: true } },
      },
    });

    res.json({
      id: product.id,
      name: product.name,
      slug: product.slug,
      skuPrefix: product.skuPrefix,
      shortDescription: product.shortDescription,
      fullDescription: product.fullDescription,
      fabricCare: product.fabricCare,
      sizeGuide: product.sizeGuideJson,
      badges: product.badges,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      category: product.category,
      collections: product.collections.map((c) => c.collection),
      images: product.images,
      ...basePricing,
      variants,
      relatedProducts: relatedRaw.map(formatProductCard),
    });
  } catch (err) {
    next(err);
  }
});

storefrontRouter.get('/categories/:slug', async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { slug: req.params.slug },
    });
    if (!category || !category.isPublished) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (err) {
    next(err);
  }
});

storefrontRouter.get('/collections/:slug', async (req, res, next) => {
  try {
    const collection = await prisma.collection.findUnique({
      where: { slug: req.params.slug },
    });
    if (!collection || !collection.isPublished) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json(collection);
  } catch (err) {
    next(err);
  }
});

storefrontRouter.get('/pages/:slug', async (req, res, next) => {
  try {
    const page = await prisma.contentPage.findUnique({
      where: { slug: req.params.slug },
    });
    if (!page || !page.isPublished) {
      return res.status(404).json({ error: 'Page not found' });
    }
    res.json(page);
  } catch (err) {
    next(err);
  }
});

storefrontRouter.get('/journal', async (_req, res, next) => {
  try {
    const posts = await prisma.contentPage.findMany({
      where: { pageType: 'journal', isPublished: true },
      orderBy: { publishedAt: 'desc' },
    });
    res.json(posts);
  } catch (err) {
    next(err);
  }
});
