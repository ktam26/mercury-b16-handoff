import { ImageResponse } from '@vercel/og';
import { OG_COLORS, OG_DIMENSIONS, formatOGDate, getShortName } from '@/lib/og-utils';
import gamesData from '@/data/games.json';

export const runtime = 'edge';
export const alt = 'Mercury Black B16 Game';
export const size = OG_DIMENSIONS;
export const contentType = 'image/png';

export default async function Image({ params }) {
  const { id } = await params;
  const game = gamesData.find((g) => g.id === id);

  if (!game) {
    // Fallback for invalid game ID
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: OG_COLORS.black,
            color: OG_COLORS.white,
            fontSize: '48px',
          }}
        >
          Game Not Found
        </div>
      ),
      { ...size }
    );
  }

  const isPast = game.result !== null;
  const isWin = isPast && game.result.us > game.result.them;
  const isLoss = isPast && game.result.us < game.result.them;
  const isTie = isPast && game.result.us === game.result.them;

  const resultText = isWin ? 'VICTORY' : isLoss ? 'DEFEAT' : isTie ? 'DRAW' : '';
  const resultColor = isWin ? OG_COLORS.win : isLoss ? OG_COLORS.loss : OG_COLORS.tie;

  const opponentShort = getShortName(game.opponent);
  const dateFormatted = formatOGDate(game.date);

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

        {/* Team logos and VS */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '48px',
            marginBottom: '24px',
          }}
        >
          {/* Mercury logo */}
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: OG_COLORS.kellyGreen,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0, 132, 61, 0.4)',
            }}
          >
            <span style={{ color: OG_COLORS.white, fontSize: '36px', fontWeight: 'bold' }}>
              AFC
            </span>
          </div>

          {/* VS text */}
          <span
            style={{
              color: OG_COLORS.white,
              opacity: 0.6,
              fontSize: '28px',
              fontWeight: 'bold',
            }}
          >
            vs
          </span>

          {/* Opponent logo placeholder */}
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: '#374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                color: OG_COLORS.white,
                fontSize: '24px',
                fontWeight: 'bold',
                textAlign: 'center',
                padding: '8px',
              }}
            >
              {opponentShort.substring(0, 3).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Team names */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: '32px',
          }}
        >
          <span style={{ color: OG_COLORS.white, fontSize: '32px', fontWeight: 'bold' }}>
            AFC
          </span>
          <span style={{ color: OG_COLORS.white, opacity: 0.5, fontSize: '24px' }}>vs</span>
          <span style={{ color: OG_COLORS.white, fontSize: '32px', fontWeight: 'bold' }}>
            {opponentShort}
          </span>
        </div>

        {/* Score or Date/Time */}
        {isPast ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {/* Score */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
              }}
            >
              <span
                style={{
                  color: OG_COLORS.white,
                  fontSize: '80px',
                  fontWeight: 'bold',
                }}
              >
                {game.result.us}
              </span>
              <span
                style={{
                  color: OG_COLORS.white,
                  opacity: 0.4,
                  fontSize: '48px',
                }}
              >
                -
              </span>
              <span
                style={{
                  color: OG_COLORS.white,
                  fontSize: '80px',
                  fontWeight: 'bold',
                }}
              >
                {game.result.them}
              </span>
            </div>

            {/* Result badge */}
            <div
              style={{
                background: resultColor,
                color: OG_COLORS.white,
                padding: '8px 24px',
                borderRadius: '20px',
                fontSize: '20px',
                fontWeight: 'bold',
                letterSpacing: '2px',
              }}
            >
              {resultText}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                color: OG_COLORS.kellyGreen,
                fontSize: '48px',
                fontWeight: 'bold',
              }}
            >
              {dateFormatted}
            </span>
            <span
              style={{
                color: OG_COLORS.white,
                opacity: 0.8,
                fontSize: '36px',
              }}
            >
              {game.time}
            </span>
          </div>
        )}

        {/* Location */}
        <p
          style={{
            color: OG_COLORS.white,
            opacity: 0.6,
            fontSize: '22px',
            marginTop: '24px',
            margin: 0,
          }}
        >
          {game.location?.name || 'TBD'}
        </p>

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
