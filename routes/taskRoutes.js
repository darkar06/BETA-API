const routes = require("express").Router()
const Task = require("../models/Task")
const Student = require("../models/Student")
const Homework = require("../models/Homework")
const decodeToken = require("../utils/decodeToken")
const { unlink } = require("fs")

const multer = require("multer")
const path = require("path")
const generateID = require("../utils/generateID")

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + generateID(10) + path.extname(file.originalname))
  },
  destination: path.join(__dirname, "../upload")

})

const upload = multer({
  storage,
  dest: path.join(__dirname, "../upload"),
  limits: {
    fileSize: 10000000
  },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpg|jpeg|pdf|docx|png/
    const extName = fileTypes.test(path.extname(file.originalname))

    if (extName) return cb(null, true)
    cb({
      name: "INVALID_DATA",
      content: "el tipo de archivo no es valido"
    })
  }
}).single("myfile")

routes.get("/", async (req, res) => {
  const tasks = await Task.find({})
  res.json(tasks)
})

routes.get("/homework/:id", async (req, res) => {
  const { id } = req.params

  const tasks = await Task.find({ homework: id })
    .populate("student")
  res.json(tasks)
})

routes.post("/", upload, async (req, res, next) => {
  const { file } = req
  const { id } = req.body
  const { authorization } = req.headers
  const token = decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (!token.typeUser === "student") return next({ name: "UNAUTURIZED" })

  const isSended = await Task.findOne({ student: token.id, homework: id })
  if (isSended !== null) return res.json({ error: "ya entregaste esta tarea" })

  let student = null

  try {
    student = await Student.findById(token.id)
  } catch (err) {
    return next(err)
  }

  if (!student) return next({ name: "INVALID_ID" })

  let homework = null

  try {
    homework = await Homework.findById(id)
  } catch (err) {
    return next(err)
  }
  if (!homework) return next({ name: "INVALID_ID" })


  const document = file ? file.filename : null

  const newTask = new Task({
    homework: homework._id,
    student: student._id,
    documentURI: document,
    getAt: new Date()
  })

  try {
    await newTask.save()
  } catch (err) {
    return next(err)
  }

  homework.receivedBy = [...homework.receivedBy, newTask._id]

  try {
    await homework.save()
  } catch (err) {
    return next(err)
  }

  res.json({ message: "tarea entregada" })
})

routes.delete("/", async (req, res, next) => {
  const { id } = req.body

  let task = null

  try {
    task = await Task.findById(id)
  } catch (err) {
    return next(err)
  }

  if (!task) return next({ name: "INVALID_ID" })
  let homework = null

  try {
    homework = await Homework.findById(task.homework)
  } catch (err) {
    return next(err)
  }

  homework.receivedBy = homework.receivedBy.filter(res => res.toString() != task._id.toString())

  try {
    await homework.save()
  } catch (err) {
    return next(err)
  }

  if (task.documentURI) {
    try {
      unlink(`upload/${document.document}`, () => console.log("eliminado correctamente"))
    } catch (err) {
      return next(err)
    }
  }


  try {
    await Task.findByIdAndDelete(task._id)
  } catch (err) {
    return next(err)
  }

  res.json({ message: "entrega eliminada" })
})

module.exports = routes