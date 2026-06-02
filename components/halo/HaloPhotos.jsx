'use client';

import Image from 'next/image';
import { Camera, ExternalLink } from 'lucide-react';
import albumsData from '@/data/albums.json';
import { HaloPage, HaloCard, HaloSectionLabel } from './HaloShell';

export default function HaloPhotos() {
  const albums = Array.isArray(albumsData) ? [...albumsData] : [];
  const hero = albums[0];
  const rest = albums.slice(1);

  if (albums.length === 0) {
    return (
      <HaloPage>
        <div className="max-w-5xl mx-auto px-4 md:px-9 pt-4 md:pt-6">
          <h1
            className="text-[22px] md:text-[28px] font-bold mb-4 px-1"
            style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
          >
            Team Photos
          </h1>
          <HaloCard className="p-10 text-center">
            <Camera
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: 'var(--halo-faint)' }}
            />
            <div
              className="text-[16px] font-bold"
              style={{ color: 'var(--halo-ink)' }}
            >
              No albums yet
            </div>
            <div
              className="text-[13px] mt-1"
              style={{ color: 'var(--halo-muted)' }}
            >
              Photo albums will appear here after games. Check back soon!
            </div>
          </HaloCard>
        </div>
      </HaloPage>
    );
  }

  return (
    <HaloPage>
      {/* MOBILE */}
      <div className="md:hidden max-w-5xl mx-auto px-4 pt-4">
        <h1
          className="text-[22px] font-bold mb-4 px-1"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
        >
          Team Photos
        </h1>
        <HeroAlbum album={hero} variant="mobile" />
        {rest.length > 0 && (
          <>
            <HaloSectionLabel className="mt-5">
              Albums · {albums.length}
            </HaloSectionLabel>
            <div className="grid grid-cols-2 gap-3">
              {rest.map((a) => (
                <AlbumCard key={a.id} album={a} />
              ))}
            </div>
          </>
        )}
        <div className="h-8" />
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block max-w-6xl mx-auto px-9 pt-6">
        <h1
          className="text-[28px] font-bold mb-4 px-1"
          style={{ color: 'var(--halo-ink)', letterSpacing: '-0.02em' }}
        >
          Team Photos
        </h1>
        <HeroAlbum album={hero} variant="desktop" />
        {rest.length > 0 && (
          <>
            <div className="flex items-baseline justify-between mt-6 mb-3 px-1">
              <HaloSectionLabel className="mb-0 px-0">
                All albums · {albums.length}
              </HaloSectionLabel>
              <div
                className="text-[13px] font-semibold"
                style={{ color: 'var(--halo-muted)' }}
              >
                Sorted by newest
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {rest.map((a) => (
                <AlbumCard key={a.id} album={a} />
              ))}
            </div>
          </>
        )}
        <div className="h-12" />
      </div>
    </HaloPage>
  );
}

function isChampionAlbum(album) {
  if (!album?.title) return false;
  const t = album.title.toLowerCase();
  return /champ|champion|cup|trophy/i.test(t);
}

function HeroAlbum({ album, variant }) {
  const champion = isChampionAlbum(album);
  const aspect = variant === 'desktop' ? 'aspect-[21/9]' : 'aspect-[16/9]';

  if (champion) {
    return (
      <a
        href={album.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <div
          className={
            'rounded-3xl relative overflow-hidden text-white ' +
            (variant === 'desktop' ? 'p-8' : 'p-6')
          }
          style={{
            background:
              'linear-gradient(135deg, var(--halo-accent) 0%, #0aa352 100%)',
            boxShadow: 'var(--halo-shadow-strong)',
            minHeight: variant === 'desktop' ? 320 : 220,
          }}
        >
          {album.coverImage && (
            <Image
              src={album.coverImage}
              alt={album.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover object-top"
            />
          )}
          {/* Two-stop overlay: dark at bottom for legibility, accent tint top-left for the champion vibe */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(0,132,61,0.55) 0%, rgba(10,163,82,0.20) 45%, rgba(0,0,0,0.75) 100%)',
            }}
          />
          <div className="relative">
            <div
              className="text-[10px] font-extrabold opacity-95"
              style={{ letterSpacing: '0.22em' }}
            >
              ◆ CHAMPION
            </div>
            <div
              className={
                'font-bold mt-2 leading-tight ' +
                (variant === 'desktop' ? 'text-[32px]' : 'text-[22px]')
              }
              style={{ letterSpacing: '-0.02em' }}
            >
              {album.title}
            </div>
            <div
              className={
                'opacity-90 mt-2 ' +
                (variant === 'desktop' ? 'text-[13px]' : 'text-[12px]')
              }
            >
              {album.date}
              {album.photoCount > 0 ? ` · ${album.photoCount} photos` : ''}
              {album.photographer ? ` · by ${album.photographer}` : ''}
            </div>
            <div className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold">
              View album <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </a>
    );
  }

  // Plain newest album hero
  return (
    <a
      href={album.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <HaloCard className="overflow-hidden">
        <div className={'relative w-full ' + aspect}>
          {album.coverImage ? (
            <Image
              src={album.coverImage}
              alt={album.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div
              className="w-full h-full grid place-items-center"
              style={{ background: 'var(--halo-glass-strong)' }}
            >
              <Camera
                className="w-16 h-16"
                style={{ color: 'var(--halo-faint)' }}
              />
            </div>
          )}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.65) 100%)',
            }}
          />
          <div
            className={
              'absolute inset-x-0 bottom-0 text-white ' +
              (variant === 'desktop' ? 'p-7' : 'p-5')
            }
          >
            <div
              className="text-[10px] font-extrabold opacity-90"
              style={{ letterSpacing: '0.22em' }}
            >
              ◆ LATEST ALBUM
            </div>
            <div
              className={
                'font-bold mt-2 leading-tight ' +
                (variant === 'desktop' ? 'text-[26px]' : 'text-[20px]')
              }
              style={{ letterSpacing: '-0.02em' }}
            >
              {album.title}
            </div>
            <div
              className={
                'opacity-85 mt-1 ' +
                (variant === 'desktop' ? 'text-[13px]' : 'text-[12px]')
              }
            >
              {album.date}
              {album.photoCount > 0 ? ` · ${album.photoCount} photos` : ''}
              {album.photographer ? ` · by ${album.photographer}` : ''}
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold">
              View album <ExternalLink className="w-3 h-3" />
            </div>
          </div>
        </div>
      </HaloCard>
    </a>
  );
}

function AlbumCard({ album }) {
  return (
    <a
      href={album.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <HaloCard className="overflow-hidden transition-transform group-hover:-translate-y-0.5">
        <div className="relative w-full aspect-[4/3]">
          {album.coverImage ? (
            <Image
              src={album.coverImage}
              alt={album.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover object-top"
            />
          ) : (
            <div
              className="w-full h-full grid place-items-center"
              style={{ background: 'var(--halo-glass-strong)' }}
            >
              <Camera
                className="w-10 h-10"
                style={{ color: 'var(--halo-faint)' }}
              />
            </div>
          )}
          {album.photoCount > 0 && (
            <div
              className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
              style={{
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {album.photoCount}
            </div>
          )}
        </div>
        <div className="p-3">
          <div
            className="text-[13px] font-semibold truncate"
            style={{ color: 'var(--halo-ink)', letterSpacing: '-0.01em' }}
          >
            {album.title}
          </div>
          <div
            className="text-[11px] mt-1"
            style={{ color: 'var(--halo-muted)' }}
          >
            {album.date}
            {album.photoCount > 0 ? ` · ${album.photoCount} photos` : ''}
          </div>
        </div>
      </HaloCard>
    </a>
  );
}
