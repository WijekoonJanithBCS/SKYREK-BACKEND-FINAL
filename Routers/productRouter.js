import express from 'express';
import { Createproduct, deleteProduct, getProductById, getProducts, searchProducts, updateProduct } from '../controllers/productController.js';

const productRouter = express.Router();

productRouter.post("/", Createproduct);

productRouter.get("/", getProducts);

productRouter.get("/search/:query", searchProducts);

productRouter.delete("/:productId", deleteProduct);

productRouter.put("/:productId", updateProduct);

productRouter.get("/:productId", getProductById);


export default productRouter;