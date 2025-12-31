import { FastifyInstance } from "fastify";
import {
  CreateProductSchema,
  ProductIdParamsSchema,
  UpdateProductBodySchema,
} from "./products.schema";
import { createProduct, listProducts, updateProduct } from "./products.service";

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
  app.put("/products/:id/capabilities", async(req, res));
}
//MISSING THE ROUTES ONLY, SERVICE AND SCHEMAS DONE
