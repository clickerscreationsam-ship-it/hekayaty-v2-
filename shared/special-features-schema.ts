import { z } from "zod";

/**
 * 🎪 EVENT SCHEMA
 */
export const storeEventSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  bookIds: z.array(z.string()), // Collection of book IDs
  price: z.number(),
  startDate: z.string(), // ISO String
  endDate: z.string(),   // ISO String
  isActive: z.boolean().default(true),
});

export type StoreEvent = z.infer<typeof storeEventSchema>;

/**
 * 🤝 SUCCESS PARTNERS SCHEMA (DAR ALNASHR)
 */
export const successPartnerSchema = z.object({
  id: z.string(),
  name: z.string(),
  logoUrl: z.string(),
  description: z.string().optional(),
  link: z.string().url().optional(),
});

export type SuccessPartner = z.infer<typeof successPartnerSchema>;
