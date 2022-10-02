const routes = require("express").Router()
const Student = require("../models/Student")
const bcrypt = require("bcrypt")
const generateID = require("../utils/generateID")
const decodeToken = require("../utils/decodeToken")
const ClassRoom = require("../models/ClassRoom")

routes.get("/",async(req,res)=>{
  const students = await Student.find({}).populate("scores")
  res.json(students)
})

routes.post("/find",async(req,res,next)=>{
  const {name, curse} = req.body
  const {authorization} = req.headers
  const token =  decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({name: "UNAUTURIZED"})

  let students = null
  try{
    students = await Student.find({name, curse})
  }catch(err){
    return next(err)
  }
  res.json(students)
})

routes.post("/",async(req,res,next)=>{
  const { name, password, email, curse, section } = req.body

  if ( 
    (name == undefined || name == null ) ||
  (password == undefined || password == null) ||
  (email == undefined || email == null) || 
  (curse == undefined || curse == null) || 
  (section == undefined || section == null) ){
    next({name: "EMPTY_DATA"})
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password,saltRounds)
  const newUserName = name + generateID(5)

  const newStudent = new Student({
    name,
    userName: newUserName,
    password: passwordHash,
    email,
    curse,
    section,
    userType: "student"
  })

  try{
    const student = await newStudent.save()
    res.json(student)
  }catch(err){
    next(err)
  }
})

routes.put("/",async(req,res,next)=>{
  const { password, newPassword} = req.body
  const Authorization = req.headers.authorization
  const token = decodeToken( Authorization )
  
  if (!token || !token.id) return next({name: "INVALID_TOKEN"})

  // validacion de las contraceñas

  if ( newPassword === undefined || password === undefined ) return next({name: "EMPTY_PASSWORD"})
  if ( newPassword.length < 8 ) return next({name: "SHORT_LENGTH"})

  let student = null

  try{
    student = await Student.findById(token.id)
  }catch(err){
    return next(err)
  }

  const isCorrectPassword = student == null
    ? false
    : await bcrypt.compare(password,student.password)

  if (!isCorrectPassword) return next({name: "INVALID_PASSWORD"})

  //encriptando la nueva contraceña

  const saltRounds = 10
  const updatePassword = await bcrypt.hash(newPassword,saltRounds)
  student.password = updatePassword
    
  try{
    await student.save()
    res.json({message: "la contraseña fue cambiada"})
  }catch(err){
    console.log(err)
  }
})

routes.delete("/",async(req,res)=>{
  const {userName} = req.body

  const user = await Student.findOne({userName})

  for (let classroom of user.classRooms){
    const cr = await ClassRoom.findById(classroom)
    cr.students = cr.students.filter(res => res.toString() !== user._id-this.toString())
    await cr.save()
  }

  


  await Student.deleteOne({userName})
  res.json({message: "usuario eliminado"})


})

module.exports = routes