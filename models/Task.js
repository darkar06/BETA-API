const { model, Schema } = require("mongoose")

const schema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: "Student"
  },
  homework: {
    type: Schema.Types.ObjectId,
    ref: "Homework"
  },
  getAt: Date,
  documentURI: String
})


schema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id
    delete returnedObject._id
    delete returnedObject.__v
  }
})

schema.pre("find", function (next) {
  this.populate({
    path: "student",
    select: ["name", "userName"]
  },)
  next()
})


module.exports = model("Task", schema)