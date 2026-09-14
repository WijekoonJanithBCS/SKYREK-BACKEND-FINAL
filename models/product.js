import mongoose, { model } from "mongoose";

const productSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        //this is product name
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    altNames: {
        type: [String],
        default: []
    },
    price: {
        type: Number,
        required: true
    },
    labelledPrice: {
        type: Number,
    },
    category: {
        type: String,
        default:"others"
    },
    images: {
        type: [String],
        default: []
    },
    isVisible: {
        type: Boolean,
        default: true,
        required: true
    },
    brand: {
        type: String,
        default: "Generic"
    },
    model: {
        type: String,
        default: "Standard"
    },
    qty: {
        type: Number,
        default: 100
    }
});

const Product = mongoose.model('Product', productSchema);

export default Product;