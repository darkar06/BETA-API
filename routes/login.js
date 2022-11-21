const router = require("express").Router()
const jwt = require("jsonwebtoken")
const Student = require("../models/Student")
const Teacher = require("../models/Teacher")
const bcrypt = require("bcrypt")
const path = require("path")
const nodemailer = require("nodemailer")
const Admin = require("../models/Admin")

router.post("/", async (req, res, next) => {
  const { email, password } = req.body

  console.log(req.body)

  if (password == undefined || password.length == 0) next({ name: "EMPTY_PASSWORD" })
  if (email == undefined || email.length == 0) next({ name: "EMPTY_EMAIL" })

  const student = await Student.findOne({ email })
  const teacher = await Teacher.findOne({ email })
  const admin = await Admin.findOne({ email })

  let user = null

  if (student) user = student
  else if (teacher) user = teacher
  else if (admin) user = admin

  const isCorrectPassword = user == null
    ? false
    : await bcrypt.compare(password, user.password)

  if (!isCorrectPassword) return next({ name: "INVALID_LOGIN_PASSWORD" })

  const jwtInfo = {
    id: user._id,
    typeUser: student
      ? "student"
      : admin
        ? "admin"
        : "teacher"
  }

  try {
    const token = jwt.sign(jwtInfo, process.env.PRIVATE_KEY)

    res.json({
      ...user.toJSON(),
      token
    })
  } catch (err) {
    console.log(err)
  }

})


router.post("/recuperacion", async (req, res, next) => {
  const { email } = req.body

  if (email == undefined) next({ name: "EMPTY_EMAIL" })

  const student = await Student.findOne({ email })
  const teacher = await Teacher.findOne({ email })

  const user = student === null ? teacher : student

  if (user == null) return next({ name: "INVALID_LOGIN_PASSWORD" })

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
    from: '"Beta App" <betatech022@gmail.com>', // sender address
    to: email, // list of receivers
    subject: "recuperacion contraseña", // Subject line
    // plain text body
    html: `
  <h1>recupera tu cuenta aca</h1>
<p>este es el email de recuperacion de tu cuenta, dale click <a href="http://localhost:5173/recuperacion/contrasena/${user._id}" style="display: inline-block; border-radius: 4px; padding: 4px 8px; color: white; background: rgb(0, 51, 171);">aqui</a> para poder cambiar tu contraceña y poder acceder a tu cuenta</p>
  `, // html body
  }

  const sendEmail = (err, info) => {
    err ? res.status(401).send(err) : res.status(200).json({ message: "verifique su email" })
  }

  await transporter.sendMail(emailInfo, sendEmail)

})

router.put("/password", async (req, res, next) => {
  const { id, password } = req.body
  console.log(req.body)

  if (id == undefined) return next({ name: "EMPTY_DATA" })
  if (password == undefined) return next({ name: "EMPTY_DATA" })

  const student = await Student.findById(id)
  const teacher = await Teacher.findById(id)

  const user = student === null ? teacher : student

  console.log(user)

  if (user == null) return next({ name: "INVALID_LOGIN_PASSWORD" })

  user.password = await bcrypt.hash(password, 10)

  try {
    await user.save()
    res.json({ message: "password cambiada" })
  } catch (err) {
    next(err)
  }
})

module.exports = router

