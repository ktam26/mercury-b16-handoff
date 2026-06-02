import { ImageResponse } from '@vercel/og';
import { OG_COLORS, OG_DIMENSIONS } from '@/lib/og-utils';

export const runtime = 'edge';
export const alt = 'Mercury Black B16 - Youth Soccer Team App';
export const size = OG_DIMENSIONS;
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(180deg, ${OG_COLORS.black} 0%, ${OG_COLORS.darkGray} 100%)`,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Green accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: OG_COLORS.kellyGreen,
          }}
        />

        {/* Logo placeholder circle */}
        <div
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: OG_COLORS.kellyGreen,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '32px',
            boxShadow: '0 10px 40px rgba(0, 132, 61, 0.3)',
          }}
        >
          <span style={{ color: OG_COLORS.white, fontSize: '64px', fontWeight: 'bold' }}>
            AFC
          </span>
        </div>

        {/* Team name */}
        <h1
          style={{
            color: OG_COLORS.white,
            fontSize: '56px',
            fontWeight: 'bold',
            margin: 0,
            marginBottom: '12px',
          }}
        >
          Mercury Black B16
        </h1>

        {/* Subtitle */}
        <p
          style={{
            color: OG_COLORS.white,
            opacity: 0.8,
            fontSize: '28px',
            margin: 0,
          }}
        >
          Almaden FC • San Jose, CA
        </p>

        {/* Branding */}
        <p
          style={{
            position: 'absolute',
            bottom: '24px',
            color: OG_COLORS.white,
            opacity: 0.5,
            fontSize: '18px',
            margin: 0,
          }}
        >
          Youth Soccer Team App
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
