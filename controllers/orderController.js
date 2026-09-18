import Order from "../models/order.js";
import Product from "../models/product.js";
import { isAdmin } from "./usercontroller.js";
//import express from "express";


export async function CreateOrder(req, res) {

    console.log("CreateOrder called with req.body:", req.body);


    // Check login
    if (req.user == null) {

        return res.status(401).json({

            message: "Unauthorized. Please log in to place an order"

        });

    }


    try {

        /*
         * Check request body
         */

        if (req.body == null) {

            return res.status(400).json({

                message: "Order data is required"

            });

        }


        /*
         * Check items
         */

        if (
            !Array.isArray(req.body.items) ||
            req.body.items.length === 0
        ) {

            return res.status(400).json({

                message: "Order must contain at least one product"

            });

        }


        /*
         * Get first name
         */

        let firstName = req.body.firstName;

        if (
            firstName == null ||
            firstName.trim() === ""
        ) {

            firstName = req.user.firstName;

        }


        /*
         * Get last name
         */

        let lastName = req.body.lastName;

        if (
            lastName == null ||
            lastName.trim() === ""
        ) {

            lastName = req.user.lastName;

        }


        /*
         * Validate first name
         */

        if (
            firstName == null ||
            firstName.trim() === ""
        ) {

            return res.status(400).json({

                message: "First Name is required"

            });

        }


        /*
         * Validate last name
         */

        if (
            lastName == null ||
            lastName.trim() === ""
        ) {

            return res.status(400).json({

                message: "Last Name is required"

            });

        }


        /*
         * Validate Address Line 1
         */

        if (
            req.body.addressLine1 == null ||
            req.body.addressLine1.trim() === ""
        ) {

            return res.status(400).json({

                message: "Address Line 1 is required"

            });

        }


        /*
         * Validate Address Line 2
         */

        if (
            req.body.addressLine2 == null ||
            req.body.addressLine2.trim() === ""
        ) {

            return res.status(400).json({

                message: "Address Line 2 is required"

            });

        }


        /*
         * Validate city
         */

        if (
            req.body.city == null ||
            req.body.city.trim() === ""
        ) {

            return res.status(400).json({

                message: "City is required"

            });

        }


        /*
         * Validate postal code
         */

        if (
            req.body.postalCode == null ||
            req.body.postalCode.trim() === ""
        ) {

            return res.status(400).json({

                message: "Postal Code is required"

            });

        }


        /*
         * Validate phone number
         */

        if (
            req.body.phoneNumber == null ||
            req.body.phoneNumber.trim() === ""
        ) {

            return res.status(400).json({

                message: "Phone Number is required"

            });

        }


        /*
         * Create order data
         */

        const orderData = {

            orderId: "ORD000001",

            firstName: firstName,

            lastName: lastName,

            addressLine1: req.body.addressLine1,

            addressLine2: req.body.addressLine2,

            city: req.body.city,

            country: req.body.country || "Sri Lanka",

            postalCode: req.body.postalCode,

            // Use authenticated user's email
            email: req.user.email,

            phoneNumber: req.body.phoneNumber,

            items: [],

            totalAmount: 0

        };


        /*
         * Generate next order ID
         */

        const lastorder = await Order
            .findOne()
            .sort({ orderId: -1 });


        if (lastorder != null) {

            const lastorderid = lastorder.orderId;

            const lastOrderNumberInString =
                lastorderid.replace("ORD", "");

            const lastOrderNumber =
                parseInt(lastOrderNumberInString);


            if (!isNaN(lastOrderNumber)) {

                const newOrderNumber =
                    lastOrderNumber + 1;


                const newOrderNumberInString =
                    newOrderNumber
                        .toString()
                        .padStart(6, "0");


                orderData.orderId =
                    "ORD" + newOrderNumberInString;

            }

        }


        /*
         * Process cart items
         */

        for (
            let i = 0;
            i < req.body.items.length;
            i++
        ) {

            const item = req.body.items[i];


            /*
             * Validate product ID
             */

            if (
                item.productId == null ||
                item.productId === ""
            ) {

                return res.status(400).json({

                    message:
                        "Product ID is required"

                });

            }


            /*
             * Validate quantity
             */

            if (
                item.qty == null ||
                item.qty <= 0
            ) {

                return res.status(400).json({

                    message:
                        "Invalid quantity for product: "
                        + item.productId

                });

            }


            /*
             * Find product
             */

            const product =
                await Product.findOne({

                    productId: item.productId

                });


            console.log(
                "Product:",
                item.productId,
                product
            );


            /*
             * Product not found
             */

            if (product == null) {

                return res.status(404).json({

                    message:
                        "Product with given productId not found. Remove it from your cart and try again: "
                        + item.productId

                });

            }


            /*
             * Check product visibility
             */

            if (product.isVisible === false) {

                return res.status(400).json({

                    message:
                        "Product with given productId is not available: "
                        + item.productId

                });

            }


            /*
             * Check stock
             */

            console.log(
                "Product stock:",
                product.qty,
                "Requested:",
                item.qty
            );


            if (product.qty < item.qty) {

                return res.status(400).json({

                    message:
                        "Not enough stock available for product: "
                        + product.name

                });

            }


            /*
             * Add item to order
             */

            orderData.items.push({

                productId: item.productId,

                name: product.name,

                price: product.price,

                labelledPrice: product.labelledPrice,

                image:
                    product.images &&
                    product.images.length > 0
                        ? product.images[0]
                        : "",

                qty: item.qty

            });


            /*
             * Calculate total
             */

            orderData.totalAmount +=
                product.price * item.qty;

        }


        /*
         * Create order
         */

        const order =
            new Order(orderData);


        await order.save();


        /*
         * Reduce product stock
         */

        for (
            let i = 0;
            i < orderData.items.length;
            i++
        ) {

            const item =
                orderData.items[i];


            await Product.updateOne(

                {
                    productId:
                        item.productId
                },

                {
                    $inc: {
                        qty: -item.qty
                    }
                }

            );

        }


        /*
         * Success response
         */

        return res.status(201).json({

            message:
                "Order created successfully",

            orderId:
                orderData.orderId

        });


    }
    catch (error) {

        console.log(
            "Error creating order:",
            error
        );


        return res.status(500).json({

            message:
                "Error creating order",

            error:
                error.message

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

    
    