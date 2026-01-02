import { FastifyInstance } from "fastify";
import { SlugParamsSchema } from "./checkout-links.schema";
import { resolvePublicCheckoutBySlug } from "./checkout-links.service";
import {
  getCheckoutSessionCookieName,
  getOrCreateCheckoutSession,
} from "./checkout-session.service";

export async function checkoutPublicRoutes(app: FastifyInstance) {
  app.get("/pay/:slug", async (req, res) => {
    const { slug } = SlugParamsSchema.parse(req.params);

    try {
      const payload = await resolvePublicCheckoutBySlug({ slug });

      // Cria/usa sessão via cookie
      const cookieName = getCheckoutSessionCookieName();
      const cookieSessionId = (req.cookies as any)?.[cookieName] as
        | string
        | undefined;

      const session = await getOrCreateCheckoutSession({
        checkoutLinkId: payload.checkoutLink.id,
        cookieSessionId,
        expiresAt: payload.checkoutLink.expiresAt
          ? new Date(payload.checkoutLink.expiresAt)
          : null,
      });

      // Seta cookie se não tinha ou se era inválido
      if (!cookieSessionId || cookieSessionId !== session.id) {
        res.setCookie(cookieName, session.id, {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7, // 7 dias (ajuste se quiser)
        });
      }

      // TODO(EPIC 3.5): log CHECKOUT_VIEW here (non-blocking)
      // Ex: logEvent({ type: "CHECKOUT_VIEW", slug, sessionId: session.id, req })

      return res.code(200).send({
        ...payload,
        session: {
          id: session.id,
          status: session.status,
          customer: {
            name: session.customerName ?? undefined,
            email: session.customerEmail ?? undefined,
            phone: session.customerPhone ?? undefined,
          },
          selectedMethod: session.selectedMethod ?? undefined,
        },
      });
    } catch (err) {
      // TODO(EPIC 3.5): if CustomError status is 410/404, log CHECKOUT_BLOCKED with reason (non-blocking)
      // Ex: logEvent({ type: "CHECKOUT_BLOCKED", slug, reason, req })

      throw err; // deixa seu errorHandler global cuidar
    }
  });
}
