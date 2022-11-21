const router = require("express").Router()
const decodeToken = require("../utils/decodeToken")
const Student = require("../models/Student")
const Score = require("../models/Score")

router.put("/", async (req, res, next) => {
  console.log(req.body)
  const { id, p1, p2, p3, p4 } = req.body
  const { authorization } = req.headers
  const token = decodeToken(authorization)

  if (!token || !token.id) return next({ name: "INVALID_TOKEN" })
  if (token.typeUser === "student") return next({ name: "UNAUTURIZED" })

  let score = null

  try {
    score = await Score.findById(id)
  } catch (err) {
    next(err)
  }

  if (score == null) return next({ name: "INVALID_ID" })

  score.periods.p1 = p1
  score.periods.p2 = p2
  score.periods.p3 = p3
  score.periods.p4 = p4

  try {
    await score.save()
  } catch (err) {
    return next(err)
  }

  console.log(score)

  res.json(score)
})

module.exports = router