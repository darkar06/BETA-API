const router = require("express").Router()
const ClassRoom = require("../models/ClassRoom")
const decodeToken = require("../utils/decodeToken")
const Teacher = require("../models/Teacher")
const Student = require("../models/Student")
const Score = require("../models/Score")
const Announcements = require("../models/Announcements")

router.get("/", async (req, res) => {
  const classRooms = await ClassRoom.find({})

  res.json(classRooms)
})

router.get("/myclass/:userName", async (req, res, next) => {
  const { userName } = req.params

  if (!userName) return next({ name: "EMPTY_DATA" })

  const student = await Student.findOne({ userName })
  const teacher = await Teacher.findOne({ userName })

  const user = student === null ? teacher : student

  let classrooms = []

  for (let id of user.classrooms) {
    let findClassroom = await ClassRoom.findById(id).populate("teacher")
    classrooms = [...classrooms, findClassroom]
  }

  if (user == null) return next({ name: "INVALID_AUTHCODE" })

  res.json(classrooms)

})

router.get("/:id", async (req, res, next) => {
  const { id } = req.params
  const classroom = await ClassRoom.findById(id).populate("students", {
    name: 1,
    userName: 1,
    curse: 1
  })
    .populate("teacher", {
      name: 1,
      userName: 1
    }).populate("homeworks", {
      title: 1,
      content: 1
    }).populate("announcements", {
      title: 1,
      content: 1
    })

  if (!classroom) return next({ name: "INVALID_ID" })

  res.json(classroom)
})

router.post("/", async (req, res, next) => {
  const { asignature, curse, section } = req.body
  const { authorization } = req.headers
  const token = decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({ name: "UNAUTURIZED" })

  if (!asignature || !curse || !section) return next({ name: "EMPTY_DATA" })

  let teacher = null
  try {
    teacher = await Teacher.findById(token.id)
  } catch (err) {
    return next(err)
  }

  if (teacher == null) return next({ name: "INVALID_ID" })

  const newClassRoom = new ClassRoom({
    asignature,
    curse,
    section,
    teacher: teacher._id
  })

  let classRoom = null
  try {
    classRoom = await newClassRoom.save()
  } catch (err) {
    console.log(err)
  }

  const students = await Student.find({ curse, section })

  for (let student of students) {
    student.classrooms = [...student.classrooms, classRoom._id]
    let newScore = new Score({
      student: student._id,
      asignature,
      periods: {
        p1: 0,
        p2: 0,
        p3: 0,
        p4: 0
      }
    })
    let score = await newScore.save()
    student.scores = [...student.scores, score]
    await student.save()
    classRoom.students = [...classRoom.students, student._id]
  }

  teacher.classrooms = [...teacher.classrooms, classRoom._id]

  let classroom = null

  try {
    await teacher.save()
    classroom = await classRoom.save()
    classroom = await ClassRoom.findById(classroom._id)
      .populate("students", {
        name: 1,
        userName: 1,
      })
      .populate("teacher", {
        name: 1,
        userName: 1
      })
    res.json(classroom)
  } catch (err) {
    console.log(err)
  }
})

router.delete("/:id", async (req, res, next) => {
  const { id } = req.params
  const { authorization } = req.headers
  const token = decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({ name: "UNAUTURIZED" })
  let classroom = null
  try {
    classroom = await ClassRoom.findById(id)
  } catch (err) {
    return next(err)
  }


  if (classroom == null) return next({ name: "INVALID_ID" })

  for (let studentID of classroom.students) {
    const user = await Student.findById(studentID).populate("scores").populate("classrooms")

    // let dE = user.classRooms.find( cr => cr.asignature == classroom.asignature)
    user.classrooms = user.classrooms.filter(cr => cr._id != id)

    let deleteScore = user.scores.find(cr => cr.asignature == classroom.asignature)
    user.scores = user.scores.filter(sc => sc._id != deleteScore._id)
    await user.save()
  }

  for (let anuncio of classroom.announcements) {
    await Announcements.deleteOne({ _id: anuncio })
  }

  let teacher = null

  try {
    teacher = await Teacher.findById(classroom.teacher)
  } catch (err) {
    console.log(err)
  }

  if (teacher == null) return next({ name: "INVALID_ID" })
  teacher.classrooms = teacher.classrooms.filter(cr => cr != id)
  await teacher.save()

  try {
    await ClassRoom.deleteOne({ _id: id })
    res.json({ message: "classroom eliminado" })
  } catch (err) {
    next(err)
  }
})

module.exports = router