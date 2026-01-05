import { FastifyInstance, FastifyReply } from "fastify";
import {
  MercadoPagoWebhookRequest,
  pixWebhookService,
} from "./pix.webhook.service";

export async function pixWebhookRoutes(app: FastifyInstance) {
  const handler = async (
    req: MercadoPagoWebhookRequest,
    res: FastifyReply,
  ) => {
    req.log.info({ body: req.body, query: req.query }, "pix webhook received");

    try {
      await pixWebhookService.handleMercadoPagoWebhook(req);
    } catch (err) {
      req.log.error({ err }, "mercado pago webhook failed");
    }

    return res.code(200).send({ ok: true });
  };

  app.post("/webhooks/pix/mercado-pago", handler);
  app.post("/webhooks/pix/mercado-pag", handler);
}
