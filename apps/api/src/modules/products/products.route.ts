import { FastifyInstance } from "fastify";
import {
  CreateProductSchema,
  ProductIdParamsSchema,
  PutCapabilitiesBodySchema,
  UpdateProductBodySchema,
} from "./products.schema";
import {
  createProduct,
  getSingleProduct,
  listProducts,
  putArchivedProduct,
  putProductCapabilities,
  putUnarchivedProduct,
  updateProduct,
} from "./products.service";

export function productRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  //create a product
  app.post("/products", async (req, res) => {
    const body = CreateProductSchema.parse(req.body);
    const sellerId = req.user.sub;

    const newProduct = await createProduct({ sellerId, ...body });
    return res.code(201).send(newProduct);
  });

  //get all product
  app.get("/products", async (req, res) => {
    const sellerId = req.user.sub;
    const listOfProducts = await listProducts({ sellerId });
    return res.code(201).send(listOfProducts);
  });

  //get single product
  app.get("/products/:id", async (req, res) => {
    const sellerId = req.user.sub;
    const { id: productId } = ProductIdParamsSchema.parse(req.params);

    const singleProduct = await getSingleProduct({ sellerId, productId });
    return res.code(201).send(singleProduct);
  });

  //update single product by id
  app.patch("/products/:id", async (req, res) => {
    const { id: productId } = ProductIdParamsSchema.parse(req.params);
    const data = UpdateProductBodySchema.parse(req.body);
    const sellerId = req.user.sub;

    const updated = await updateProduct({
      sellerId,
      productId,
      data,
    });

    return res.code(200).send(updated);
  });

  //update capabilities for product
  app.put("/products/:id/capabilities", async (req, res) => {
    const { id: productId } = ProductIdParamsSchema.parse(req.params);
    const body = PutCapabilitiesBodySchema.parse(req.body);
    const sellerId = req.user.sub;
    const result = await putProductCapabilities({
      sellerId,
      productId,
      capabilities: body.capabilities.map((c) => ({
        ...c,
        metadata: c.metadata ?? null,
      })),
    });

    return res.code(200).send(result);
  });

  //archive product
  app.post("/products/:id/archive", async (req, res) => {
    const { id: productId } = ProductIdParamsSchema.parse(req.params);
    const sellerId = req.user.sub;

    const archive = await putArchivedProduct({ productId, sellerId });
    return res.status(200).send(archive);
  });

  //unarchive product
  app.post("/products/:id/unarchive", async (req, res) => {
    const { id: productId } = ProductIdParamsSchema.parse(req.params);
    const sellerId = req.user.sub;

    const unarchive = await putUnarchivedProduct({ productId, sellerId });
    return res.status(200).send(unarchive);
  });
}
