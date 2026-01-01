import { FastifyInstance } from "fastify";
import {
  CheckoutLinkIdParamsSchema,
  CreateCheckoutLinkBodySchema,
  PatchCheckoutLinkBodySchema,
  ProductIdParamsSchema,
} from "./checkout-links.schema";
import {
  createCheckoutLink,
  disableCheckoutLink,
  enableCheckoutLink,
  getCheckoutLink,
  patchCheckoutLink,
} from "./checkout-links.service";

export async function checkoutProtectedRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  //create a checkout url
  app.post("/products/:id/checkout-links", async (req, res) => {
    const { id: productId } = ProductIdParamsSchema.parse(req.params);
    const sellerId = req.user.sub;
    const body = CreateCheckoutLinkBodySchema.parse(req.body);
    const checkoutLink = await createCheckoutLink({
      productId,
      sellerId,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });
    return res
      .code(200)
      .send({ checkoutLink, url: `/pay/${checkoutLink.slugUrl}` });
  });

  //list all checkout url of product
  app.get("/products/:id/checkout-links", async (req, res) => {
    const { id: productId } = ProductIdParamsSchema.parse(req.params);
    const sellerId = req.user.sub;

    const checkoutLink = await getCheckoutLink({ productId, sellerId });

    return res.code(200).send(checkoutLink);
  });

  //post to enable checkout link
  app.post("/checkout-links/:id/enable", async (req, res) => {
    const { id: checkoutLinkId } = CheckoutLinkIdParamsSchema.parse(req.params);
    const sellerId = req.user.sub;

    const updated = await enableCheckoutLink({ checkoutLinkId, sellerId });
    return res.code(200).send({ ...updated, url: `/pay/${updated.slugUrl}` });
  });
  //post to disable checkout link
  app.post("/checkout-links/:id/disable", async (req, res) => {
    const { id: checkoutLinkId } = CheckoutLinkIdParamsSchema.parse(req.params);
    const sellerId = req.user.sub;

    const updated = await disableCheckoutLink({ checkoutLinkId, sellerId });
    return res.code(200).send({ ...updated, url: `/pay/${updated.slugUrl}` });
  });

  //patch to change the expired time
  app.patch("/checkout-links/:id", async (req, reply) => {
    const { id: checkoutLinkId } = CheckoutLinkIdParamsSchema.parse(req.params);
    const body = PatchCheckoutLinkBodySchema.parse(req.body);

    const sellerId = req.user.sub;

    const updated = await patchCheckoutLink({
      checkoutLinkId,
      sellerId,
      expiresAt:
        body.expiresAt === undefined
          ? undefined
          : body.expiresAt
            ? new Date(body.expiresAt)
            : null,
    });

    return reply.code(200).send({ ...updated, url: `/pay/${updated.slugUrl}` });
  });
}
