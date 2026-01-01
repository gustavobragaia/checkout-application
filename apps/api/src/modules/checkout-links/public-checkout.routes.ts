import { FastifyInstance } from "fastify";
import { SlugParamsSchema } from "./checkout-links.schema";
import { resolvePublicCheckoutBySlug } from "./checkout-links.service";

export async function checkoutPublicRoutes(app: FastifyInstance) {
  app.get("/pay/:slug", async (req, res) => {
    const { slug } = SlugParamsSchema.parse(req.params);

    try {
      const payload = await resolvePublicCheckoutBySlug({ slug });

      // TODO(EPIC 3.5): log CHECKOUT_VIEW here (non-blocking)
      // Ex: logEvent({ type: "CHECKOUT_VIEW", slug, req })

      return res.code(200).send(payload);
    } catch (err) {
      // TODO(EPIC 3.5): if CustomError status is 410/404, log CHECKOUT_BLOCKED with reason (non-blocking)
      // Ex: logEvent({ type: "CHECKOUT_BLOCKED", slug, reason, req })

      throw err; // deixa seu errorHandler global cuidar
    }
  });
}
