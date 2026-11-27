'use client';

import React, { useRef, useState } from 'react';

export interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  color: string;
  fontFamily: 'serif' | 'sans' | 'mono';
  fontSize: number;
}

export interface ArtworkLayer {
  url: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  flipX: boolean;
}

export interface DesignTransform {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  textColor?: string;
  artwork?: ArtworkLayer;
  textLayers?: TextLayer[];
}

const FONT_MAP: Record<TextLayer['fontFamily'], string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'system-ui, -apple-system, sans-serif',
  mono: '"Courier New", monospace',
};

export function GarmentMockupSvg({
  garmentType,
  colorHex,
  placement = 'front',
  designImageUrl,
  customText,
  designConfig = {},
  showPrintGuide = false,
  interactive = false,
  selectedLayerId,
  onSelectLayer,
  onMoveLayer,
  onResizeLayer,
}: {
  garmentType: string;
  colorHex: string;
  placement?: 'front' | 'back';
  designImageUrl?: string | null;
  customText?: string | null;
  designConfig?: DesignTransform;
  showPrintGuide?: boolean;
  interactive?: boolean;
  selectedLayerId?: string | null;
  onSelectLayer?: (id: string) => void;
  onMoveLayer?: (id: string, x: number, y: number) => void;
  onResizeLayer?: (id: string, scale: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<{
    mode: 'move' | 'resize';
    id: string;
    startSvgX: number;
    startSvgY: number;
    origX: number;
    origY: number;
    origScale: number;
  } | null>(null);

  const type = garmentType.toLowerCase();
  const isHoodie = type.includes('hoodie');
  const isSweatshirt = type.includes('sweat');

  const basePrintX = 200;
  const basePrintY = isHoodie ? 225 : 210;

  // Support both new multi-layer format and legacy single-layer format
  const artwork: ArtworkLayer | null = designConfig.artwork
    ? designConfig.artwork
    : designImageUrl
    ? {
        url: designImageUrl,
        x: designConfig.x ?? 0,
        y: designConfig.y ?? 0,
        scale: designConfig.scale ?? 1,
        rotation: designConfig.rotation ?? 0,
        opacity: 1,
        flipX: false,
      }
    : null;

  const textLayers: TextLayer[] = designConfig.textLayers
    ? designConfig.textLayers
    : customText
    ? [
        {
          id: 'legacy-text',
          text: customText,
          x: designConfig.x ?? 0,
          y: (designConfig.y ?? 0) + (artwork ? 75 : 6),
          scale: designConfig.scale ?? 1,
          rotation: designConfig.rotation ?? 0,
          color: designConfig.textColor ?? '#FAF7F2',
          fontFamily: 'serif',
          fontSize: 16,
        },
      ]
    : [];

  const toSvgCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 400,
      y: ((clientY - rect.top) / rect.height) * 480,
    };
  };

  const startDrag = (
    e: React.PointerEvent,
    id: string,
    origX: number,
    origY: number,
    origScale = 1,
    mode: 'move' | 'resize' = 'move'
  ) => {
    if (!interactive) return;
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    onSelectLayer?.(id);
    const pt = toSvgCoords(e.clientX, e.clientY);
    setDragging({ mode, id, startSvgX: pt.x, startSvgY: pt.y, origX, origY, origScale });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !interactive) return;
    const pt = toSvgCoords(e.clientX, e.clientY);
    const dx = pt.x - dragging.startSvgX;
    const dy = pt.y - dragging.startSvgY;
    if (dragging.mode === 'resize') {
      const delta = (dx + dy) / 120;
      const nextScale = Math.max(0.3, Math.min(2.2, Number((dragging.origScale + delta).toFixed(2))));
      onResizeLayer?.(dragging.id, nextScale);
    } else {
      const nextX = Math.max(-75, Math.min(75, Math.round(dragging.origX + dx)));
      const nextY = Math.max(-85, Math.min(95, Math.round(dragging.origY + dy)));
      onMoveLayer?.(dragging.id, nextX, nextY);
    }
  };

  const stopDrag = () => setDragging(null);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 400 480"
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
      className="h-full w-full select-none touch-none"
      role="img"
      aria-label={`${garmentType} ${placement} mockup`}
    >
      <defs>
        {/* Natural studio fabric lighting */}
        <radialGradient id="studioHighlight" cx="42%" cy="32%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.26" />
        </radialGradient>
        <linearGradient id="sleeveFoldLeft" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%" stopColor="#000" stopOpacity="0.16" />
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id="sleeveFoldRight" x1="1" y1="0" x2="0" y2="0.4">
          <stop offset="0%" stopColor="#000" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
        </linearGradient>
        <filter id="garmentDrop" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#1C1917" floodOpacity="0.18" />
        </filter>
        <pattern id="ribTexture" width="4" height="4" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="4" stroke="#000" strokeOpacity="0.14" strokeWidth="1" />
        </pattern>
        <clipPath id="printAreaClip">
          <rect x="115" y="120" width="170" height="225" rx="6" />
        </clipPath>
      </defs>

      {/* GARMENT SILHOUETTE */}
      {isHoodie || isSweatshirt ? (
        <g filter="url(#garmentDrop)">
          {/* Main organic body & draped sleeves */}
          <path
            d="M142,74 C118,80 92,88 76,102 C56,122 36,184 22,232 C20,238 25,244 32,246 L60,254 C67,255 72,250 75,243 C87,208 98,176 106,162 C104,238 103,335 104,406 C104,414 110,418 118,418 L282,418 C290,418 296,414 296,406 C297,335 296,238 294,162 C302,176 313,208 325,243 C328,250 333,255 340,254 L368,246 C375,244 380,238 378,232 C364,184 344,122 324,102 C308,88 282,80 258,74 C240,94 160,94 142,74 Z"
            fill={colorHex}
            stroke="#1C1917"
            strokeOpacity="0.22"
            strokeWidth="1.2"
          />
          <path
            d="M142,74 C118,80 92,88 76,102 C56,122 36,184 22,232 C20,238 25,244 32,246 L60,254 C67,255 72,250 75,243 C87,208 98,176 106,162 C104,238 103,335 104,406 C104,414 110,418 118,418 L282,418 C290,418 296,414 296,406 C297,335 296,238 294,162 C302,176 313,208 325,243 C328,250 333,255 340,254 L368,246 C375,244 380,238 378,232 C364,184 344,122 324,102 C308,88 282,80 258,74 C240,94 160,94 142,74 Z"
            fill="url(#studioHighlight)"
          />

          {/* Natural armhole & drape creases */}
          <path d="M106,162 Q115,126 112,92" fill="none" stroke="#000" strokeOpacity="0.16" strokeWidth="1.4" />
          <path d="M294,162 Q285,126 288,92" fill="none" stroke="#000" strokeOpacity="0.16" strokeWidth="1.4" />
          <path d="M112,340 Q124,365 118,395" fill="none" stroke="#000" strokeOpacity="0.1" strokeWidth="2" />
          <path d="M288,340 Q276,365 282,395" fill="none" stroke="#000" strokeOpacity="0.1" strokeWidth="2" />

          {/* Ribbed Hem & Cuffs */}
          <rect x="104" y="396" width="192" height="22" rx="4" fill={colorHex} stroke="#000" strokeOpacity="0.18" />
          <rect x="104" y="396" width="192" height="22" rx="4" fill="url(#ribTexture)" />
          <path d="M22,232 L66,246 L60,260 L18,246 Z" fill={colorHex} stroke="#000" strokeOpacity="0.18" />
          <path d="M22,232 L66,246 L60,260 L18,246 Z" fill="url(#ribTexture)" />
          <path d="M378,232 L334,246 L340,260 L382,246 Z" fill={colorHex} stroke="#000" strokeOpacity="0.18" />
          <path d="M378,232 L334,246 L340,260 L382,246 Z" fill="url(#ribTexture)" />

          {isHoodie ? (
            <g>
              {placement === 'front' ? (
                <>
                  {/* Natural layered hood */}
                  <path
                    d="M140,76 C142,30 258,30 260,76 C244,108 156,108 140,76 Z"
                    fill={colorHex}
                    stroke="#000"
                    strokeOpacity="0.25"
                  />
                  <path
                    d="M156,79 C170,50 230,50 244,79 C226,102 174,102 156,79 Z"
                    fill="#000"
                    fillOpacity="0.28"
                  />
                  {/* Drawstrings with metal tips */}
                  <path d="M185,95 Q182,125 178,154" fill="none" stroke="#E7E0D3" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M215,95 Q218,125 222,154" fill="none" stroke="#E7E0D3" strokeWidth="2.6" strokeLinecap="round" />
                  <circle cx="178" cy="155" r="2.2" fill="#B08D57" />
                  <circle cx="222" cy="155" r="2.2" fill="#B08D57" />
                  {/* Kangaroo pocket with topstitch */}
                  <path
                    d="M138,318 C165,314 235,314 262,318 L280,384 L120,384 Z"
                    fill={colorHex}
                    stroke="#000"
                    strokeOpacity="0.22"
                    strokeWidth="1.2"
                  />
                  <path d="M138,318 C165,314 235,314 262,318 L280,384 L120,384 Z" fill="#000" fillOpacity="0.07" />
                  <path
                    d="M141,322 C168,318 232,318 259,322"
                    fill="none"
                    stroke="#000"
                    strokeOpacity="0.18"
                    strokeDasharray="3 2"
                  />
                </>
              ) : (
                /* Back hood drape */
                <path
                  d="M138,76 C144,24 256,24 262,76 C252,126 148,126 138,76 Z"
                  fill={colorHex}
                  stroke="#000"
                  strokeOpacity="0.25"
                />
              )}
            </g>
          ) : (
            /* Sweatshirt ribbed crewneck & V-insert */
            <g>
              <path
                d={
                  placement === 'front'
                    ? 'M144,74 C168,112 232,112 256,74 C236,92 164,92 144,74 Z'
                    : 'M144,74 C170,90 230,90 256,74 C236,82 164,82 144,74 Z'
                }
                fill={colorHex}
                stroke="#000"
                strokeOpacity="0.28"
                strokeWidth="1.5"
              />
              {placement === 'front' && (
                <path d="M188,96 L200,114 L212,96 Z" fill="#000" fillOpacity="0.08" stroke="#000" strokeOpacity="0.16" />
              )}
            </g>
          )}
        </g>
      ) : (
        /* NATURAL OVERSIZED T-SHIRT SILHOUETTE */
        <g filter="url(#garmentDrop)">
          <path
            d="M148,68 C122,74 96,82 76,94 C58,106 42,140 30,174 C28,179 32,184 37,186 L82,202 C88,204 93,200 96,194 L108,162 C106,242 105,335 107,414 C107,420 112,424 118,424 L282,424 C288,424 293,420 293,414 C295,335 294,242 292,162 L304,194 C307,200 312,204 318,202 L363,186 C368,184 372,179 370,174 C358,140 342,106 324,94 C304,82 278,74 252,68 C234,94 166,94 148,68 Z"
            fill={colorHex}
            stroke="#1C1917"
            strokeOpacity="0.22"
            strokeWidth="1.2"
          />
          <path
            d="M148,68 C122,74 96,82 76,94 C58,106 42,140 30,174 C28,179 32,184 37,186 L82,202 C88,204 93,200 96,194 L108,162 C106,242 105,335 107,414 C107,420 112,424 118,424 L282,424 C288,424 293,420 293,414 C295,335 294,242 292,162 L304,194 C307,200 312,204 318,202 L363,186 C368,184 372,179 370,174 C358,140 342,106 324,94 C304,82 278,74 252,68 C234,94 166,94 148,68 Z"
            fill="url(#studioHighlight)"
          />
          {/* Natural shoulder & sleeve seams */}
          <path d="M108,162 Q115,124 113,86" fill="none" stroke="#000" strokeOpacity="0.16" strokeWidth="1.3" />
          <path d="M292,162 Q285,124 287,86" fill="none" stroke="#000" strokeOpacity="0.16" strokeWidth="1.3" />
          <path d="M114,310 Q122,350 116,396" fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="2.5" />
          <path d="M286,310 Q278,350 284,396" fill="none" stroke="#000" strokeOpacity="0.08" strokeWidth="2.5" />

          {/* Ribbed neckline */}
          <path
            d={
              placement === 'front'
                ? 'M148,68 C168,104 232,104 252,68 C234,86 166,86 148,68 Z'
                : 'M148,68 C170,84 230,84 252,68 C234,76 166,76 148,68 Z'
            }
            fill="#000"
            fillOpacity="0.2"
            stroke="#000"
            strokeOpacity="0.28"
            strokeWidth="1.5"
          />
          <path
            d={
              placement === 'front'
                ? 'M145,70 C168,108 232,108 255,70'
                : 'M145,70 C170,87 230,87 255,70'
            }
            fill="none"
            stroke="#000"
            strokeOpacity="0.18"
            strokeWidth="3.5"
          />
          {/* Subtle hem stitch */}
          <line x1="108" y1="414" x2="292" y2="414" stroke="#000" strokeOpacity="0.16" strokeDasharray="3 2" />
        </g>
      )}

      {/* Print Area Guide */}
      {showPrintGuide && (
        <rect
          x="115"
          y="120"
          width="170"
          height="225"
          rx="6"
          fill="none"
          stroke="#B08D57"
          strokeOpacity="0.65"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      )}

      {/* INTERACTIVE DESIGN LAYERS */}
      <g clipPath="url(#printAreaClip)">
        {artwork && (
          <g
            transform={`translate(${basePrintX + artwork.x}, ${basePrintY + artwork.y}) rotate(${artwork.rotation}) scale(${artwork.scale * (artwork.flipX ? -1 : 1)}, ${artwork.scale})`}
            onPointerDown={(e) => startDrag(e, 'artwork', artwork.x, artwork.y)}
            style={{ cursor: interactive ? 'grab' : 'default' }}
            opacity={artwork.opacity}
          >
            <image
              href={artwork.url}
              x="-60"
              y="-60"
              width="120"
              height="120"
              preserveAspectRatio="xMidYMid meet"
            />
            {interactive && selectedLayerId === 'artwork' && (
              <>
                <rect
                  x="-62"
                  y="-62"
                  width="124"
                  height="124"
                  fill="none"
                  stroke="#B08D57"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
                <circle
                  cx="62"
                  cy="62"
                  r="7"
                  fill="#FAF7F2"
                  stroke="#8B3A2B"
                  strokeWidth="2"
                  style={{ cursor: 'nwse-resize' }}
                  onPointerDown={(e) =>
                    startDrag(e, 'artwork', artwork.x, artwork.y, artwork.scale, 'resize')
                  }
                />
              </>
            )}
          </g>
        )}

        {textLayers.map((layer) => (
          <g
            key={layer.id}
            transform={`translate(${basePrintX + layer.x}, ${basePrintY + layer.y}) rotate(${layer.rotation}) scale(${layer.scale})`}
            onPointerDown={(e) => startDrag(e, layer.id, layer.x, layer.y, layer.scale, 'move')}
            style={{ cursor: interactive ? 'grab' : 'default' }}
          >
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={layer.color}
              fontSize={layer.fontSize}
              fontWeight="600"
              letterSpacing="1.5"
              fontFamily={FONT_MAP[layer.fontFamily]}
            >
              {layer.text}
            </text>
            {interactive && selectedLayerId === layer.id && (
              <>
                <rect
                  x="-68"
                  y={-layer.fontSize}
                  width="136"
                  height={layer.fontSize * 2}
                  fill="none"
                  stroke="#B08D57"
                  strokeWidth="1.2"
                  strokeDasharray="3 2"
                />
                <circle
                  cx="68"
                  cy={layer.fontSize}
                  r="6"
                  fill="#FAF7F2"
                  stroke="#8B3A2B"
                  strokeWidth="2"
                  style={{ cursor: 'nwse-resize' }}
                  onPointerDown={(e) =>
                    startDrag(e, layer.id, layer.x, layer.y, layer.scale, 'resize')
                  }
                />
              </>
            )}
          </g>
        ))}
      </g>
    </svg>
  );
}
