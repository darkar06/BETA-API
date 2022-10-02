const routes = require("express").Router()
const Teacher = require("../models/Teacher")
const bcrypt = require("bcrypt")
const generateID = require("../utils/generateID")
const decodeToken = require("../utils/decodeToken")
const Classroom = require("../models/ClassRoom")
const Announcements = require("../models/Announcements")


routes.get("/",async(req,res)=>{
  const teachers = await Teacher.find({})
  res.json(teachers)
})

routes.post("/find",async(req,res,next)=>{
  const {name} = req.body
  const {authorization} = req.headers
  const token =  decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({name: "UNAUTURIZED"})

  let teachers = null
  try{
    teachers = await Teacher.find({name})
  }catch(err){
    return next(err)
  }
  res.json(teachers)
})

routes.post("/",async(req,res,next)=>{
  const { name, password, email, asignature, curses } = req.body
  
  if ( 
    (name == undefined || name == null ) ||
    (password == undefined || password == null) ||
    (email == undefined || email == null) || 
    (asignature == undefined || asignature == null) || 
    (curses == undefined || curses == null || curses.length < 1) ){
    return next({name: "EMPTY_DATA"})
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password,saltRounds)
  const newUserName = name + generateID(5)

  const newTeacher = new Teacher({
    name,
    userName: newUserName,
    password: passwordHash,
    email,
    curses,
    asignature,
    userType: "teacher"
  })

  try{
    const teacher = await newTeacher.save()
    res.json(teacher)
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

  let teacher = null
  try{
    teacher = await Teacher.findById(token.id)
  }catch(err){
    return next(err)
  }

  const isCorrectPassword = teacher == null
    ? false
    : await bcrypt.compare(password,teacher.password)

  if (!isCorrectPassword) return next({name: "INVALID_PASSWORD"})

  //encriptando la nueva contraceña

  const saltRounds = 10
  const updatePassword = await bcrypt.hash(newPassword,saltRounds)
  teacher.password = updatePassword
    
  try{
    await teacher.save()
    res.json({message: "la contraseña fue cambiada"})
  }catch(err){
    console.log(err)
    next({name: "DEFAULT_ERROR"})
  }
})

routes.delete("/",async(req,res)=>{
  const {userName} = req.body

  const user = await Teacher.findOne({userName})
  console.log(user)

  for (let classroom of user.classRooms){
    const cr = await  Classroom.findById(classroom)
    cr.announcements = cr.announcements.filter(res => !user.announcements.includes(res) )
    cr.teacher = null
    await cr.save()
  }

  for (let anuncios of user.announcements){
    await Announcements.findByIdAndDelete(anuncios)
  }
  await Teacher.deleteOne({userName})
  res.json({message: "usuario eliminado"})


})

module.exports = routes