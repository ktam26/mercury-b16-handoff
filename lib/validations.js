import { z } from 'zod';

/**
 * Schema for game location data
 */
const LocationSchema = z.object({
  name: z.string(),
  field: z.string().optional(),
  address: z.string(),
  googleMapsUrl: z.string().url(),
  embedUrl: z.string().url().optional(),
});

/**
 * Schema for game result data
 */
const ResultSchema = z.object({
  us: z.number().int().min(0),
  them: z.number().int().min(0),
  goalScorers: z.array(z.string()).optional(),
}).nullable();

/**
 * Schema for individual game data
 */
export const GameSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string(),
  opponent: z.string(),
  opponentRecord: z.string().optional(),
  opponentGoals: z.string().optional(),
  location: LocationSchema,
  homeAway: z.enum(['home', 'away']),
  jersey: z.string(),
  socks: z.string(),
  result: ResultSchema,
  weatherUrl: z.string().url().optional(),
  gotsportUrl: z.string().url().optional(),
  photoAlbumUrl: z.string().url().nullable().optional(),
  mercuryRecentResults: z.array(z.enum(['W', 'L', 'T'])).optional(),
  opponentRecentResults: z.array(z.enum(['W', 'L', 'T'])).optional(),
});

/**
 * Schema for array of games
 */
export const GamesArraySchema = z.array(GameSchema);

/**
 * Schema for team info data
 */
export const TeamInfoSchema = z.object({
  name: z.string(),
  shortName: z.string(),
  ageGroup: z.string(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
  }),
  managerPhone: z.string(),
  links: z.object({
    gotsportSchedule: z.string().url(),
    gotsportStandings: z.string().url(),
  }),
});

/**
 * Schema for photo album data
 */
export const AlbumSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  photoCount: z.number().int().positive(),
  coverImage: z.string(),
  url: z.string().url(),
  photographer: z.string(),
});

/**
 * Schema for array of albums
 */
export const AlbumsArraySchema = z.array(AlbumSchema);

/**
 * Validates game data and returns parsed result
 * @param {unknown} data - The data to validate
 * @returns {z.infer<typeof GamesArraySchema>} Validated games array
 * @throws {z.ZodError} If validation fails
 */
export function validateGamesData(data) {
  try {
    return GamesArraySchema.parse(data);
  } catch (error) {
    console.error('Game data validation failed:', error);
    throw new Error('Invalid game data format');
  }
}

/**
 * Validates team info data and returns parsed result
 * @param {unknown} data - The data to validate
 * @returns {z.infer<typeof TeamInfoSchema>} Validated team info
 * @throws {z.ZodError} If validation fails
 */
export function validateTeamInfo(data) {
  try {
    return TeamInfoSchema.parse(data);
  } catch (error) {
    console.error('Team info validation failed:', error);
    throw new Error('Invalid team info format');
  }
}

/**
 * Validates album data and returns parsed result
 * @param {unknown} data - The data to validate
 * @returns {z.infer<typeof AlbumsArraySchema>} Validated albums array
 * @throws {z.ZodError} If validation fails
 */
export function validateAlbumsData(data) {
  try {
    return AlbumsArraySchema.parse(data);
  } catch (error) {
    console.error('Album data validation failed:', error);
    throw new Error('Invalid album data format');
  }
}