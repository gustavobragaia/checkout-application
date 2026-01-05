import { PixChargeResult, PixProvider } from "../pix.provider";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { CustomError } from "../../../errors/custom-error";
import "dotenv/config";

type PaymentResponse = {
  id?: string | number;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      date_of_expiration?: string;
    };
  };
};

export class MercadoPagoProvider implements PixProvider {
  private payments: Payment;

  constructor(accessToken: string) {
    const client = new MercadoPagoConfig({ accessToken });
    this.payments = new Payment(client);
  }

  //method to use in webhook and get if payment was complete
  async getPayment(providerPaymentId: string): Promise<PaymentResponse> {
    const res = (await this.payments.get({
      id: Number(providerPaymentId),
    })) as PaymentResponse;
    return res;
  }

  async createCharge(input: {
    amountCents: number;
    externalReference: string;
    description: string;
    payerEmail: string;
    idempotencyKey: string;
  }): Promise<PixChargeResult> {
    try {
      const createPix = await this.payments.create({
        body: {
          transaction_amount: input.amountCents / 100,
          description: input.description,
          payment_method_id: "pix",
          payer: {
            email: input.payerEmail,
          },
          notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL,
        },
        requestOptions: { idempotencyKey: input.idempotencyKey },
      });

      const data = createPix as PaymentResponse;
      const tx = data.point_of_interaction?.transaction_data;
      const providerPaymentId = data?.id ? String(data.id) : "";
      const copyPaste = tx?.qr_code ?? "";
      const qrCode = tx?.qr_code_base64 ?? "";
      // date_of_expiration vem como string ISO
      const expiresAt = tx?.date_of_expiration
        ? new Date(tx.date_of_expiration)
        : null;

      const missing: string[] = [];
      if (!providerPaymentId) missing.push("id");
      if (!copyPaste) missing.push("qr_code");
      if (!qrCode) missing.push("qr_code_base64");
      if (!expiresAt) missing.push("date_of_expiration");

      if (missing.length) {
        // MP às vezes não retorna date_of_expiration; define fallback de 30min
        const fallbackExpiration = new Date(Date.now() + 30 * 60 * 1000);
        const snapshot = JSON.stringify(
          {
            providerPaymentId,
            tx: {
              qr_code: tx?.qr_code,
              qr_code_base64: tx?.qr_code_base64
                ? "[base64 present]"
                : undefined,
              date_of_expiration: tx?.date_of_expiration,
            },
            fallbackExpiration,
          },
          null,
          2,
        );
        if (!expiresAt) {
          // se só faltou expiresAt, usamos o fallback
          return {
            providerPaymentId,
            copyPaste: copyPaste ?? "",
            qrCode: qrCode ?? "",
            expiresAt: fallbackExpiration,
          };
        }
        throw new CustomError(
          `Mercado Pago PIX response missing fields: ${missing.join(
            ", ",
          )} | snapshot=${snapshot}`,
          502,
        );
      }

      return {
        providerPaymentId,
        copyPaste: copyPaste!,
        qrCode: qrCode!,
        expiresAt: expiresAt!,
      };
    } catch (err: unknown) {
      // Mercado Pago SDK costuma trazer detalhes em err.cause
      const detail =
        typeof err === "object" && err !== null
          ? // @ts-expect-error - sdk error shape is loosely typed
            err?.cause?.[0]?.description ||
            // @ts-expect-error - sdk error shape is loosely typed
            err?.message ||
            JSON.stringify(err, null, 2)
          : String(err);
      throw new CustomError(`Mercado Pago error: ${detail}`, 502);
    }
  }

  verifyWebhookSignature(): void {
    throw new Error(
      "MercadoPagoPixProvider.verifyWebhookSignature not implemented yet",
    );
  }

  parseWebhook() {
    throw new Error("MercadoPagoPixProvider.parseWebhook not implemented yet");
  }
}
