const supertest = require("supertest")
const { app, server } = require("../index.js")
const Student = require("../models/Student")
const { students } = require("./helpers/helpers")
const Score = require("../models/Score")

const api = supertest(app)
const tamaño = (students.length - 1)


describe("students test", () => {
  jest.setTimeout(30000)

  beforeAll(async () => {
    await Student.deleteMany({})
    await Score.deleteMany({})

    for (let i = 0; i < tamaño; i++) {
      const student = students[i]
      await api.post("/api/student").send(student)
    }
  })

  test("the student database have some students", async () => {
    const students = await Student.find()
    expect(students).toHaveLength(tamaño)
  })

  test("create a student with a undefined data", async () => {
    const studentWithOutAllTheData = {
      "name": "paca",
      "password": "paca",
      "email": "paca@gmail.com",
      "section": "A"
    }

    await api.post("/api/student").send(studentWithOutAllTheData)
      .expect("Content-Type", /application\/json/)
      .expect(401)

    const students = await Student.find()

    expect(students).toHaveLength(tamaño)
  })

  test("try to create a student that be in the data base", async () => {
    const student = students[0]
    const req = await api.post("/api/student").send(student)
      .expect("content-type", /application\/json/)
      .expect(400)

    const allStudents = await Student.find({})

    expect(allStudents).toHaveLength(tamaño)
  })

  test("create a student with all the data", async () => {
    const student = students[students.length - 1]

    const req = await api.post("/api/student").send(student)
      .expect("Content-Type", /application\/json/)
      .expect(200)
    expect(req.body.name).toBe(student.name)

    const user = await Student.findOne({ name: student.name })
    expect(user.name).toBe(student.name)

    const allStudent = await Student.find({})

    expect(allStudent).toContainEqual(user)
    expect(allStudent).toHaveLength(students.length)
  })

  test("login a student and update him password", async () => {
    const student = students[students.length - 1]
    const user = {
      "email": student.email,
      "password": student.password
    }

    console.log(user)

    const req = await api.post("/api/login").send(user)
      .expect(200)
      .expect("Content-Type", /application\/json/)
    expect(req.body.name).toBe(student.name)

    const { token } = req.body

    const passwords = {
      password: user.password,
      newPassword: "1234567890qwertyuiop"
    }

    const update = await api.put("/api/student").send(passwords).set({ "Authorization": `Bearer ${token}` })
      .expect(200)
      .expect("Content-Type", /application\/json/)
    expect(update.body.message).not.toBeUndefined()

    const after = await api.post("/api/login").send({ email: user.email, password: passwords.newPassword })
      .expect(200)
      .expect("Content-Type", /application\/json/)
    expect(after.body.name).toBe(student.name)


  })

  afterAll(async () => {
    await Student.deleteMany({})
    await Score.deleteMany({})
    server.close()
  })

})