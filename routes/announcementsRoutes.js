const router = require("express").Router()
const Announcements = require("../models/Announcements")
const decodeToken = require("../utils/decodeToken")
const ClassRoom = require("../models/ClassRoom")
const Teacher = require("../models/Teacher")
const multer = require("multer")
const path = require("path")
const generateID = require("../utils/generateID")
const { unlink } = require("fs")


router.get("/", async (req, res) => {
  const anuncio = await Announcements.find({ classroom: null })
  res.json(anuncio)
})

router.get("/classroom/:id", async (req, res, next) => {
  const { id } = req.params
  if (!id) return next({ name: "INVALID_ID" })
  const anuncio = await Announcements.find({ classroom: id })
  res.json(anuncio)
})

router.get("/:id", async (req, res, next) => {
  const { id } = req.params
  let anuncio = null
  try {
    anuncio = await Announcements.findById(id).populate([{
      path: "classroom",
      select: "asignature"
    }, {
      path: "author",
      select: "userName"
    }])
  } catch (err) {
    return next(err)
  }

  res.json(anuncio)
})


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
    fileSize: 100000000
  },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpg|jpeg|png/
    const mimetype = fileTypes.test(file.mimetype)
    const extName = fileTypes.test(path.extname(file.originalname))

    if (mimetype && extName) return cb(null, true)
    cb({
      name: "INVALID_DATA",
      content: "el tipo de archivo no es valido"
    })
  }
}).single("myfile")

router.post("/", upload, async (req, res, next) => {
  const { id, title, content } = req.body
  const { authorization } = req.headers
  console.log(authorization)
  const { file } = req
  const token = decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({ name: "UNAUTURIZED" })

  if (!title || !content) return next({ name: "EMPTY_DATA" })

  let teacher = null
  try {
    teacher = await Teacher.findById(token.id)
  } catch (err) {
    return next(err)
  }

  if (teacher == null) return next({ name: "INVALID_ID" })

  let privateU = null
  let classroom = null

  if (id) {
    privateU = true

    try {
      classroom = id ? await ClassRoom.findById(id) : null
    } catch (err) {
      next(err)
    }

    if (!classroom) return next({ name: "INVALID_ID" })
  }
  else {
    privateU = false
  }



  const document = file ? file.filename : null


  const newAnuncio = new Announcements({
    title,
    content: content,
    background: document,

    private: privateU,
    classroom: classroom !== null ? classroom._id : null,
    author: teacher._id
  })

  try {
    await newAnuncio.save()
  } catch (err) {
    return next(err)
  }

  if (classroom) {
    classroom.announcements = [...classroom.announcements, newAnuncio._id]
    try {
      await classroom.save()
    } catch (err) {
      return next(err)
    }
  }

  try {
    teacher.announcements = [...teacher.announcements, newAnuncio]
    await teacher.save()
  } catch (err) {
    return next(err)
  }

  res.json(newAnuncio)
})

router.delete("/", async (req, res, next) => {
  const { id } = req.body
  const { authorization } = req.headers
  const token = decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({ name: "UNAUTURIZED" })

  let anuncio = null
  try { anuncio = await Announcements.findById(id) }
  catch (err) { return next(err) }
  if (anuncio == null) return next({ name: "INVALID_ID" })
  console.log(anuncio)

  let teacher = null
  try { teacher = await Teacher.findById(token.id) }
  catch (err) { return next(err) }
  if (teacher == null) return next({ name: "INVALID_ID" })
  console.log(teacher)

  let classroom = null
  if (anuncio.classroom) {
    classroom = await ClassRoom.findById(anuncio.classroom)
    if (!classroom) return next({ name: "INVALID_ID" })
    classroom.announcements = classroom.announcements
      .filter(res => res.toString() != anuncio._id.toString())
    console.log(classroom)
    try {
      await classroom.save()
    } catch (err) {
      return next(err)
    }
  }


  teacher.announcements = teacher.announcements
    .filter(res => res.toString() != anuncio._id.toString())
  try {
    await teacher.save()
  } catch (err) {
    return next(err)
  }

  if (anuncio.background) {
    try {
      unlink(`upload/${anuncio.background}`, () => console.log("eliminado correctamente"))
    } catch (err) {
      return next(err)
    }
  }

  try {
    await anuncio.deleteOne()
    res.json({ message: "anuncio eliminado" })
  } catch (err) {
    return next(err)
  }
})

module.exports = router