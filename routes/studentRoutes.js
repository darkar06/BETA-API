const routes = require("express").Router()
const Student = require("../models/Student")
const bcrypt = require("bcrypt")
const generateID = require("../utils/generateID")
const decodeToken = require("../utils/decodeToken")
const Classroom = require("../models/ClassRoom")
const nodemailer = require("nodemailer")
const Score = require("../models/Score")


routes.get("/", async (req, res) => {
  const students = await Student.find({}).populate("scores")
  res.json(students)
})

routes.get("/find/username/:userName", async (req, res, next) => {
  const { userName } = req.params
  const { authorization } = req.headers
  const token = decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({ name: "UNAUTURIZED" })

  let student

  try {
    student = await Student.findOne({ userName }).populate("scores")
  } catch (err) {
    return next(err)
  }

  if (student == null) return next({ name: "INVALID_ID" })
  return res.json(student)

})


routes.get("/find/name/:name", async (req, res, next) => {
  const { name } = req.params
  const { authorization } = req.headers
  const token = decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({ name: "UNAUTURIZED" })

  const regex = new RegExp(name, "i")

  let students

  try {
    students = await Student.find({ name: regex }, "name userName")
  } catch (err) {
    return next(err)
  }

  if (!students) return next({ name: "INVALID_ID" })

  return res.json(students)

})


routes.post("/find/curse", async (req, res, next) => {
  console.log(req.body)
  const { section, curse } = req.body
  const { authorization } = req.headers
  const token = decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({ name: "UNAUTURIZED" })

  let students = null
  try {
    students = await Student.find({ section, curse }).populate("scores")
    console.log(students)
  } catch (err) {
    return next(err)
  }
  res.json(students)
})

routes.post("/", async (req, res, next) => {
  const { name, email, curse, section } = req.body

  if (
    (name == undefined || name == null) ||
    (email == undefined || email == null) ||
    (curse == undefined || curse == null) ||
    (section == undefined || section == null)) {
    return next({ name: "EMPTY_DATA" })
  }

  const isLoggedUser = await Student.findOne({ email })
  if (isLoggedUser) return next({ name: "INVALID_INPUT" })

  const password = generateID(15)

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)
  const newUserName = name.split(" ")[0] + generateID(5)

  const newStudent = new Student({
    name,
    userName: newUserName,
    password: passwordHash,
    email,
    curse,
    section,
    userType: "student"
  })


  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'betatech022@gmail.com',
      pass: 'bjurcdpwwlpaveua'
    }
  })

  const emailInfo = {
    from: '"BetaApp" <betatech022@gmail.com>', // sender address
    to: email, // list of receivers
    subject: "tu cuenta ha sido creada", // Subject line
    // plain text body
    html: `
  <h1>aqui esta la informacion de tu cuenta</h1>
  <p>esta informacion es privada y no deberia conocerla nadie mas que tu y tus padres, asi que ten mucho cuidado</p>
  <span>tu cuenta es </span>
  <ul>
    <li><b>correo:</b>  ${email}</li>
    <li><b>contraseña:</b>  ${password}</li>
  </ul>
  <p>visita la aplicacion de BetaApp para poder loguearte</p>
  `, // html body
  }

  const sendEmail = (err, info) => {
    err ? res.status(401).send(err) : res.status(200).json({ message: "verifique su email" })
  }

  await transporter.sendMail(emailInfo, sendEmail)

  try {
    await newStudent.save()
  } catch (err) {
    return next(err)
  }

  const classrooms = await Classroom.find({ curse, section })

  if (classrooms) {
    for (let classroom of classrooms) {
      classroom.students = [...classroom.students, newStudent._id]
      await classroom.save()

      let newScore = new Score({
        student: newStudent._id,
        asignature: classroom.asignature,
        periods: {
          p1: 0,
          p2: 0,
          p3: 0,
          p4: 0
        }
      })
      let score = await newScore.save()
      newStudent.scores = [...newStudent.scores, score._id]
      newStudent.classrooms = [...newStudent.classrooms, classroom._id]
      await newStudent.save()
    }
  }

  try {
    res.json(newStudent)
  } catch (err) {
    next(err)
  }
})

routes.put("/", async (req, res, next) => {
  const { password, newPassword } = req.body
  const Authorization = req.headers.authorization
  const token = decodeToken(Authorization)

  console.log(req.headers)
  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })

  // validacion de las contraceñas

  if (newPassword === undefined || password === undefined) return next({ name: "EMPTY_PASSWORD" })
  if (newPassword.length < 8) return next({ name: "SHORT_LENGTH" })

  let student = null

  try {
    student = await Student.findById(token.id)
  } catch (err) {
    return next(err)
  }

  const isCorrectPassword = student == null
    ? false
    : await bcrypt.compare(password, student.password)

  if (!isCorrectPassword) return next({ name: "INVALID_PASSWORD" })

  //encriptando la nueva contraceña

  const saltRounds = 10
  const updatePassword = await bcrypt.hash(newPassword, saltRounds)
  student.password = updatePassword

  try {
    await student.save()
    res.json({ message: "la contraseña fue cambiada" })
  } catch (err) {
    console.log(err)
  }
})

routes.delete("/:userName", async (req, res, next) => {
  const { userName } = req.params

  console.log(userName)

  let user = null

  try {
    user = await Student.findOne({ userName })
  } catch (err) {
    return next(err)
  }

  if (user == null) return next({ name: "INVALID_ID" })

  for (let classroom of user.classrooms) {
    const cr = await Classroom.findById(classroom)
    cr.students = cr.students.filter(res => res.toString() !== user._id - this.toString())
    await cr.save()
  }

  try {
    await Student.deleteOne({ userName })
    res.json({ message: "usuario eliminado" })
  } catch (err) {
    return next(err)
  }
})

module.exports = routes