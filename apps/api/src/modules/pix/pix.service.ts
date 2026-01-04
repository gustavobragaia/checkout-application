import { prisma } from "../../lib/prisma";
import { CustomError } from "../../errors/custom-error";
import { makePixProvider } from "./pix.factory";
import {
  PaymentProvider,
  PaymentStatus,
  PaymentMethod,
} from "../../generated/prisma/enums";

type CreateOrGetPixPaymentResult = {
  paymentId: string;
  providerPaymentId: string | null;
  status: PaymentStatus;
  amountCents: number;
  currency: string;
  pix: {
    copyPaste: string;
    qrCode?: string | null;
    expiresAt?: string | null;
  } | null;
};

export class PixService {
  private provider = makePixProvider();

  /**
   * Cria ou reutiliza um PIX para a session (idempotente por sessionId).
   * Pré-condições:
   * - sessão existe
   * - sessão está em PAYMENT_SELECTED
   * - selectedMethod === PIX
   * - customerEmail existe (para Mercado Pago)
   */
  async createOrGetPixPayment(
    sessionId: string,
  ): Promise<CreateOrGetPixPaymentResult> {
    // 1) Buscar sessão + produto (pra snapshot de valor)
    const session = await prisma.checkoutSession.findUnique({
      where: { id: sessionId },
      include: {
        checkoutLink: {
          include: { product: true },
        },
        payment: {
          include: { pix: true },
        },
      },
    });

    if (!session) throw new CustomError("Checkout session not found", 404);

    if (session.status !== "PAYMENT_SELECTED") {
      throw new CustomError("Session is not ready to pay", 409);
    }

    if (session.selectedMethod !== PaymentMethod.PIX) {
      throw new CustomError("Selected method is not PIX", 409);
    }

    if (!session.customerEmail) {
      throw new CustomError("Customer email is required for PIX", 400);
    }

    // 2) Se já existe Payment, retorna (idempotência)
    if (session.payment) {
      const existing = session.payment;
      if (!existing.pix || !existing.pix.copyPaste || !existing.pix.expiresAt) {
        throw new CustomError(
          "PIX payment stored without required fields",
          500,
        );
      }
      return {
        paymentId: existing.id,
        providerPaymentId: existing.providerPaymentId ?? null,
        status: existing.status,
        amountCents: existing.amountCents,
        currency: existing.currency,
        pix: {
          copyPaste: existing.pix.copyPaste,
          qrCode: existing.pix.qrCode ?? "",
          expiresAt: existing.pix.expiresAt.toISOString(),
        },
      };
    }

    const product = session.checkoutLink.product;

    // 3) Criar Payment "local" primeiro (snapshot + idempotência no DB)
    // providerPaymentId ainda não existe aqui
    let payment = await prisma.payment.create({
      data: {
        sessionId: session.id,
        method: PaymentMethod.PIX,
        status: PaymentStatus.PENDING,
        provider: PaymentProvider.MERCADO_PAGO,
        amountCents: product.priceCents,
        currency: product.currency,
      },
    });

    // 4) Chamar provider pra criar cobrança PIX
    const charge = await this.provider.createCharge({
      amountCents: payment.amountCents,
      externalReference: session.id, // ✅ correlaciona com sua sessão
      description: product.name,
      payerEmail: session.customerEmail,
      idempotencyKey: session.id, // ✅ pode ser session.id (ou payment.id)
    });

    // 5) Persistir resposta do provider (Payment + PixPayment)
    payment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: charge.providerPaymentId,
        pix: {
          create: {
            copyPaste: charge.copyPaste,
            qrCode: charge.qrCode,
            expiresAt: charge.expiresAt,
          },
        },
      },
      include: { pix: true },
    });

    return {
      paymentId: payment.id,
      providerPaymentId: payment.providerPaymentId ?? null,
      status: payment.status,
      amountCents: payment.amountCents,
      currency: payment.currency,
      pix: (() => {
        if (!payment.pix || !payment.pix.qrCode || !payment.pix.expiresAt) {
          throw new CustomError(
            "PIX payment stored without required fields",
            500,
          );
        }
        return {
          copyPaste: payment.pix.copyPaste,
          qrCode: payment.pix.qrCode,
          expiresAt: payment.pix.expiresAt.toISOString(),
        };
      })(),
    };
  }
}
