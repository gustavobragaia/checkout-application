import z from "zod";

export const CurrencySchema = z.enum(["USD", "CAD", "BRL", "EUR"]);
export const CapabilityTypeSchema = z.enum([
  "PAY_PIX",
  "PAY_CARD",
  "PAY_CRYPTO",
]);

export const CreateProductSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
  priceCents: z.number().int().min(0),
  currency: CurrencySchema.default("BRL"),
});

export const ProductIdParamsSchema = z.object({
  id: z.string().uuid(),
});
export const UpdateProductBodySchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    description: z.string().max(1000).nullable().optional(),
    priceCents: z.number().int().min(0).optional(),
    currency: CurrencySchema.optional(),
  })
  // garante que veio pelo menos 1 campo
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Provide at least one field to update",
  });

export const PutCapabilitiesBodySchema = z.object({
  capabilities: z.array(
    z.object({
      type: CapabilityTypeSchema,
      enabled: z.boolean(),
      metadata: z.any().optional(),
    }),
  ),
});
