const { model, Schema } = require("mongoose")

const schema = new Schema({
  name: String,
  userName: String,
  password: String,
  email: String,
  role: String,
  userType: String
})

schema.set("toJSON",{
  transform: (document, returnedObject)=>{
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.password
  }
})

module.exports = model("Admin", schema)