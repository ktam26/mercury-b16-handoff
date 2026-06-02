'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, MapPin } from 'lucide-react';
import { FieldMap } from './FieldMap';
import { cn } from '@/lib/utils';

export function FieldMapSheet({
  isOpen,
  onClose,
  activeField,
  fieldMap,
  tournamentLocation
}) {
  // Close on escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const googleMapsUrl = tournamentLocation?.googleMapsUrl ||
    `https://maps.google.com/?q=${encodeURIComponent(tournamentLocation?.name || 'tournament venue')}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Sheet - Mobile: bottom sheet, Desktop: centered modal */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50 bg-stadium-black border-t border-stadium-border",
              "md:rounded-xl md:border md:max-w-lg md:w-full",
              // Mobile: bottom sheet
              "bottom-0 left-0 right-0 max-h-[75vh] rounded-t-xl",
              // Desktop: centered
              "md:bottom-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
              "md:max-h-[80vh]"
            )}
          >
            {/* Drag handle (mobile) */}
            <div className="md:hidden flex justify-center py-2">
              <div className="w-10 h-1 bg-stadium-border rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-stadium-border">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-turf" />
                <div>
                  <h3 className="athletic-heading text-sm font-bold text-chalk-white tracking-wider">
                    FIND FIELD {activeField}
                  </h3>
                  <p className="text-[10px] text-chalk-dim athletic-condensed tracking-wider">
                    {tournamentLocation?.name?.toUpperCase() || 'TOURNAMENT VENUE'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-stadium-gray transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-chalk-dim" />
              </button>
            </div>

            {/* Map */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <FieldMap
                fieldMap={fieldMap}
                activeField={activeField}
                showLabels={true}
              />

              {/* Field info */}
              {activeField && fieldMap?.fields?.[activeField] && (
                <div className="mt-4 p-3 bg-stadium-gray rounded-lg border border-stadium-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-turf athletic-heading text-lg font-bold">
                        Field {activeField}
                      </span>
                      <span className="ml-2 text-[10px] text-chalk-dim athletic-condensed tracking-wider">
                        {fieldMap.fields[activeField].format}
                      </span>
                    </div>
                    {fieldMap.mercuryFields?.includes(activeField) && (
                      <span className="px-2 py-1 bg-turf/20 text-turf text-[10px] athletic-condensed tracking-wider rounded">
                        MERCURY GAME
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-stadium-border space-y-2">
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-linear-to-r from-turf-dim to-turf text-stadium-black font-bold athletic-condensed tracking-wider rounded-lg hover:opacity-90 transition-opacity"
              >
                <Navigation className="w-4 h-4" />
                GET DIRECTIONS
              </a>
              <button
                onClick={onClose}
                className="w-full py-3 bg-stadium-gray text-chalk-dim athletic-condensed tracking-wider rounded-lg hover:bg-stadium-border transition-colors"
              >
                CLOSE
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
