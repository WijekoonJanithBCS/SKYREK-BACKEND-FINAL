import express from "express";
import { CreateOrder, GetOrders, updateOrderStatusAndNotes } from "../controllers/orderController.js";


const orderRouter = express.Router();

orderRouter.post("/", CreateOrder);

orderRouter.get("/:pageSize/:pageNmuber", GetOrders);

orderRouter.put("/:orderId", updateOrderStatusAndNotes);

export default orderRouter;