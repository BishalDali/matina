'use client';

import React from 'react';

export interface DesignTransform {
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  textColor?: string;
}

export function GarmentMockupSvg({
  garmentType,
  colorHex,
  placement = 'front',
  designImageUrl,
  customText,
  designConfig = {},
  showPrintGuide = false,
}: {
  garmentType: string;
  colorHex: string;
  placement?: 'front' | 'back';
  designImageUrl?: string | null;
  customText?: string | null;
  designConfig?: DesignTransform;
  showPrintGuide?: boolean;
}) {
  const x = designConfig.x ?? 0;
  const y = designConfig.y ?? 0;
  const scale = designConfig.scale ?? 1;
  const rotation = designConfig.rotation ?? 0;
  const textColor = designConfig.textColor ?? '#FAF7F2';

  const type = garmentType.toLowerCase();
  const isHoodie = type.includes('hoodie');
  const isSweatshirt = type.includes('sweat');

  // Print area center inside 400x480 viewBox
  const printCenterX = 200 + x;
  const printCenterY = (isHoodie ? 225 : 210) + y;

  return (
    <svg
      viewBox="0 0 400 480"
      className="h-full w-full select-none drop-shadow-md"
      role="img"
      aria-label={`${garmentType} ${placement} mockup`}
    >
      <defs>
        <linearGradient id="fabricShade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.14" />
          <stop offset="50%" stopColor="#000000" stopOpacity="0.0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.22" />
        </linearGradient>
        <clipPath id="printAreaClip">
          <rect x="125" y="135" width="150" height="190" rx="4" />
        </clipPath>
      </defs>

      {/* GARMENT SILHOUETTE */}
      {isHoodie || isSweatshirt ? (
        <g>
          {/* Main Body + Long Sleeves */}
          <path
            d="M138,76 L85,92 L22,225 L60,242 L105,155 L105,420 L295,420 L295,155 L340,242 L378,225 L315,92 L262,76 C245,92 155,92 138,76 Z"
            fill={colorHex}
            stroke="#1C1917"
            strokeOpacity="0.25"
            strokeWidth="1.5"
          />
          {/* Fabric Shading */}
          <path
            d="M138,76 L85,92 L22,225 L60,242 L105,155 L105,420 L295,420 L295,155 L340,242 L378,225 L315,92 L262,76 C245,92 155,92 138,76 Z"
            fill="url(#fabricShade)"
          />
          {/* Ribbed Hem & Cuffs */}
          <rect x="105" y="400" width="190" height="22" rx="2" fill={colorHex} stroke="#000" strokeOpacity="0.2" />
          <rect x="105" y="400" width="190" height="22" rx="2" fill="#000" fillOpacity="0.1" />
          <path d="M22,225 L60,242 L67,227 L29,210 Z" fill={colorHex} stroke="#000" strokeOpacity="0.2" />
          <path d="M378,225 L340,242 L333,227 L371,210 Z" fill={colorHex} stroke="#000" strokeOpacity="0.2" />

          {/* Hood or Crewneck Collar */}
          {isHoodie ? (
            <g>
              {placement === 'front' ? (
                <>
                  <path
                    d="M138,76 C150,35 250,35 262,76 C242,102 158,102 138,76 Z"
                    fill={colorHex}
                    stroke="#000"
                    strokeOpacity="0.3"
                  />
                  <path
                    d="M155,78 C172,58 228,58 245,78 C225,96 175,96 155,78 Z"
                    fill="#000"
                    fillOpacity="0.28"
                  />
                  {/* Drawstrings */}
                  <line x1="184" y1="92" x2="180" y2="148" stroke="#E7E0D3" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="216" y1="92" x2="220" y2="148" stroke="#E7E0D3" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Kangaroo Pocket */}
                  <path
                    d="M135,315 L265,315 L280,382 L120,382 Z"
                    fill={colorHex}
                    stroke="#000"
                    strokeOpacity="0.25"
                    strokeWidth="1.2"
                  />
                  <path d="M135,315 L265,315 L280,382 L120,382 Z" fill="#000" fillOpacity="0.08" />
                </>
              ) : (
                <path
                  d="M138,76 C145,25 255,25 262,76 C245,118 155,118 138,76 Z"
                  fill={colorHex}
                  stroke="#000"
                  strokeOpacity="0.25"
                />
              )}
            </g>
          ) : (
            /* Crewneck Collar */
            <path
              d={
                placement === 'front'
                  ? 'M148,76 C168,108 232,108 252,76 C235,88 165,88 148,76 Z'
                  : 'M148,76 C172,92 228,92 252,76 C235,82 165,82 148,76 Z'
              }
              fill={colorHex}
              stroke="#000"
              strokeOpacity="0.3"
              strokeWidth="2"
            />
          )}
        </g>
      ) : (
        /* T-SHIRT SILHOUETTE */
        <g>
          <path
            d="M145,70 L78,92 L35,172 L88,198 L108,158 L108,420 L292,420 L292,158 L312,198 L365,172 L322,92 L255,70 C238,94 162,94 145,70 Z"
            fill={colorHex}
            stroke="#1C1917"
            strokeOpacity="0.25"
            strokeWidth="1.5"
          />
          <path
            d="M145,70 L78,92 L35,172 L88,198 L108,158 L108,420 L292,420 L292,158 L312,198 L365,172 L322,92 L255,70 C238,94 162,94 145,70 Z"
            fill="url(#fabricShade)"
          />
          {/* Neckline */}
          <path
            d={
              placement === 'front'
                ? 'M145,70 C165,104 235,104 255,70 C236,86 164,86 145,70 Z'
                : 'M145,70 C170,86 230,86 255,70 C235,78 165,78 145,70 Z'
            }
            fill="#000"
            fillOpacity="0.22"
            stroke="#000"
            strokeOpacity="0.25"
          />
          {/* Subtle Shoulder & Hem Seams */}
          <line x1="108" y1="410" x2="292" y2="410" stroke="#000" strokeOpacity="0.15" strokeDasharray="3 3" />
        </g>
      )}

      {/* Print Area Guide */}
      {showPrintGuide && (
        <rect
          x="125"
          y="135"
          width="150"
          height="190"
          rx="4"
          fill="none"
          stroke="#B08D57"
          strokeOpacity="0.6"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      )}

      {/* CUSTOM ARTWORK + TEXT */}
      <g clipPath="url(#printAreaClip)">
        <g
          transform={`translate(${printCenterX}, ${printCenterY}) rotate(${rotation}) scale(${scale})`}
        >
          {designImageUrl && (
            <image
              href={designImageUrl}
              x="-60"
              y="-60"
              width="120"
              height="120"
              preserveAspectRatio="xMidYMid meet"
            />
          )}
          {customText && (
            <text
              x="0"
              y={designImageUrl ? '75' : '6'}
              textAnchor="middle"
              fill={textColor}
              fontSize="16"
              fontWeight="600"
              letterSpacing="2"
              fontFamily="Georgia, serif"
            >
              {customText}
            </text>
          )}
        </g>
      </g>
    </svg>
  );
}
