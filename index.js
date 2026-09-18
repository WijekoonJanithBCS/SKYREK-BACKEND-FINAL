import express from "express";
import mongoose from "mongoose";
import productRouter from "./Routers/productRouter.js";
//import jwt from "jsonwebtoken";
import authorizeUser from "./lib/jwtMiddleware.js";
import cors from 'cors';
import dotenv from 'dotenv'
dotenv.config()
import dns from "node:dns";
import userRouter from "./Routers/userRouter.js";
import orderRouter from "./Routers/orderRouter.js";


dns.setServers(["1.1.1.1", "8.8.8.8"]);


const mongoURI = process.env.MONGO_URI

mongoose.connect(mongoURI).then(() => {
  console.log("Connected to MongoDB");
})
.catch((err) => {
  console.error("Error connecting to MongoDB:", err);
}
);

const app = express();

app.use(cors())

app.use(express.json());

app.use(authorizeUser);

app.use("/api/users", userRouter);

app.use("/api/products", productRouter);

app.use("/api/orders",orderRouter);

app.listen(3000, () => {
  console.log("Server is running on port 3000...");
});