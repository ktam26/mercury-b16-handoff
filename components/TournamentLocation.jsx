'use client';

import Image from 'next/image';
import { MapPin, Navigation, Car, AlertTriangle, ChevronRight, DoorOpen } from 'lucide-react';

export function TournamentLocation({ tournament }) {
  const { location } = tournament;

  return (
    <div className="mb-6 slide-in-up" style={{ animationDelay: '0.4s' }}>
      <div className="stadium-card overflow-hidden">
        {/* Venue Image */}
        <div className="relative h-44 bg-linear-to-br from-stadium-gray to-stadium-black">
          <Image
            src={location.venueImage || "/tournament/location-3d.png"}
            alt={`${location.name} Aerial View`}
            fill
            className="object-cover opacity-60"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-linear-to-t from-stadium-black via-transparent to-transparent" />

          {/* Venue Badge */}
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-stadium-black/80 backdrop-blur-sm rounded-full border border-turf/30">
            <MapPin className="w-4 h-4 text-turf" />
            <span className="athletic-condensed text-chalk-white text-sm font-semibold tracking-wider">VENUE</span>
          </div>
        </div>

        <div className="p-5">
          {/* Location Name */}
          <h3 className="athletic-heading text-lg font-bold text-chalk-white mb-1 tracking-wide">
            {location.name}
          </h3>
          <p className="athletic-condensed text-chalk-dim text-sm mb-4">
            {location.address}
          </p>

          {/* Important Notice */}
          <div className="flex items-start gap-3 p-3 bg-scoreboard-red/10 rounded-lg border border-scoreboard-red/30 mb-4">
            <AlertTriangle className="w-5 h-5 text-scoreboard-red shrink-0 mt-0.5" />
            <div>
              <p className="athletic-condensed text-scoreboard-red font-bold text-sm tracking-wider">IMPORTANT</p>
              <p className="athletic-condensed text-chalk-white text-sm">{location.note}</p>
            </div>
          </div>

          {/* Tournament Fields */}
          <div className="mb-4">
            <p className="athletic-condensed text-chalk-dim text-xs uppercase tracking-[0.15em] mb-2 font-semibold">
              Tournament Fields
            </p>
            {location.fields && location.fields.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {location.fields.map((field) => (
                  <div
                    key={field}
                    className="field-marker px-3 py-1.5 rounded text-sm"
                  >
                    {field}
                  </div>
                ))}
              </div>
            ) : (
              <p className="athletic-condensed text-chalk-dim text-sm italic">Pending</p>
            )}
          </div>

          {/* Parking Info */}
          <div className="flex items-start gap-3 p-3 bg-stadium-gray rounded-lg border border-stadium-border mb-4">
            <Car className="w-5 h-5 text-turf shrink-0 mt-0.5" />
            <div>
              <p className="athletic-condensed text-chalk-white font-semibold text-sm">Parking</p>
              {location.parking ? (
                <p className="athletic-condensed text-chalk-dim text-sm">{location.parking}</p>
              ) : (
                <p className="athletic-condensed text-chalk-dim text-sm italic">Pending</p>
              )}
            </div>
          </div>

          {/* Bathrooms Info */}
          {tournament.eventInfo?.bathrooms && (
            <div className="flex items-start gap-3 p-3 bg-stadium-gray rounded-lg border border-stadium-border mb-4">
              <DoorOpen className="w-5 h-5 text-turf shrink-0 mt-0.5" />
              <div>
                <p className="athletic-condensed text-chalk-white font-semibold text-sm">Bathrooms</p>
                <p className="athletic-condensed text-chalk-dim text-sm">{tournament.eventInfo.bathrooms}</p>
              </div>
            </div>
          )}

          {/* Directions Button */}
          <a
            href={location.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Get directions to ${location.name}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-linear-to-r from-turf-dim to-turf text-stadium-black rounded-lg athletic-condensed font-bold tracking-wider text-sm hover:opacity-90 transition-opacity"
          >
            <Navigation className="w-4 h-4" />
            GET DIRECTIONS
            <ChevronRight className="w-4 h-4" />
          </a>

          {/* Embedded Map */}
          <div className="mt-4 rounded-lg overflow-hidden border border-stadium-border">
            <iframe
              src={location.embedUrl}
              width="100%"
              height="180"
              style={{ border: 0, filter: 'grayscale(50%) invert(92%) contrast(90%)' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`${location.name} Map`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
