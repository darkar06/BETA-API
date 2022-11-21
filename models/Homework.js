const { model, Schema } = require("mongoose")

const schema = new Schema({
  classroom: {
    type: Schema.Types.ObjectId,
    ref: "ClassRoom",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: String,
  receivedBy: [
    {
      type: Schema.Types.ObjectId,
      ref: "Task"
    }
  ],
  document: String
  //anadir comentarios futuramente
  //comments : [{type: SChema.Types.ObjectId, ref: "Comments"}]
})

// schema.pre("save", function() {
//   console.log(this)
//   this.populate("recibeBy",{
//     name: 1
//   })
// })

schema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = model("Homework", schema)