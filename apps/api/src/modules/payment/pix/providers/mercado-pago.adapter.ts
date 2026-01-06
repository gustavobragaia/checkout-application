import { FastifyRequest } from "fastify";
import { MercadoPagoProvider } from "./mercado-pago.provider";
import { PixWebhookAdapter, DomainPaymentStatus } from "../pix.webhook-adapter";

const mpProvider = new MercadoPagoProvider(
  process.env.MERCADO_PAGO_ACCESS_TOKEN!,
);

// Tipos do webhook MP (só aqui, não vaza pro core)
type MercadoPagoWebhookBody = {
  data?: { id?: string };
  id?: string; // event id
  type?: string;
  action?: string;
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

function extractMpPaymentId(req: MercadoPagoWebhookRequest): string | null {
  const body = req.body ?? {};
  const q = req.query ?? {};

  // evita confundir eventId com paymentId
  req.log?.info?.(
    { eventId: body.id, dataId: body.data?.id, q },
    "mp webhook ids",
  );

  if (body.data?.id) return String(body.data.id);
  if (q.id) return String(q.id);
  if (q["data.id"]) return String(q["data.id"]);
  return null;
}

function mapMercadoPagoStatus(status: string): DomainPaymentStatus | null {
  switch (status) {
    case "approved":
      return "PAID";

    case "rejected":
    case "cancelled":
    case "expired":
      return "FAILED";

    case "refunded":
      return "REFUNDED";

    case "charged_back":
      return "CHARGEBACK";

    // intermediários / ignore
    case "pending":
    case "in_process":
    case "authorized":
    default:
      return null;
  }
}

export const mercadoPagoPixWebhookAdapter: PixWebhookAdapter<MercadoPagoWebhookRequest> =
  {
    name: "MERCADO_PAGO",
    extractProviderPaymentId: extractMpPaymentId,
    getPayment: async (providerPaymentId: string) => {
      const mpPayment = await mpProvider.getPayment(providerPaymentId);
      return {
        status: mpPayment?.status,
        externalReference: mpPayment?.external_reference ?? null,
      };
    },
    mapStatus: mapMercadoPagoStatus,
  };
