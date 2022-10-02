const router = require("express").Router()
const decodeToken = require("../utils/decodeToken")
const Student = require("../models/Student")
const Score = require("../models/Score")

router.put("/",async( req, res, next)=>{
  const { id, p1, p2, p3, p4 } = req.body
  const { authorization } = req.headers
  const token =  decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({name: "UNAUTURIZED"})

  let score = null 

  try{
    score = await Score.findById(id) 
  }catch( err ){
    next(err)
  }

  if (score == null ) return next({ name: "INVALID_ID" })

  score.p1 = p1
  score.p2 = p2
  score.p3 = p3
  score.p4 = p4

  try{
    const await score.save()
  }catch(err){
    console.log(err)
  }
})

module.exports = router