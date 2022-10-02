const { model, Schema } = require("mongoose")

const scoreSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: "Student"
  },
  asignature: String,
  periods :{
    p1: String,
    p2: String,
    p3: String,
    p4: String
  }
})

scoreSchema.set("toJSON",{
  transform: (document, returnedObject)=>{
    returnedObject.id = returnedObject._id
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Score = model("Score", scoreSchema)


module.exports = Score