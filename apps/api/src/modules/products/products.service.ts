import { CustomError } from "../../errors/custom-error";
import { prisma } from "../../lib/prisma";

interface CreateProductInput {
  sellerId: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: "BRL" | "USD" | "CAD" | "EUR";
}

export async function createProduct(input: CreateProductInput) {
  return prisma.product.create({
    data: {
      ...input,
      sellerId: input.sellerId, // explicit for clarity
    },
  });
}

interface ListProductsInput {
  sellerId: string;
}
export async function listProducts(input: ListProductsInput) {
  const listOfProducts = await prisma.product.findMany({
    where: {
      sellerId: input.sellerId,
    },
    orderBy: [
      //show isArchived False first
      { isArchived: "asc" },
      //show most recents first
      { createdAt: "desc" },
    ],
  });
  return listOfProducts;
}

interface UpdateProductInput {
  sellerId: string;
  productId: string;
  data: {
    name?: string;
    description?: string | null;
    priceCents?: number;
    currency?: "BRL" | "USD" | "CAD" | "EUR";
  };
}
export async function updateProduct(input: UpdateProductInput) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { sellerId: true },
  });

  if (!product) throw new CustomError("Product not found", 404);
  if (product.sellerId !== input.sellerId)
    throw new CustomError("Forbidden Acess Lil Nigga", 403);

  //update
  return prisma.product.update({
    where: { id: input.productId },
    data: input.data,
  });
}

interface PutProductCapabilitiesInput {
  sellerId: string;
  productId: string;
  capabilities: {
    type: "PAY_PIX" | "PAY_CARD" | "PAY_CRYPTO";
    enabled: boolean;
    metadata: any;
  }[];
}
export async function putProductCapabilities(
  input: PutProductCapabilitiesInput,
) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });

  if (!product) throw new CustomError("Product not found", 404);
  if (product.sellerId !== input.sellerId)
    throw new CustomError("Forbidden Acess Lil Nigga", 403);

  return prisma.$transaction(async (tx) => {
    for (const cap of input.capabilities) {
      await tx.productCapability.upsert({
        where: {
          productId_type: { productId: input.productId, type: cap.type },
        },
        update: { enabled: cap.enabled, metadata: cap.metadata ?? null },
        create: {
          productId: input.productId,
          type: cap.type,
          enabled: cap.enabled,
          metadata: cap.metadata ?? null,
        },
      });
    }

    return tx.productCapability.findMany({
      where: { productId: input.productId },
      orderBy: { type: "asc" },
    });
  });
}

interface PutArchivedOrUnarchiveProductInput {
  productId: string;
  sellerId: string;
}
export async function putArchivedProduct(
  input: PutArchivedOrUnarchiveProductInput,
) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { sellerId: true },
  });
  if (!product) throw new CustomError("Product not found", 404);
  if (product.sellerId !== input.sellerId)
    throw new CustomError("Forbidden Acess Lil Nigga", 403);

  return prisma.product.update({
    where: { id: input.productId },
    data: {
      isArchived: true,
      archivedAt: new Date(),
    },
  });
}
export async function putUnarchivedProduct(
  input: PutArchivedOrUnarchiveProductInput,
) {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { sellerId: true },
  });
  if (!product) throw new CustomError("Product not found", 404);
  if (product.sellerId !== input.sellerId)
    throw new CustomError("Forbidden Acess Lil Nigga", 403);

  return prisma.product.update({
    where: { id: input.productId },
    data: {
      isArchived: false,
      archivedAt: null,
    },
  });
}
