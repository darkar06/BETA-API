const { model, Schema } = require("mongoose")

const studentSchema = new Schema({
  name: String,
  userName: String,
  password: String,
  email: String,
  curse: String,
  section: String,
  userType: String,
  skills: [
    String
  ],
  scores: [
    {
      type: Schema.Types.ObjectId,
      ref: "Score"
    }
  ],
  classrooms: [
    {
      type: Schema.Types.ObjectId,
      ref: "ClassRoom"
    }
  ],
  repots: [
    {
      type: Schema.Types.ObjectId,
      ref: "Report"
    }
  ]
})

studentSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.password
  }
})

const Student = model("Student", studentSchema)



module.exports = Student