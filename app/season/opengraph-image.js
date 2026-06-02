import { ImageResponse } from '@vercel/og';
import { OG_COLORS, OG_DIMENSIONS } from '@/lib/og-utils';
import gamesData from '@/data/games.json';

export const runtime = 'edge';
export const alt = 'Mercury Black B16 Season Stats';
export const size = OG_DIMENSIONS;
export const contentType = 'image/png';

// Calculate season stats from games data
function getSeasonStats() {
  let wins = 0;
  let losses = 0;
  let ties = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  const recentForm = [];

  const now = new Date();

  // Process completed games
  const completedGames = gamesData
    .filter((game) => game.result !== null)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  completedGames.forEach((game) => {
    const { us, them } = game.result;
    goalsFor += us;
    goalsAgainst += them;

    if (us > them) {
      wins++;
      if (recentForm.length < 5) recentForm.push('W');
    } else if (us < them) {
      losses++;
      if (recentForm.length < 5) recentForm.push('L');
    } else {
      ties++;
      if (recentForm.length < 5) recentForm.push('T');
    }
  });

  return {
    wins,
    losses,
    ties,
    goalsFor,
    goalsAgainst,
    goalDiff: goalsFor - goalsAgainst,
    recentForm: recentForm.reverse(), // Show oldest to newest
  };
}

export default async function Image() {
  const stats = getSeasonStats();
  const record = `${stats.wins}-${stats.losses}-${stats.ties}`;
  const goalDiffStr =
    stats.goalDiff > 0 ? `+${stats.goalDiff}` : stats.goalDiff.toString();

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

        {/* Logo */}
        <div
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: OG_COLORS.kellyGreen,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 10px 40px rgba(0, 132, 61, 0.3)',
          }}
        >
          <span style={{ color: OG_COLORS.white, fontSize: '48px', fontWeight: 'bold' }}>
            AFC
          </span>
        </div>

        {/* Team name */}
        <h1
          style={{
            color: OG_COLORS.white,
            fontSize: '44px',
            fontWeight: 'bold',
            margin: 0,
            marginBottom: '32px',
          }}
        >
          Mercury Black B16
        </h1>

        {/* Stats row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '48px',
            marginBottom: '32px',
          }}
        >
          {/* Record */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                color: OG_COLORS.white,
                fontSize: '56px',
                fontWeight: 'bold',
              }}
            >
              {record}
            </span>
            <span
              style={{
                color: OG_COLORS.white,
                opacity: 0.6,
                fontSize: '20px',
              }}
            >
              Record
            </span>
          </div>

          {/* Divider */}
          <div
            style={{
              width: '2px',
              height: '60px',
              background: OG_COLORS.white,
              opacity: 0.2,
            }}
          />

          {/* Goal Differential */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                color: stats.goalDiff >= 0 ? OG_COLORS.win : OG_COLORS.loss,
                fontSize: '56px',
                fontWeight: 'bold',
              }}
            >
              {goalDiffStr}
            </span>
            <span
              style={{
                color: OG_COLORS.white,
                opacity: 0.6,
                fontSize: '20px',
              }}
            >
              Goal Diff
            </span>
          </div>
        </div>

        {/* Recent form */}
        {stats.recentForm.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                color: OG_COLORS.white,
                opacity: 0.6,
                fontSize: '18px',
                marginRight: '8px',
              }}
            >
              Recent Form:
            </span>
            {stats.recentForm.map((result, i) => (
              <div
                key={i}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  background:
                    result === 'W'
                      ? OG_COLORS.win
                      : result === 'L'
                      ? OG_COLORS.loss
                      : OG_COLORS.tie,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: OG_COLORS.white,
                  fontSize: '18px',
                  fontWeight: 'bold',
                }}
              >
                {result}
              </div>
            ))}
          </div>
        )}

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
          Mercury Black B16 • Almaden FC • 2024-25 Season
        </p>
      </div>
    ),
    {
      ...size,
    }
  );
}
