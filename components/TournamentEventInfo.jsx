'use client';

import { AlertTriangle, Camera, Ban, Mail, Phone, Globe, Instagram } from 'lucide-react';

export function TournamentEventInfo({ eventInfo }) {
  if (!eventInfo) return null;

  return (
    <div className="mb-6 slide-in-up" style={{ animationDelay: '0.45s' }}>
      <div className="stadium-card p-5">
        <h3 className="athletic-heading text-base font-bold text-chalk-white tracking-wider mb-4">
          EVENT DAY INFO
        </h3>

        {/* Check-in */}
        {eventInfo.checkIn && (
          <div className="flex items-start gap-3 p-3 bg-scoreboard-red/10 rounded-lg border border-scoreboard-red/30 mb-4">
            <AlertTriangle className="w-5 h-5 text-scoreboard-red shrink-0 mt-0.5" />
            <div>
              <p className="athletic-condensed text-scoreboard-red font-bold text-sm tracking-wider">CHECK-IN</p>
              <p className="athletic-condensed text-chalk-white text-sm">{eventInfo.checkIn.description}</p>
              {eventInfo.checkIn.note && (
                <p className="athletic-condensed text-chalk-dim text-xs mt-1 italic">{eventInfo.checkIn.note}</p>
              )}
            </div>
          </div>
        )}

        {/* Photographer */}
        {eventInfo.photographer && (
          <div className="flex items-start gap-3 p-3 bg-stadium-gray rounded-lg border border-stadium-border mb-4">
            <Camera className="w-5 h-5 text-turf shrink-0 mt-0.5" />
            <div className="w-full">
              <p className="athletic-condensed text-chalk-white font-semibold text-sm">{eventInfo.photographer.name}</p>
              <p className="athletic-condensed text-chalk-dim text-sm mb-3">{eventInfo.photographer.description}</p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`mailto:${eventInfo.photographer.email}`}
                  aria-label={`Email ${eventInfo.photographer.name}`}
                  className="flex items-center gap-2 px-3 py-2.5 bg-stadium-black rounded-lg border border-stadium-border hover:border-turf/50 transition-colors"
                >
                  <Mail className="w-4 h-4 text-turf shrink-0" />
                  <span className="athletic-condensed text-chalk-dim text-xs truncate">Email</span>
                </a>
                <a
                  href={`sms:${eventInfo.photographer.phone}`}
                  aria-label={`Text or call ${eventInfo.photographer.name}`}
                  className="flex items-center gap-2 px-3 py-2.5 bg-stadium-black rounded-lg border border-stadium-border hover:border-turf/50 transition-colors"
                >
                  <Phone className="w-4 h-4 text-turf shrink-0" />
                  <span className="athletic-condensed text-chalk-dim text-xs truncate">Text/Call</span>
                </a>
                <a
                  href={eventInfo.photographer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View photos on ${eventInfo.photographer.name} website`}
                  className="flex items-center gap-2 px-3 py-2.5 bg-stadium-black rounded-lg border border-stadium-border hover:border-turf/50 transition-colors"
                >
                  <Globe className="w-4 h-4 text-turf shrink-0" />
                  <span className="athletic-condensed text-chalk-dim text-xs truncate">Photos</span>
                </a>
                <a
                  href={eventInfo.photographer.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${eventInfo.photographer.name} on Instagram`}
                  className="flex items-center gap-2 px-3 py-2.5 bg-stadium-black rounded-lg border border-stadium-border hover:border-turf/50 transition-colors"
                >
                  <Instagram className="w-4 h-4 text-turf shrink-0" />
                  <span className="athletic-condensed text-chalk-dim text-xs truncate">Instagram</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Restrictions */}
        {eventInfo.restrictions && eventInfo.restrictions.length > 0 && (
          <div className="flex items-start gap-3 p-3 bg-scoreboard-red/5 rounded-lg border border-scoreboard-red/20">
            <Ban className="w-5 h-5 text-scoreboard-red shrink-0 mt-0.5" />
            <div>
              <p className="athletic-condensed text-scoreboard-red font-bold text-sm tracking-wider">RESTRICTIONS</p>
              <ul className="mt-1 space-y-1">
                {eventInfo.restrictions.map((restriction, i) => (
                  <li key={i} className="athletic-condensed text-chalk-dim text-sm flex items-start gap-2">
                    <span className="text-scoreboard-red mt-1 text-xs">&#x2022;</span>
                    {restriction}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
