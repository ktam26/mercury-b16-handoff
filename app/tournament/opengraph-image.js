import { ImageResponse } from '@vercel/og';
import { OG_COLORS, OG_DIMENSIONS, formatOGDate } from '@/lib/og-utils';
import tournamentData from '@/data/tournament.json';

export const runtime = 'edge';
export const alt = `${tournamentData.name} - Mercury Black B16`;
export const size = OG_DIMENSIONS;
export const contentType = 'image/png';

export default async function Image() {
  const startDate = formatOGDate(tournamentData.dates.start);
  const endDate = formatOGDate(tournamentData.dates.end);

  // Find Mercury's bracket
  const mercuryBracket = Object.keys(tournamentData.brackets).find((key) =>
    tournamentData.brackets[key].teams.some(
      (team) =>
        team.name.toLowerCase().includes('mercury') ||
        team.name.toLowerCase().includes('almaden')
    )
  );

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
          padding: '40px',
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

        {/* Trophy icon placeholder */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: OG_COLORS.gold,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <span style={{ fontSize: '40px' }}>🏆</span>
        </div>

        {/* Tournament name */}
        <h1
          style={{
            color: OG_COLORS.white,
            fontSize: '52px',
            fontWeight: 'bold',
            margin: 0,
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          {tournamentData.name}
        </h1>

        {/* Dates and division */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          <span
            style={{
              color: OG_COLORS.kellyGreen,
              fontSize: '28px',
              fontWeight: 'bold',
            }}
          >
            {startDate} - {endDate}
          </span>
          <span
            style={{
              color: OG_COLORS.white,
              opacity: 0.5,
              fontSize: '24px',
            }}
          >
            •
          </span>
          <span
            style={{
              color: OG_COLORS.white,
              opacity: 0.8,
              fontSize: '24px',
            }}
          >
            {tournamentData.division}
          </span>
        </div>

        {/* Location */}
        <p
          style={{
            color: OG_COLORS.white,
            opacity: 0.7,
            fontSize: '24px',
            margin: 0,
            marginBottom: '32px',
          }}
        >
          {tournamentData.location.name}
        </p>

        {/* Mercury badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'rgba(0, 132, 61, 0.2)',
            padding: '16px 32px',
            borderRadius: '12px',
            border: `2px solid ${OG_COLORS.kellyGreen}`,
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: OG_COLORS.kellyGreen,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: OG_COLORS.white, fontSize: '18px', fontWeight: 'bold' }}>
              AFC
            </span>
          </div>
          <span style={{ color: OG_COLORS.white, fontSize: '24px', fontWeight: 'bold' }}>
            Mercury Black B16
          </span>
          {mercuryBracket && (
            <span
              style={{
                color: OG_COLORS.gold,
                fontSize: '20px',
                fontWeight: 'bold',
              }}
            >
              Bracket {mercuryBracket}
            </span>
          )}
        </div>

        {/* Branding */}
        <p
          style={{
            position: 'absolute',
            bottom: '24px',
            color: OG_COLORS.white,
            opacity: 0.4,
            fontSize: '16px',
            margin: 0,
          }}
        >
          Mercury Black B16 • Almaden FC
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
