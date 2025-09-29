import z from "zod";

/**
 * Types shared between the client and server go here.
 */

export const TelegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
  is_premium: z.boolean().optional(),
  photo_url: z.string().optional(),
});

export type TelegramUser = z.infer<typeof TelegramUserSchema>;

export const TelegramWebAppInitDataSchema = z.object({
  user: TelegramUserSchema,
  chat_instance: z.string().optional(),
  chat_type: z.string().optional(),
  auth_date: z.number(),
  hash: z.string(),
});

export type TelegramWebAppInitData = z.infer<typeof TelegramWebAppInitDataSchema>;

export const AuthResponseSchema = z.object({
  success: z.boolean(),
  user: TelegramUserSchema.optional(),
  error: z.string().optional(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
