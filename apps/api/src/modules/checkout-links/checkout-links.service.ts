import { CustomError } from "../../errors/custom-error";
import { prisma } from "../../lib/prisma";

//functions to create slug url correctly
function buildPaymentsMethod(capabilities: any[]) {
  const methods: any = {
    pix: { enabled: false },
    card: { enabled: false },
    crypto: { enabled: false },
  };
  for (const c of capabilities) {
    if (c.type === "PAY_PIX") {
      methods.pix = {
        enabled: c.enabled,
        metadata: c.metadata ?? undefined,
      };
    }
    if (c.type === "PAY_CARD") {
      methods.card = {
        enabled: c.enabled,
        metadata: c.metadata ?? undefined,
      };
    }
    if (c.type === "PAY_CRYPTO") {
      methods.crypto = {
        enabled: c.enabled,
        metadata: c.metadata ?? undefined,
      };
    }
  }

  return methods;
}
//UNIQUE PUBLIC ROUTE
export async function resolvePublicCheckoutBySlug(input: { slug: string }) {
  const productInformation = await prisma.checkoutLink.findUnique({
    where: { slugUrl: input.slug },
    include: {
      product: {
        include: { capabilities: true },
      },
    },
  });

  // verifications
  if (!productInformation)
    throw new CustomError("Checkout link not found", 404);
  if (!productInformation.isActive)
    // TODO(EPIC 3.5): log CHECKOUT_BLOCKED reason=LINK_DISABLED (non-blocking)

    throw new CustomError("Checkout inactive", 404);
  if (
    productInformation.expiresAt &&
    productInformation.expiresAt.getTime() <= Date.now()
  ) {
    // TODO(EPIC 3.5): log CHECKOUT_BLOCKED reason=LINK_EXPIRED (non-blocking)

    throw new CustomError("Checkout link expired", 410);
  }

  if (productInformation.product.isArchived)
    // TODO(EPIC 3.5): log CHECKOUT_BLOCKED reason=PRODUCT_ARCHIVED (non-blocking)

    throw new CustomError("Product is archived", 410);

  // TODO(EPIC 3.5): log CHECKOUT_VIEW here (non-blocking)
  return {
    //returning only needed fields
    checkoutLink: {
      id: productInformation.id,
      slugUrl: productInformation.slugUrl,
      expiresAt: productInformation.expiresAt ?? null,
      isActive: productInformation.isActive,
    },
    product: {
      id: productInformation.product.id,
      name: productInformation.product.name,
      description: productInformation.product.description,
      priceCents: productInformation.product.priceCents,
      currency: productInformation.product.currency,
    },
    paymentMethodsAllowed: buildPaymentsMethod(
      productInformation.product.capabilities,
    ),
  };
}

const ALPHABET =
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomSlug(len = 12) {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

//PRIVATE ROUTES BELOW
interface CreateCheckoutLinkInput {
  productId: string;
  sellerId: string;
  expiresAt?: Date | null;
}
export async function createCheckoutLink(input: CreateCheckoutLinkInput) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });
  if (product?.sellerId !== input.sellerId)
    throw new CustomError("Forbidden Acess Lil Nigga", 403);
  if (!product) throw new CustomError("Invalid product", 404);
  if (product.isArchived) throw new CustomError("Product is archived", 409);

  //create slug
  for (let attempt = 0; attempt < 5; attempt++) {
    const slugUrl = randomSlug(12);

    try {
      const link = await prisma.checkoutLink.create({
        data: {
          productId: input.productId,
          slugUrl, // ou slugUrl: slug se seu model for slugUrl
          expiresAt: input.expiresAt ?? null,
          isActive: true,
        },
        select: {
          id: true,
          slugUrl: true,
          isActive: true,
          expiresAt: true,
          createdAt: true,
        },
      });

      return link;
    } catch (err: any) {
      // P2002 = unique constraint failed
      if (err?.code === "P2002") continue;
      throw err;
    }
  }
  throw new CustomError("Could not generate unique slug", 500);
}

interface GetCheckoutLinkInput {
  sellerId: string;
  productId: string;
}
export async function getCheckoutLink(input: GetCheckoutLinkInput) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });
  if (!product) throw new CustomError("Product invalid", 404);
  if (product.sellerId !== input.sellerId)
    throw new CustomError("Forbidden", 403);
  if (product.isArchived) throw new CustomError("Product is archived", 409);

  return await prisma.checkoutLink.findMany({
    where: { productId: input.productId },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      productId: true,
      slugUrl: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
      product: {
        select: {
          name: true,
          id: true,
        },
      },
    },
  });
}

interface EnableCheckoutLinkInput {
  sellerId: string;
  checkoutLinkId: string;
}
export async function enableCheckoutLink(input: EnableCheckoutLinkInput) {
  const checkoutLink = await prisma.checkoutLink.findUnique({
    where: { id: input.checkoutLinkId },
    include: { product: true },
  });
  if (!checkoutLink) throw new CustomError("Checkout link not found", 404);
  if (checkoutLink.product.sellerId !== input.sellerId)
    throw new CustomError("Forbidden", 403);
  return prisma.checkoutLink.update({
    where: { id: input.checkoutLinkId },
    data: { isActive: true },
    select: {
      id: true,
      productId: true,
      slugUrl: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

interface DisableCheckoutLinkInput {
  sellerId: string;
  checkoutLinkId: string;
}
export async function disableCheckoutLink(input: DisableCheckoutLinkInput) {
  const checkoutLink = await prisma.checkoutLink.findUnique({
    where: { id: input.checkoutLinkId },
    include: { product: true },
  });
  if (!checkoutLink) throw new CustomError("Checkout link not found", 404);
  if (checkoutLink.product.sellerId !== input.sellerId)
    throw new CustomError("Forbidden", 403);
  return prisma.checkoutLink.update({
    where: { id: input.checkoutLinkId },
    data: { isActive: false },
    select: {
      id: true,
      productId: true,
      slugUrl: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function patchCheckoutLink(input: {
  checkoutLinkId: string;
  sellerId: string;
  expiresAt?: Date | null;
}) {
  const checkoutLink = await prisma.checkoutLink.findUnique({
    where: { id: input.checkoutLinkId },
    include: { product: true },
  });
  if (!checkoutLink) throw new CustomError("Checkout link not found", 404);
  if (checkoutLink.product.sellerId !== input.sellerId)
    throw new CustomError("Forbidden", 403);

  if (input.expiresAt && input.expiresAt.getTime() <= Date.now()) {
    throw new CustomError("expiresAt must be in the future", 400);
  }

  return prisma.checkoutLink.update({
    where: { id: input.checkoutLinkId },
    data: {
      // se vier undefined, não mexe; se vier null, remove expiração
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
    },
    select: {
      id: true,
      productId: true,
      slugUrl: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
