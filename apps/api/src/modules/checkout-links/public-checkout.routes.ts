import { FastifyInstance } from "fastify";
import { SlugParamsSchema } from "./checkout-links.schema";
import { resolvePublicCheckoutBySlug } from "./checkout-links.service";

export async function checkoutPublicRoutes(app: FastifyInstance) {
  //get the single product
  app.get("/pay/:slug", async (req, res) => {
    const { slug } = SlugParamsSchema.parse(req.params);
    const payload = await resolvePublicCheckoutBySlug({ slug });

    return res.code(200).send(payload);
  });
}
