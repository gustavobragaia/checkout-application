import { FastifyRequest } from "fastify";
import { prisma } from "../../lib/prisma";
import { MercadoPagoProvider } from "./providers/mercado-pago.provider";

//need to change the status of order to COMPLETE
const mpProvider = new MercadoPagoProvider(
  process.env.MERCADO_PAGO_ACCESS_TOKEN!,
);

type MercadoPagoWebhookBody = {
  data?: { id?: string };
  id?: string;
};

type MercadoPagoWebhookQuery = {
  id?: string;
  topic?: string;
  type?: string;
  "data.id"?: string;
};

export type MercadoPagoWebhookRequest = FastifyRequest<{
  Body: MercadoPagoWebhookBody;
  Querystring: MercadoPagoWebhookQuery;
}>;

function extractProviderPaymentId(req: MercadoPagoWebhookRequest) {
  const body = req.body ?? {};
  const dataId = body?.data?.id; // id do PAGAMENTO
  const eventId = body?.id; // id do EVENTO (não usar!)
  const q = req.query ?? {};

  req.log?.info?.({ dataId, eventId, q }, "mp webhook ids");

  if (dataId) return String(dataId);
  if (q.id) return String(q.id);
  if (q["data.id"]) return String(q["data.id"]);

  return null;
}

export const pixWebhookService = {
  async handleMercadoPagoWebhook(req: MercadoPagoWebhookRequest) {
    const providerPaymentId = extractProviderPaymentId(req);
    if (!providerPaymentId) {
      req.log.warn("pix webhook: missing providerPaymentId");
      return;
    }

    //find the payment on db
    const payment = await prisma.payment.findUnique({
      where: { providerPaymentId },
      include: { session: true },
    });
    if (!payment) {
      req.log.warn({ providerPaymentId }, "pix webhook: payment not found");
      return;
    }

    //minimum idempotency
    if (payment.status === "PAID") {
      req.log.info({ providerPaymentId }, "pix webhook: already paid");
      return;
    }

    //confirm status on MP
    const mpPayment = await mpProvider.getPayment(providerPaymentId);
    const mpStatus = mpPayment?.status;
    req.log.info(
      { providerPaymentId, mpStatus },
      "pix webhook: provider status",
    );

    if (mpStatus === "approved") {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: "PAID" },
        }),
        prisma.checkoutSession.update({
          where: { id: payment.sessionId },
          data: { status: "COMPLETED" },
        }),
      ]);
      return;
    }
  },
};
