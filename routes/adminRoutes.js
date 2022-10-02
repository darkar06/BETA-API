const routes = require("express").Router()
const Admin = require("../models/Admin")

routes.get("/",async( req, res ) => {
  const admins = await Admin.find({})
  res.json(admins)
})

routes.post("/:authcode", async( req, res, next) => {
  const authcode = req.params.authcode
  const { name, password, email, role} = req.body

  if (authcode != process.env.AUTHCODE) return next({name: "INVALID_AUTHCODE"})

  if (!name ||
    !password ||
    !email ||
    !role) return next({name: "EMPTY_DATA"})

  const admin = new Admin({
    name,
  })
})

module.exports = routes