import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { SlugParamsSchema } from "../checkout-links.schema";
import {
  PaymentMethodsAllowed,
  resolvePublicCheckoutBySlug,
} from "../checkout-links.service";
import { getCheckoutSessionCookieName } from "./checkout-session.service";
import { CustomerSchema, MethodSchema } from "./checkout-session.schema";

/* ----------------------------- HELPERS ------------------------------ */

function isMethodEnabled(
  methods: PaymentMethodsAllowed,
  method: "PIX" | "CARD" | "CRYPTO",
) {
  if (method === "PIX") return !!methods?.pix?.enabled;
  if (method === "CARD") return !!methods?.card?.enabled;
  if (method === "CRYPTO") return !!methods?.crypto?.enabled;
  return false;
}

/* ------------------------------ ROUTES ------------------------------ */

export async function checkoutSessionPublicRoutes(app: FastifyInstance) {
  /**
   * POST /pay/:slug/session/customer
   * Salva dados do customer e avança status -> CUSTOMER_SET
   */
  app.post("/pay/:slug/session/customer", async (req, res) => {
    const { slug } = SlugParamsSchema.parse(req.params);
    const body = CustomerSchema.parse(req.body);

    const payload = await resolvePublicCheckoutBySlug({ slug });

    const cookieName = getCheckoutSessionCookieName();
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const sessionId = cookies?.[cookieName];

    if (!sessionId) {
      return res.status(401).send({ message: "Missing session" });
    }

    const session = await prisma.checkoutSession.findFirst({
      where: {
        id: sessionId,
        checkoutLinkId: payload.checkoutLink.id,
      },
    });

    if (!session) {
      return res.status(404).send({ message: "Session not found" });
    }

    if (session.status === "EXPIRED") {
      return res.status(410).send({ message: "Session expired" });
    }

    const updated = await prisma.checkoutSession.update({
      where: { id: session.id },
      data: {
        customerName: body.name,
        customerEmail: body.email,
        customerPhone: body.phone,
        status: "CUSTOMER_SET",
      },
    });

    return res.code(200).send({
      id: updated.id,
      status: updated.status,
      customer: {
        name: updated.customerName,
        email: updated.customerEmail,
        phone: updated.customerPhone,
      },
    });
  });

  /**
   * POST /pay/:slug/session/method
   * Seleciona método de pagamento e avança status -> PAYMENT_SELECTED
   */
  app.post("/pay/:slug/session/method", async (req, res) => {
    const { slug } = SlugParamsSchema.parse(req.params);
    const { method } = MethodSchema.parse(req.body);

    const payload = await resolvePublicCheckoutBySlug({ slug });

    if (!isMethodEnabled(payload.paymentMethodsAllowed, method)) {
      return res.status(400).send({ message: "Payment method not enabled" });
    }

    const cookieName = getCheckoutSessionCookieName();
    const cookies = req.cookies as Record<string, string | undefined> | undefined;
    const sessionId = cookies?.[cookieName];

    if (!sessionId) {
      return res.status(401).send({ message: "Missing session" });
    }

    const session = await prisma.checkoutSession.findFirst({
      where: {
        id: sessionId,
        checkoutLinkId: payload.checkoutLink.id,
      },
    });

    if (!session) {
      return res.status(404).send({ message: "Session not found" });
    }

    if (session.status === "EXPIRED") {
      return res.status(410).send({ message: "Session expired" });
    }

    const updated = await prisma.checkoutSession.update({
      where: { id: session.id },
      data: {
        selectedMethod: method,
        status: "PAYMENT_SELECTED",
      },
    });

    return res.code(200).send({
      id: updated.id,
      status: updated.status,
      selectedMethod: updated.selectedMethod,
    });
  });
}
