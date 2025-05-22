const { default: mongoose, Schema} = require("mongoose");

const ProductSchema = new Schema({
  name: String,
  categoria: String,
  preco: Number,
  imagem: String,
})

const ProductModel = mongoose.model('product', ProductSchema)
module.exports = ProductModel