import { CustomError } from "../../errors/custom-error";
import { prisma } from "../../lib/prisma";
import { MercadoPagoProvider } from "./providers/mercado-pago.provider";

//need to change the status of order to COMPLETE
const mpProvider = new MercadoPagoProvider(
  process.env.MERCADO_PAGO_ACCESS_TOKEN!,
);

function extractProviderPaymentId(req: any) {
  // 1) payload  body (format data.id)
  const bodyId = req.body?.data?.id;
  console.log(req.body);
  if (bodyId) return String(bodyId);

  // 2) querystring (format ?id=...&topic=payment)
  const q = req.query ?? {};
  if (q.id) return String(q.id);

  // 3) querystring (format ?data.id=...&type=payment)
  if (q["data.id"]) {
    return String(q["data.id"]);
  }

  return null;
}

export const pixWebhookService = {
  async handleMercadoPagoWebhook(req: any) {
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
