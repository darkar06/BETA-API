const { model, Schema } = require("mongoose")

const classRoomSchema = new Schema({
  asignature: String,
  curse: String,
  section: String,
  teacher: {
    type: Schema.Types.ObjectId,
    ref: "Teacher"
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: "Student"
  }],
  homeworks: [
    {
      type: Schema.Types.ObjectId,
      ref: "Homework"
    }
  ],
  announcements: [
    {
      type: Schema.Types.ObjectId,
      ref: "Announcement"
    }
  ]

})



// classRoomSchema.pre("find",function(next){
//   this.populate([{
//     path: "students",
//     select: ["name","userName"]
//   },{
//     path: "teacher",
//     select: ["name","userName"]
//   }])
//   next()
// })

// classRoomSchema.pre("save", function (next) {
//   this.populate([{
//     path: "students",
//     select: ["name", "userName", "curse"]
//   }])
//   next()
// })

classRoomSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Classroom = model("ClassRoom", classRoomSchema)



module.exports = Classroom