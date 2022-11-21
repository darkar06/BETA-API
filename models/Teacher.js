const { model, Schema } = require("mongoose")

const TeacherSchema = new Schema({
  name: String,
  userName: String,
  password: String,
  email: String,
  asignatures: [String],
  curses: [String], //estos son los cursos a los que se les impartira clasese
  userType: String,
  classrooms: [
    {
      type: Schema.Types.ObjectId,
      ref: "ClassRoom"
    }
  ],
  announcements: [
    {
      type: Schema.Types.ObjectId,
      ref: "Announcement"
    }
  ]
})

TeacherSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.password
  }
})

const Teacher = model("Teacher", TeacherSchema)



module.exports = Teacher