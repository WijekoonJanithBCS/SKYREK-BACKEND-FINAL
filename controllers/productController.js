import express from "express";
import Product from "../models/product.js";
import { isAdmin } from "./usercontroller.js";


export async function Createproduct(req, res) {

   if(!isAdmin (req)){
    return res.status(403).json({
        message: "Forbidden, only admin can create products"
    });
   }
   try {
        const existingProduct = await Product.findOne({
            productId: req.body.productId
        })
        if(existingProduct){
            return res.status(400).json({
                message: "Product with given productId already exists"
            });
        }

        const data= {}
        data.productId = req.body.productId;

        if(req.body.name==null || req.body.name==""){
            return res.status(400).json({
                message: "Product name is required"
            });
        }
        data.name = req.body.name;

        data.description = req.body.description || ""
        data.altNames = req.body.altNames || []
        if(req.body.price==null){
            return res.status(400).json({
                message: "Product price is required"
            });
        }
        data.price = req.body.price;
        data.labelledPrice = req.body.labelledPrice || req.body.price
        data.category = req.body.category || "others"
        data.images = req.body.images || [];
        data.isVisible = req.body.isVisible
        data.brand = req.body.brand || "Generic"
        data.model = req.body.model || "Standard"

        const product = new Product(data);
        await product.save();

        return res.status(201).json({
            message: "Product created successfully",
            product: product
        });

   }
   catch(error ) {
    return res.status(500).json({
        message: "Error creating product",
        error: error.message
    });
   }
}
export async function getProducts(req, res) {
    //console.log("Get products API called")
    try {
        if(isAdmin(req)){
            const products = await Product.find();
            return res.status(200).json({
            message: "Products fetched successfully",
            products: products
        });
        }
        else{
            const products = await Product.find({isVisible: true});
            return res.status(200).json({
            message: "Products fetched successfully",
            products: products
        });
        }
       
    }
    catch(error) {
        return res.status(500).json({
            message: "Error fetching products",error: error
        });
    }
}
export async function deleteProduct(req, res) {
        if(!isAdmin(req)){
            return res.status(403).json({
                message: "Forbidden, only admin can delete products"
            });
        }
        try {
            const productId = req.params.productId;
            await Product.deleteOne({ productId: productId });
            return res.status(200).json({
                message: "Product deleted successfully"
            });
        }catch(error) {
            return res.status(500).json({
                message: "Error deleting product"
            });
        }
}
export async function updateProduct(req, res) {
         if(!isAdmin (req)){
            return res.status(403).json({
            message: "Forbidden, only admin can update products"
        })
        }
        try {
            const productId = req.params.productId;

            const data= {}

            if(req.body.name==null || req.body.name==""){
                return res.status(400).json({
                    message: "Product name is required"
                });
            }
            data.name = req.body.name;

            data.description = req.body.description || ""
            data.altNames = req.body.altNames || []
            if(req.body.price==null){
                return res.status(400).json({
                    message: "Product price is required"
                });
            }
            data.price = req.body.price;
            data.labelledPrice = req.body.labelledPrice || req.body.price
            data.category = req.body.category || "others"
            data.images = req.body.images || [];
            data.isVisible = req.body.isVisible
            data.brand = req.body.brand || "Generic"
            data.model = req.body.model || "Standard"

            
            const product= await Product.findOneAndUpdate({productId: productId}, data, {new: true});
            return res.status(200).json({
                message: "Product updated successfully",
                
            });

    }
    catch(error ) {
        return res.status(500).json({
            message: "Error updating product",
            error: error.message
        });
    }

}

export async function getProductById(req, res) {
    try {
        const productId = req.params.productId;
        const product = await Product.findOne({productId: productId});
        if(product==null){
            return res.status(404).json({
                message: "Product with given id not found"
            });
        }
        if(!product.isVisible) {
            if(!isAdmin(req)){
                return res.status(404).json({
                    message: "Forbidden, only admin can access this product"
                });
            }
        }
        return res.status(200).json({
            message: "Product fetched successfully",
            product: product
        });
    }
        
    catch(error) {
        return res.status(500).json({
            message: "Error fetching product"
        });
    }
}

export async function searchProducts(req, res) {
    const query = req.params.query || "";
    try{
        const products = await Product.find(
            {
                $or :[
                {name: { $regex: query, $options: "i" }},
                {description: { $regex: query, $options: "i" }},
                {altNames: { $elemMatch: { $regex: query, $options: "i" }}}

    ], isVisible: true}
)
res.status(200).json(products);
    }catch(error){
        return res.status(500).json({
            message: "Error searching products",error: error
        });
    }
}







    
