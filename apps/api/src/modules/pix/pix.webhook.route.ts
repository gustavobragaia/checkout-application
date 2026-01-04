import { FastifyInstance } from "fastify";
import { pixWebhookService } from "./pix.webhook.service";

export async function pixWebhookRoutes(app: FastifyInstance) {
  app.post("/webhooks/pix/mercado-pago", async (req, res) => {
    try {
      await pixWebhookService.handleMercadoPagoWebhook(req as any);
    } catch (err) {
      req.log.error({ err }, "mercado pago webhook failed");
    }

    return res.code(200).send({ ok: true });
  });
}
