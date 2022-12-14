require("dotenv").config()
require("./mongodb")
const express = require("express")
const app = express()
const cors = require("cors")
const path = require("path")
// Routes
const login = require("./routes/login")
const teacherRoutes = require("./routes/teacherRoutes")
const classroomRoutes = require("./routes/classRoomRoutes")
const announcementsRoutes = require("./routes/announcementsRoutes")
const studentRoutes = require("./routes/studentRoutes")
const homeworksRoutes = require("./routes/homeworksRoutes")
const taskRoutes = require("./routes/taskRoutes")
const scoreRoutes = require("./routes/scoreRoutes")
const adminRoutes = require("./routes/adminRoutes")
//error handlers
const errorHandler = require("./errorHandler")

// const multer = require("multer")
// const path = require("path")
// const generateID = require("./utils/generateID")

// const storage = multer.diskStorage({
//   filename: ( req, file, cb )=>{
//     cb(null, new Date().getTime() + generateID(10) + path.extname(file.originalname))
//   },
//   destination:  path.join(__dirname, "upload")

// })

// const upload = multer({
//   storage,
//   dest: path.join( __dirname , "upload"),
//   limits: {
//     fileSize: 1000000
//   },
//   fileFilter: (req,file,cb)=>{
//     const fileTypes = /jpg|jpeg|pdf|docx|png/
//     const mimetype = fileTypes.test(file.mimetype)
//     const extName = fileTypes.test(path.extname(file.originalname))

//     if (mimetype && extName) return cb(null, true)
//     cb({
//       name: "INVALID_DATA",
//       content: "el tipo de archivo no es valido"
//     })
//   }
// }).single("myfile")
app.use(cors())

app.use(express.json())

app.use((req, res, next) => {
  console.log("__________________________________")
  console.log(req.path)
  console.log(req.body)
  next()
})

//routes
app.use("/homework", express.static("src/homework"))
app.use("/task", express.static("src/task"))
app.use("/api/login", login)
app.use("/upload", express.static("upload"))

//app.use("/api/login/:id", express.static( "routes/public"))

// app.post("/api/uploads",upload, (req,res)=>{
//   console.log(req.file)
//   res.send("hola")
// })

app.use("/api/student", studentRoutes)
app.use("/api/score", scoreRoutes)
app.use("/api/teacher", teacherRoutes)
app.use("/api/classroom", classroomRoutes)
app.use("/api/announcements", announcementsRoutes)
app.use("/api/homework", homeworksRoutes)
app.use("/api/task", taskRoutes)
app.use("/api/admin", adminRoutes)

//error handlers

app.use((req, res) => {
  res.json({ message: "ruta no encontrada" })
})

app.use(errorHandler)

//listen server

const PORT = process.env.PORT || 3200

const server = app.listen(PORT, () => {
  console.log("server on port ", PORT)
})

module.exports = { app, server }