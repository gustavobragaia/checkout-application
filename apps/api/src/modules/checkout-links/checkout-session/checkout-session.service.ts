import { prisma } from "../../../lib/prisma";

const SESSION_COOKIE = "checkout_session_id";

type GetOrCreateCheckoutSessionInput = {
  checkoutLinkId: string;
  cookieSessionId?: string;
  expiresAt?: Date | null;
};

export async function getOrCreateCheckoutSession({
  checkoutLinkId,
  cookieSessionId,
  expiresAt,
}: GetOrCreateCheckoutSessionInput) {
  // 1) tenta reutilizar sessão do cookie, mas garantindo que pertence ao checkoutLink
  if (cookieSessionId) {
    const existing = await prisma.checkoutSession.findFirst({
      where: { id: cookieSessionId, checkoutLinkId },
    });
    if (existing) return existing;
  }

  // 2) cria uma nova sessão
  return prisma.checkoutSession.create({
    data: {
      checkoutLinkId,
      expiresAt: expiresAt ?? null,
      status: "CREATED",
    },
  });
}

export function getCheckoutSessionCookieName() {
  return SESSION_COOKIE;
}
