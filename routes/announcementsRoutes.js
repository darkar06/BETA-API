const router = require("express").Router()
const Announcements = require("../models/Announcements")
const Annoucements = require("../models/Announcements")
const decodeToken = require("../utils/decodeToken")
const ClassRoom = require("../models/ClassRoom")
const Teacher = require("../models/Teacher")

router.post("/get",async(req,res)=>{
  const {private} = req.body
  let anuncios = null

  if (!private){
    anuncios = await Annoucements.find({}).populate("author")
    res.json(anuncios)
  } else{
    anuncios = await Annoucements.find({private}).populate("author")
    res.json(anuncios)
  }
})

router.get("/:id", async(req,res,next)=>{
  const {id} = req.params
  let anuncio = null 
  try{
    anuncio = await Announcements.findById(id).populate([{
      path:  "classroom",
      select: "asignature"
    },{
      path:  "author",
      select: "userName"
    }])
  }catch(err){
    return next(err)
  }

  res.json(anuncio)
})

router.post("/",async( req, res, next)=>{
  const {id, content } = req.body
  const {authorization} = req.headers
  const token =  decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({name: "UNAUTURIZED"})

  let teacher = null 
  try{
    teacher = await Teacher.findById(token.id) 
  }catch(err){
    return next(err)
  }

  if (teacher == null) return next({ name: "INVALID_ID" })

  let private = null
  let classroom = null

  if (id){
    private = true

    try{
      classroom = await ClassRoom.findById(id)
    }catch(err){
      next(err)
    }
    
    if (!classroom) return next({name: "INVALID_ID"})
  }
  else{
    private = false
  }

  const newAnuncio = new Announcements({
    content,
    private,
    classroom: classroom ? classroom._id: null,
    author : teacher._id
  })

  try{
    await newAnuncio.save()
  }catch(err){
    return next(err)
  }

  if ( classroom ){
    classroom.announcements = [...classroom.announcements, newAnuncio._id]
    try{
      classroom.save()
    }catch(err){
      return next(err)
    }
  }

  try{
    teacher.announcements = [...teacher.announcements,newAnuncio]
    teacher.save()
  }catch(err){
    return next(err)
  }

  res.json(newAnuncio)
})

module.exports = router