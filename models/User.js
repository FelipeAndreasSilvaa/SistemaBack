const {default: mongoose, Schema} = require('mongoose')

const UserSchema = new Schema({
    name: String,
    email: String,
    password: String
})

const UserModel = mongoose.model('users', UserSchema)
module.exports = UserModel