import Order from "../models/order.js";
import Product from "../models/product.js";
import { isAdmin } from "./usercontroller.js";
//import express from "express";


export async function CreateOrder(req, res) {

    if(req.user == null){
        return res.status(401).json({
            message: "Unauthorized.please log in to place an order"
        });
    }

    try{

        const orderData = {
            orderId: "ORD000001",
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            addressLine1: req.body.addressLine1,
            addressLine2: req.body.addressLine2,
            city: req.body.city,
            country: req.body.country,
            postalCode: req.body.postalCode,
            email: req.user.email,
            items: [],
            phoneNumber: req.body.phoneNumber,
            totalAmount: 0,
        };


        if(req.body.firstName == ""){
            req.body.firstName = req.user.firstName;
        }

        if(req.body.lastName == ""){
            req.body.lastName = req.user.lastName;
        }

        if(req.body.addressLine1 == ""){
            res.status(400).json({
                message: "Address Line 1 is required"
            });
            return;
        }

        if(req.body.addressLine2 == ""){
            res.status(400).json({
                message: "Address Line 2 is required"
            });
            return;
        }

        if(req.body.city == ""){
            res.status(400).json({
                message: "City is required"
            });
            return;
        }

        if(req.body.postalCode == ""){
            res.status(400).json({
                message: "Postal Code is required"
            });
            return;
        }


        const lastorder = await Order.findOne().sort({ date: -1 });

        if(lastorder != null){

            const lastorderid = lastorder.orderId;

            const lastOrderNumberInString = lastorderid.replace("ORD", "");

            const lastOrderNumber = parseInt(lastOrderNumberInString);

            const newOrderNumber = lastOrderNumber + 1;

            const newOrderNumberInString =
                newOrderNumber.toString().padStart(6, "0");

            orderData.orderId = "ORD" + newOrderNumberInString;
        }


        for(let i = 0; i < req.body.items.length; i++){

            const item = req.body.items[i];

            const product = await Product.findOne({
                productId: item.productId
            });


            if(product == null){

                return res.status(404).json({
                    message:
                        "Product with given productId not found.remove it from ur cart and try again: "
                        + item.productId
                });
            }


            if(product.isVisible == false){

                return res.status(400).json({
                    message:
                        "Product with given productId is not available: "
                        + item.productId
                });
            }


            // Check stock before creating the order
            if(product.qty < item.qty){

                return res.status(400).json({
                    message:
                        "Not enough stock available for product: "
                        + product.name
                });
            }


            orderData.items.push({
                productId: item.productId,
                name: product.name,
                price: product.price,
                labelledPrice: product.labelledPrice,
                image: product.images[0],
                qty: item.qty
            });


            orderData.totalAmount += product.price * item.qty;
        }


        // Create order
        const order = new Order(orderData);

        await order.save();


        // Reduce product stock
        for(let i = 0; i < orderData.items.length; i++){

            const item = orderData.items[i];

            await Product.updateOne(
                {
                    productId: item.productId
                },
                {
                    $inc: {
                        qty: -item.qty
                    }
                }
            );

        }


        res.status(201).json({
            message: "Order created successfully",
            orderId: orderData.orderId
        });

    }
    catch(error){

        console.log("Error creating order: ", error);

        return res.status(500).json({
            message: "Error creating order",
            error: error.message
        });
    }
}

export async function GetOrders(req, res) {
    if(req.user == null){
        return res.status(401).json({
            message: "Unauthorized.please log in to view your orders"
        });
        return;
    }
    const pageSizeInString = req.params.pageSize || "10";
    const pageNumberInString = req.params.pageNumber || "1";
    const pageSize = parseInt(pageSizeInString);
    const pageNumber = parseInt(pageNumberInString);

    try{
        if(isAdmin(req)){
        const numberOfOrders = await Order.countDocuments();
        const numberOfPages = Math.ceil(numberOfOrders / pageSize);
        const orders = await Order.find().sort({ date: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize);
        res.json({
            orders: orders,
            totalPages: numberOfPages
        });
        }
        else{
            const numberOfOrders = await Order.countDocuments();
            const numberOfPages = Math.ceil(numberOfOrders / pageSize);
            const orders = await Order.find({email: req.user.email}).sort({ date: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize);
            res.json({
                orders: orders,
                totalPages: numberOfPages
            });
        
        }
    }

   
         
    
    catch(error){
        console.log("Error counting orders: ", error);
        return res.status(500).json({
            message: "Error counting orders",
            error: error.message
        });
    }
}

    export async function updateOrderStatusAndNotes(req, res) {
        if(isAdmin(req)){
            const orderId = req.params.orderId;
            try{
                await Order.updateOne({orderId: orderId},  {status: req.body.status, notes: req.body.notes});
            res.json({
                message: "Order status and notes updated successfully"
            });   
            }
            
            catch(error){
                console.log("Error updating order status and notes: ", error);
                return res.status(500).json({
                    message: "Error updating order status and notes",
                    error: error.message
                });
            }
        }   
        else{
            return res.status(403).json({
                message: "Forbidden. Only admin can update order status and notes"
            });
        }
     
}

    
    