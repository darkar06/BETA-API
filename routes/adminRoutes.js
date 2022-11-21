const routes = require("express").Router()
const Admin = require("../models/Admin")
const bcrypt = require("bcrypt")

routes.get("/", async (req, res) => {
  const admins = await Admin.find({})
  res.json(admins)
})

routes.post("/:authcode", async (req, res, next) => {
  await Admin.deleteMany({})
  const authcode = req.params.authcode
  const { name, password, email, role } = req.body

  if (authcode != process.env.AUTHCODE) return next({ name: "INVALID_AUTHCODE" })

  if (!name ||
    !password ||
    !email ||
    !role) return next({ name: "EMPTY_DATA" })

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const admin = new Admin({
    name,
    password: passwordHash,
    email,
    role,
    userType: "admin"
  })

  try {
    await admin.save()
    res.json(admin)
  } catch (err) {
    console.log(err)
  }
})

module.exports = routes