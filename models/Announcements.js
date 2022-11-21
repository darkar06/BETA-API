const { model, Schema } = require("mongoose")

const schema = new Schema({
  //   asignature: String,
  //   curse: String,
  //   section: String,
  classroom: { type: Schema.Types.ObjectId, ref: "ClassRoom" },
  author: { // esto lo pasa el token
    type: Schema.Types.ObjectId,
    ref: "Teacher",
    required: true
  },

  title: String,
  background: String,
  content: String,

})

schema.pre("find", function (next) {
  this.populate([{
    path: "classroom",
    select: "asignature"
  }, {
    path: "author",
    select: "userName"
  }])

  next()
})

schema.pre("save", function (next) {
  this.populate([{
    path: "classroom",
    select: ["asignature", { id: false }]
  }, {
    path: "author",
    select: "name"
  }])

  next()
})

schema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = model("Announcement", schema)