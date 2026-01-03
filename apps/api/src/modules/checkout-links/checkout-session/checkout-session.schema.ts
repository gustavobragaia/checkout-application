import z from "zod";

export const CustomerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8).max(20),
});

export const MethodSchema = z.object({
  method: z.enum(["PIX", "CARD", "CRYPTO"]),
});
