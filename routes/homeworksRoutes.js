const router = require("express").Router()
const Homework = require("../models/Homework")
const decodeToken = require("../utils/decodeToken")
const ClassRoom = require("../models/ClassRoom")
const Task = require("../models/Task")
const { unlink } = require("fs")
//multer config 

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
    fileSize: 1000000
  },
  fileFilter: (req, file, cb) => {
    console.log(file)
    const fileTypes = /jpg|jpeg|pdf|docx|png/
    const extName = fileTypes.test(path.extname(file.originalname))

    if (extName) return cb(null, true)
    cb({
      name: "INVALID_DATA",
      content: "el tipo de archivo no es valido"
      //tengo que solucionar que no envia ese error
    })
  }
}).single("myfile")

//routes

router.get("/classroom/:id", async (req, res, next) => {
  const { id } = req.params
  if (id == undefined || id == null) return next({ name: "INVALID_ID" })
  const homeworks = await Homework.find({ classroom: id })
  res.json(homeworks)
})

router.get("/:id", async (req, res, next) => {
  const { id } = req.params
  if (id == undefined || id == null) return next({ name: "INVALID_ID" })
  const homeworks = await Homework.findById(id).populate("receivedBy", {
    student: 1
  })
  res.json(homeworks)
})

router.post("/", upload, async (req, res, next) => {
  const { id, title, content } = req.body
  const { file } = req
  //token validation
  const { authorization } = req.headers
  const token = decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({ name: "UNAUTURIZED" })

  const document = file ? file.filename : null

  console.log("aaaa")

  if (!id || !title || !content) return next({ name: "EMPTY_DATA" })

  let classroom = null

  try {
    classroom = await ClassRoom.findById(id)
  } catch (err) {
    return next(err)
  }

  console.log("eee")

  if (!classroom) return next({ name: "INVALID_ID" })

  const newHomeWork = new Homework({
    title,
    content,
    document,
    classroom: classroom._id
  })

  try {
    await newHomeWork.save()
  } catch (err) {
    return next(err)
  }

  classroom.homeworks = [...classroom.homeworks, newHomeWork._id]


  console.log("iii")
  try {
    await classroom.save()
  } catch (err) {
    return next(err)
  }

  console.log("ooo")
  res.json(newHomeWork)


})

router.delete("/:id", async (req, res, next) => {
  const { id } = req.params
  console.log(id)
  let document = null
  const { authorization } = req.headers
  const token = decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({ name: "UNAUTURIZED" })

  try {
    document = await Homework.findById(id)
    console.log(document)
  } catch (err) {
    return next(err)
  }

  if (!document) return next({ name: "INVALID_ID" })

  console.log(document)

  if (document.document) {
    try {
      unlink(`upload/${document.document}`, () => console.log("eliminado correctamente"))
    } catch (err) {
      return next(err)
    }
  }

  const tasks = await Task.find({ homework: id })
  console.log(tasks)


  for (let task of tasks) {
    if (task.documentURI) {
      unlink(`upload/${task.documentURI}`, () => {
        console.log("eliminado")
      })
    }
  }

  try {
    await Homework.findByIdAndDelete(id)
  } catch (err) {
    return next(err)
  }

  res.json({ message: "tarea eliminada" })
})

module.exports = router