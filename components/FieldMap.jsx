'use client';

import { useState } from 'react';
import { MapPin, Car, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function FieldMap({
  fieldMap,
  activeField = null,
  onFieldClick = null,
  showLabels = true,
  className = ''
}) {
  const [hoveredField, setHoveredField] = useState(null);

  if (!fieldMap) return null;

  const { fields, mercuryFields, parking } = fieldMap;

  return (
    <div className={cn("relative w-full", className)}>
      {/* Map Image with dark overlay - aspect ratio matches actual image (2000x1545) */}
      <div className="relative w-full aspect-400/309 rounded-lg overflow-hidden">
        {/* Dark overlay for stadium theme */}
        <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none" />

        {/* Base map image - fill container exactly */}
        <Image
          src={fieldMap.imageUrl || "/images/delmar-field-map.png"}
          alt="Tournament Field Layout"
          fill
          className="object-fill"
          priority
        />

        {/* Field hotspots */}
        {Object.entries(fields).map(([fieldId, field]) => {
          const isMercuryField = mercuryFields.includes(fieldId);
          const isActive = activeField === fieldId;
          const isHovered = hoveredField === fieldId;

          return (
            <button
              key={fieldId}
              onClick={() => onFieldClick?.(fieldId)}
              onMouseEnter={() => setHoveredField(fieldId)}
              onMouseLeave={() => setHoveredField(null)}
              className={cn(
                "absolute z-20 rounded-sm transition-all duration-300",
                "border-2 cursor-pointer",
                // Mercury fields get special treatment
                isMercuryField && !isActive && "border-turf/50 bg-turf/10",
                // Active field gets full highlight with pulse
                isActive && "border-turf bg-turf/30 field-pulse",
                // Non-Mercury fields are subtle
                !isMercuryField && !isActive && "border-white/20 bg-white/5 hover:border-white/40",
                // Hover state
                isHovered && !isActive && "border-white/60 bg-white/10"
              )}
              style={{
                top: `${field.top}%`,
                left: `${field.left}%`,
                width: `${field.width}%`,
                height: `${field.height}%`,
              }}
              aria-label={`Field ${fieldId}`}
            >
              {/* Field label */}
              {showLabels && (isActive || isHovered || isMercuryField) && (
                <span className={cn(
                  "absolute -top-6 left-1/2 -translate-x-1/2",
                  "px-2 py-0.5 rounded text-[10px] font-bold tracking-wider",
                  "athletic-condensed whitespace-nowrap",
                  isActive ? "bg-turf text-black" :
                  isMercuryField ? "bg-turf/80 text-black" :
                  "bg-white/80 text-black"
                )}>
                  {fieldId}
                </span>
              )}

              {/* Mercury indicator dot */}
              {isMercuryField && !isActive && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-turf mercury-dot" />
              )}
            </button>
          );
        })}

        {/* Parking indicators */}
        {Object.entries(parking).map(([parkingId, spot]) => (
          <div
            key={parkingId}
            className="absolute z-20 flex items-center gap-1"
            style={{
              top: `${spot.top}%`,
              left: `${spot.left}%`,
            }}
          >
            <Car className="w-4 h-4 text-gold-bright" />
            {showLabels && (
              <span className="text-[8px] text-gold-bright athletic-condensed tracking-wider">
                P
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-[10px] athletic-condensed tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-turf/30 border border-turf" />
          <span className="text-turf">MERCURY FIELDS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Car className="w-3 h-3 text-gold-bright" />
          <span className="text-gold-bright">PARKING</span>
        </div>
      </div>
    </div>
  );
}
