'use client';

import { useState } from 'react';
import { Map, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function TournamentFieldMap({ fieldMap, onFieldClick }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!fieldMap) return null;

  return (
    <div className="mb-6 slide-in-up" style={{ animationDelay: '0.3s' }}>
      <div className="stadium-card p-5">
        {/* Header with toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="field-map-content"
          className="w-full flex items-center justify-between group"
        >
          <h3 className="athletic-heading text-sm font-bold text-chalk-white tracking-wider flex items-center gap-2">
            <Map className="w-4 h-4 text-turf" />
            FIELD MAP
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-chalk-dim athletic-condensed tracking-wider">
              {isExpanded ? 'TAP TO CLOSE' : 'TAP TO VIEW'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-chalk-dim group-hover:text-chalk-white transition-colors" />
            ) : (
              <ChevronDown className="w-4 h-4 text-chalk-dim group-hover:text-chalk-white transition-colors" />
            )}
          </div>
        </button>

        {/* Collapsible content */}
        <div
          id="field-map-content"
          className={cn(
            "overflow-hidden transition-all duration-300",
            isExpanded ? "max-h-[800px] opacity-100 mt-4" : "max-h-0 opacity-0"
          )}
        >
          {/* Simple map image - no overlays */}
          <div className="relative w-full rounded-lg overflow-hidden border border-stadium-border">
            <Image
              src={fieldMap.imageUrl || "/images/delmar-field-map.png"}
              alt={`Field layout showing fields ${fieldMap.mercuryFields?.join(', ')} where Mercury plays`}
              width={2000}
              height={1545}
              className="w-full h-auto"
            />
          </div>

          {/* Mercury fields quick reference */}
          <div className="mt-4 p-3 bg-stadium-black rounded-lg border border-stadium-border">
            <p className="text-[10px] text-chalk-dim athletic-condensed tracking-wider mb-2">
              MERCURY PLAYS ON:
            </p>
            <div className="flex flex-wrap gap-2">
              {fieldMap.mercuryFields?.map((field) => (
                <span
                  key={field}
                  className="px-3 py-1.5 bg-turf/10 border border-turf/30 rounded-lg text-turf athletic-condensed text-xs font-semibold tracking-wider"
                >
                  Field {field}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
