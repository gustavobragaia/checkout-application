import z from "zod";

export const SlugParamsSchema = z.object({
  slug: z.string().min(6).max(64),
});
export const ProductIdParamsSchema = z.object({
  id: z.string().uuid(),
});
export const CreateCheckoutLinkBodySchema = z.object({
  expiresAt: z.string().datetime().optional(), // ISO string
});
export const CheckoutLinkIdParamsSchema = z.object({
  id: z.string().uuid(),
});
export const PatchCheckoutLinkBodySchema = z
  .object({
    expiresAt: z.string().datetime().nullable().optional(), // null = remove expiração
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Provide at least one field to update",
  });
