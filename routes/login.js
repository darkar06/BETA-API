const router = require("express").Router()
const jwt = require("jsonwebtoken")
const Student = require("../models/Student")
const Teacher = require("../models/Teacher")
const bcrypt = require("bcrypt")

router.post("/",async(req,res,next)=>{
  const { email, password } = req.body

  if(password == undefined) next({ name: "EMPTY_PASSWORD"  })
  if(email == undefined) next({ name: "EMPTY_EMAIL"  })

  const student = await Student.findOne({ email })
  const teacher = await Teacher.findOne({ email })

  const user = student == null ? teacher : student

  const isCorrectPassword = user == null 
    ? false
    : await bcrypt.compare( password, user.password )

  if (!isCorrectPassword) return next({ name: "INVALID_LOGIN_PASSWORD" })

  const jwtInfo = {
    id: user._id,
    typeUser: student == null ? "teacher" : "student"
  }

  try{
    const token = jwt.sign( jwtInfo, process.env.PRIVATE_KEY)

    res.json({
      ...user.toJSON(),
      token
    })
  }catch(err){
    console.log(err)
  }

})

module.exports = router

