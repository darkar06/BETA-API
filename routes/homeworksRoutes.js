const router = require("express").Router()
const Homework = require("../models/Homework")
const decodeToken = require("../utils/decodeToken")
const ClassRoom = require("../models/ClassRoom")
const {unlink} = require("fs")
//multer config 

const multer = require("multer")
const path = require("path")
const generateID = require("../utils/generateID")

const storage = multer.diskStorage({
  filename: ( req, file, cb )=>{
    cb(null, new Date().getTime() + generateID(10) + path.extname(file.originalname))
  },
  destination:  path.join(__dirname, "../upload")
  
})

const upload = multer({
  storage,
  dest: path.join( __dirname , "../upload"),
  limits: {
    fileSize: 1000000
  },
  fileFilter: (req,file,cb)=>{
    const fileTypes = /jpg|jpeg|pdf|docx|png/
    const mimetype = fileTypes.test(file.mimetype)
    const extName = fileTypes.test(path.extname(file.originalname))
    
    if (mimetype && extName) return cb(null, true)
    cb({
      name: "INVALID_DATA",
      content: "el tipo de archivo no es valido"
    })
  }
}).single("myfile")

//routes

router.get("/",async(req,res)=>{
  const homeworks = await Homework.find({})
  res.json(homeworks)
})

router.post("/",upload,async( req, res, next ) => {
  const { id, title, content } = req.body
  const {file} = req
  //token validation
  const {authorization} = req.headers
  const token =  decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({name: "UNAUTURIZED"})

  const document = file ? file.filename : null

  if (!id || !title || !content) return next({name: "EMPTY_DATA"})

  let classroom  = null

  try{
    classroom = await ClassRoom.findById(id)
  }catch(err){
    return next(err)
  }

  if (!classroom) return next({name: "INVALID_ID"})

  const newHomeWork = new Homework({
    title,
    content,
    document,
    classroom: classroom._id
  })

  try{
    await newHomeWork.save()
  }catch(err){
    return next(err)
  }

  classroom.homeworks = [...classroom.homeworks, newHomeWork._id]

  try{
    await classroom.save()
  }catch(err){
    return next(err)
  }

  res.json(newHomeWork)


})

router.delete("/", async(req,res,next)=>{
  const {id} = req.body
  let document = null

  try{
    document = await Homework.findById(id)
  }catch(err){
    return next(err)
  }

  if (!document) return next({name: "INVALID_ID"})

  if(document.document){
    try{
      unlink(`upload/${document.document}`,()=> console.log("eliminado correctamente"))
    }catch(err){
      return next(err)
    }
  }

  try{
    await Homework.findByIdAndDelete(id)
  }catch(err){
    return next(err)
  }

  res.json({message: "tarea eliminada"})
})

module.exports = router