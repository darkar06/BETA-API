const { app, server } = require("../index")
const supertest = require("supertest")
const Teacher = require("../models/Teacher")
const ClassRoom = require("../models/ClassRoom")
const { students, teachers, loginStudent, loginTeacher, ROUTES } = require("./helpers/helpers")
const Student = require("../models/Student")
const Score = require("../models/Score")
const Homework = require("../models/Homework")
const Annoucements = require("../models/Announcements")
const Announcements = require("../models/Announcements")
const { findById } = require("../models/Student")

const api = supertest(app)

jest.setTimeout(20000)

describe("Teacher test ", () => {
    beforeAll(async () => {

        await Student.deleteMany({})
        await Score.deleteMany({})
        await ClassRoom.deleteMany({})
        await Teacher.deleteMany({})
        await Homework.deleteMany({})
        await Announcements.deleteMany({})
        for (let teacher of teachers) {
            await api.post(ROUTES.TEACHER).send(teacher)
        }


        for (let i = 0; i < students.length; i++) {
            const student = students[i]
            await api.post("/api/student").send(student)
        }
    })

    test("the data base have 2 teachers", async () => {
        const req = await api.get(ROUTES.TEACHER)
            .expect("content-type", /application\/json/)
            .expect(200)

        expect(req.body).toHaveLength(teachers.length)
        const names = req.body.map(res => res.name)
        expect(names).toContain(teachers[0].name)
    })

    test("create A teacher with empty data", async () => {
        const emptyTeacher = {
            "name": "adrian",
            "email": "adrian@gmail.com",
            "password": "adrian",
            "asignatures": ["sociales", "naturales"]
        }


        const req = await api.post(ROUTES.TEACHER).send(emptyTeacher)
            .expect("content-type", /application\/json/)
            .expect(401)

        const allTeachers = await Teacher.find({})

        expect(allTeachers).toHaveLength(teachers.length)
    })

    test("try to create a teacher with the same email", async () => {
        const teacher = teachers[0]

        const req = await api.post(ROUTES.TEACHER).send(teacher)
            .expect(400)

        const allTeachers = await Teacher.find({})
        expect(allTeachers).toHaveLength(teachers.length)
    })

    test("create a teacher and login for after change him password", async () => {
        const teacher = {
            "name": "adrian",
            "email": "adrian@gmail.com",
            "password": "adrian",
            "asignatures": ["sociales", "naturales"],
            "curses": ["5to", "4to"]
        }


        const createTeacher = await api.post(ROUTES.TEACHER).send(teacher)
            .expect("content-type", /application\/json/)
            .expect(200)

        const allTeachers = await Teacher.find({})
        expect(allTeachers).toHaveLength((teachers.length + 1))
        const names = allTeachers.map(res => res.name)
        expect(names).toContain(teacher.name)

        const userForLogin1 = {
            "email": teacher.email,
            "password": teacher.password
        }

        const loginTeacher = await api.post(ROUTES.LOGIN).send(userForLogin1)
            .expect("content-type", /application\/json/)
            .expect(200)
        expect(loginTeacher.body).toHaveProperty("token")

        const token = `Bearer ${loginTeacher.body.token}`
        const changesPassword = {
            "password": teacher.password,
            "newPassword": "lacucaracha99"
        }

        const changePassword = await api.put(ROUTES.TEACHER).send(changesPassword).set({ "Authorization": token })
            .expect(200)

        const userForLogin2 = {
            "email": userForLogin1.email,
            "password": changesPassword.newPassword
        }

        const loginTeacher2 = await api.post(ROUTES.LOGIN).send(userForLogin2)
            .expect("content-type", /application\/json/)
            .expect(200)
    })
})

describe("teacher actions", () => {

    test("try to create a classroom with a undefined data", async () => {
        const { token } = await loginTeacher()

        const classroomInfo = {
            "asignature": teachers[0].asignatures[0],
            "curse": teachers[0].curses[0]
        }

        const createClassroom = await api.post(ROUTES.CLASSROOM).send(classroomInfo).set({ "authorization": token })
            .expect(401)
            .expect("content-type", /application\/json/)

        const allClassrooms = await ClassRoom.find({})

        expect(allClassrooms).toHaveLength(0)
    })

    test("try to create a classroom being a student", async () => {
        const { token } = await loginStudent()

        const classroomInfo = {
            "asignature": teachers[0].asignatures[0],
            "curse": teachers[0].curses[0],
            "section": "A"
        }

        const createClassroom = await api.post(ROUTES.CLASSROOM).send(classroomInfo).set({ "authorization": token })
            .expect(401)
            .expect("content-type", /application\/json/)

        const allClassrooms = await ClassRoom.find({})

        expect(allClassrooms).toHaveLength(0)
    })

    test("create a classroom and verify thath this add at all the setudent of the this curse and the this section", async () => {
        const { token, teacher } = await loginTeacher()

        const classroomInfo = {
            "asignature": teachers[0].asignatures[0],
            "curse": teachers[0].curses[0],
            "section": "A"
        }

        const createClassroom = await api.post(ROUTES.CLASSROOM).send(classroomInfo).set({ "authorization": token })
            .expect(200)
            .expect("content-type", /application\/json/)

        const classroomId = createClassroom.body.id

        const getClassroom = await api.get(ROUTES.CLASSROOM + "/" + classroomId)

        const curses = getClassroom.body.students.map(res => res.curse)
        expect(curses).not.toContain("2do")
        expect(getClassroom.body.teacher.name).toBe(teacher.name)

        const teacherUserNAme = getClassroom.body.teacher.userName

        const findTeacher = await Teacher.findOne({ userName: teacherUserNAme })
        expect(findTeacher.classrooms[0].toString()).toBe(classroomId.toString())
    })

    test("the students have a property scores", async () => {
        const { token, teacher } = await loginTeacher()

        const getClassroom = await api.get(ROUTES.CLASSROOM)
            .expect(200)
        const classroomId = getClassroom.body[0].id
        const classroom = await api.get(ROUTES.CLASSROOM + `/${classroomId}`)
            .expect(200)
        console.log(classroom.body)
        const student = classroom.body.students[0]

        const findStudent = await api.get(`/api/student/find/username/${student.userName}`).set({ "authorization": token })
            .expect(200)
        const studentFinded = findStudent.body
        console.log(studentFinded)

        expect(studentFinded.scores).toHaveLength(1)
    })

    test("change a score of the students ", async () => {
        const { token } = await loginTeacher()

        const student = await Student.findOne({ curse: "1ro" })

        const calificacionesForSend = {
            "id": student.scores[0],
            "p1": "100",
            "p2": "90",
            "p3": "95",
            "p4": "97"
        }

        calificaciones = {
            "p1": "100",
            "p2": "90",
            "p3": "95",
            "p4": "97"
        }

        const changeScore = await api.put(ROUTES.SCORE).send(calificacionesForSend).set({ "authorization": token })
            .expect(200)
        expect(changeScore.body).not.toHaveProperty("message")

        console.log(changeScore.body)

        expect(changeScore.body.periods).toEqual(calificaciones)
        const studentAgain = await api.get(ROUTES.STUDENT + `/find/username/${student.userName}`).set({ "authorization": token })
            .expect(200)
        console.log(studentAgain.body)
        expect(studentAgain.body).not.toHaveProperty("error")
        expect(studentAgain.body).not.toHaveProperty("message")
        expect(studentAgain.body.scores).toHaveLength(1)
        expect(studentAgain.body.scores[0].periods).toEqual(calificaciones)
    })

    test("try to create a homwework without all the data", async () => {
        const { token, teacher } = await loginTeacher()

        const getClassroom = await api.get(ROUTES.CLASSROOM)

        const homeworkInfo = {
            "title": "tema 1, la importancia del valor monetario",
            "content": " realizar una diapositiva acerca del tema "
        }

        await api.post(ROUTES.HOMEWORK).send(homeworkInfo).set({ "authorization": token })
            .expect(401)

        const getClassroomAgain = await api.get(ROUTES.CLASSROOM + `/${getClassroom.body[0].id}`)

        expect(getClassroomAgain.body.homeworks).toHaveLength(0)
    })

    test("try to create a homework with a undefined data", async () => {
        const { token } = await loginTeacher()

        const getClassroom = await api.get(ROUTES.CLASSROOM)

        const homeworkInfo = {
            "id": getClassroom.body[0].id,
            "title": "tema 1, la importancia del valor monetario"
        }

        const makeHomework = await api.post(ROUTES.HOMEWORK).send(homeworkInfo).set({ "authorization": token })
            .expect(401)

        const getHomeworks = await Homework.find({})

        expect(getHomeworks).toHaveLength(0)
    })

    test("try to create a homework being a student", async () => {
        const { token } = await loginStudent()

        const getClassroom = await api.get(ROUTES.CLASSROOM)

        const homeworkInfo = {
            "id": getClassroom.body[0].id,
            "title": "tema 1, la importancia del valor monetario",
            "content": " realizar una diapositiva acerca del tema "
        }

        const makeHomework = await api.post(ROUTES.HOMEWORK).send(homeworkInfo).set({ "authorization": token })
            .expect(401)

        const getHomeworks = await Homework.find({})

        expect(getHomeworks).toHaveLength(0)
    })

    test("try to make a announcements by the classroom with a undefined data", async () => {
        const { token } = await loginTeacher()

        const getClassroom = await api.get(ROUTES.CLASSROOM)

        const anuncioInfo = {
            "id": getClassroom.body[0].id,
            "title": "tema 1, la importancia del valor monetario"
        }

        const makeAnuncio = await api.post(ROUTES.ANUNCIOS).send(anuncioInfo).set({ "authorization": token })
            .expect(401)
        expect(makeAnuncio.body).toHaveProperty("error")

        const anuncios = await Annoucements.find({})
        expect(anuncios).toHaveLength(0)
        const classroom = await ClassRoom.findOne({})
        expect(classroom.announcements).toHaveLength(0)
    })

    test("try to make a announcements by the classroom with being a student", async () => {
        const { token } = await loginStudent()

        const getClassroom = await api.get(ROUTES.CLASSROOM)

        const anuncioInfo = {
            "id": getClassroom.body[0].id,
            "title": "la casa del horror",
            "content": " es un evento que realizaremos cada 2 años"
        }

        const makeAnuncio = await api.post(ROUTES.ANUNCIOS).send(anuncioInfo).set({ "authorization": token })
            .expect(401)
        expect(makeAnuncio.body).toHaveProperty("error")

        const anuncios = await Annoucements.find({})
        expect(anuncios).toHaveLength(0)
        const classroom = await ClassRoom.findOne({})
        expect(classroom.announcements).toHaveLength(0)
    })

    test("make a private announcements", async () => {
        const { token } = await loginTeacher()

        const getClassroom = await api.get(ROUTES.CLASSROOM)

        const anuncioInfo = {
            "id": getClassroom.body[0].id,
            "title": "la casa del horror",
            "content": " es un evento que realizaremos cada 2 años"
        }

        const makeAnuncio = await api.post(ROUTES.ANUNCIOS).send(anuncioInfo).set({ "authorization": token })
            .expect(200)
        expect(makeAnuncio.body).not.toHaveProperty("error")

        const anuncios = await Annoucements.find({})
        expect(anuncios).toHaveLength(1)
        const classroom = await ClassRoom.findOne({})
        expect(classroom.announcements).toHaveLength(1)

        const getPublicAnuncios = await api.get(ROUTES.ANUNCIOS)
            .expect(200)

        expect(getPublicAnuncios.body).toHaveLength(0)
    })

    test("make a public announcements", async () => {
        const { token } = await loginTeacher()

        const anuncioInfo = {
            "title": "la casa del horror",
            "content": " es un evento que realizaremos cada 2 años"
        }

        const makeAnuncio = await api.post(ROUTES.ANUNCIOS).send(anuncioInfo).set({ "authorization": token })
            .expect(200)
        expect(makeAnuncio.body).not.toHaveProperty("error")

        const anuncios = await Annoucements.find({})
        expect(anuncios).toHaveLength(2)
        const classroom = await ClassRoom.findOne({})
        expect(classroom.announcements).toHaveLength(1)

        const getPublicAnuncios = await api.get(ROUTES.ANUNCIOS)
            .expect(200)

        expect(getPublicAnuncios.body).toHaveLength(1)
    })

    test("try to delete a announcements without id", async () => {
        const { token, teacher } = await loginTeacher()

        const classrooms = await api.get(ROUTES.CLASSROOM)
            .expect(200)

        const idDelClassroom = classrooms.body[0].id

        const deleteAnuncio = await api.delete(ROUTES.ANUNCIOS).set({ "authorization": token })
            .expect(400)
        expect(deleteAnuncio.body).not.toHaveProperty("message")
        expect(deleteAnuncio.body).toHaveProperty("error")

        const classroom = await api.get(ROUTES.CLASSROOM + `/${idDelClassroom}`)
            .expect(200)
        expect(classroom.body.announcements).toHaveLength(1)

        const getUserName = await Teacher.findOne({ name: teacher.name })
        expect(getUserName).not.toBe(null)
        expect(getUserName).toHaveProperty("userName")

        const getTeacher = await api.get(ROUTES.TEACHER + `/find/username/${getUserName.userName}`).set({ "authorization": token })
            .expect(200)
        expect(getTeacher.body).not.toHaveProperty("error")
        expect(getTeacher.body.announcements).toHaveLength(2)
    })

    test("try to delete a announcements being a student", async () => {
        const { token } = await loginStudent()
        const { teacher, token: teacherToken } = await loginTeacher()

        const classrooms = await api.get(ROUTES.CLASSROOM)
            .expect(200)

        const idDelClassroom = classrooms.body[0].id
        const idDelAnuncio = { "id": classrooms.body[0].announcements[0] }

        const deleteAnuncio = await api.delete(ROUTES.ANUNCIOS).send(idDelAnuncio).set({ "authorization": token })
            .expect(401)
        expect(deleteAnuncio.body).not.toHaveProperty("message")
        expect(deleteAnuncio.body).toHaveProperty("error")

        const classroom = await api.get(ROUTES.CLASSROOM + `/${idDelClassroom}`)
            .expect(200)
        expect(classroom.body.announcements).toHaveLength(1)

        const getUserName = await Teacher.findOne({ name: teacher.name })
        expect(getUserName).not.toBe(null)
        expect(getUserName).toHaveProperty("userName")

        const getTeacher = await api.get(ROUTES.TEACHER + `/find/username/${getUserName.userName}`).set({ "authorization": teacherToken })
            .expect(200)
        expect(getTeacher.body).not.toHaveProperty("error")
        expect(getTeacher.body.announcements).toHaveLength(2)
    })

    test("delete a private announcements", async () => {
        const { token, teacher } = await loginTeacher()

        const classrooms = await api.get(ROUTES.CLASSROOM)
            .expect(200)

        const idDelAnuncio = { "id": classrooms.body[0].announcements[0] }

        const deleteAnuncio = await api.delete(ROUTES.ANUNCIOS).send(idDelAnuncio).set({ "authorization": token })
            .expect(200)
        expect(deleteAnuncio.body).not.toHaveProperty("error")
        expect(deleteAnuncio.body).toHaveProperty("message")

        const getUserName = await Teacher.findOne({ name: teacher.name })
        expect(getUserName).not.toBe(null)
        expect(getUserName).toHaveProperty("userName")

        const getTeacher = await api.get(ROUTES.TEACHER + `/find/username/${getUserName.userName}`).set({ "authorization": token })
            .expect(200)
        expect(getTeacher.body).not.toHaveProperty("error")
        expect(getTeacher.body.announcements).toHaveLength(1)
        const getClassroomAgain = await api.get(ROUTES.CLASSROOM + `/${classrooms.body[0].id}`)
        expect(getClassroomAgain.body.announcements).toHaveLength(0)
    })

    test("make a homework ", async () => {
        const { token, teacher } = await loginTeacher()

        const getClassroom = await api.get(ROUTES.CLASSROOM)

        const homeworkInfo = {
            "id": getClassroom.body[0].id,
            "title": "tema 1, la importancia del valor monetario",
            "content": " realizar una diapositiva acerca del tema "
        }

        const makeHomework = await api.post(ROUTES.HOMEWORK).send(homeworkInfo).set({ "authorization": token })
            .expect(200)

        const getClassroomAgain = await api.get(ROUTES.CLASSROOM + `/${getClassroom.body[0].id}`)

        expect(getClassroomAgain.body.homeworks[0].title).toBe(homeworkInfo.title)
    })

    test("try to delete a homework without id", async () => {
        const { token } = await loginTeacher()

        const getClassroom = await api.get(ROUTES.CLASSROOM)

        const deleteHomework = await api.delete(ROUTES.HOMEWORK).set({ "authorization": token })
            .expect(400)

        const getClassroomAgain = await api.get(ROUTES.CLASSROOM + `/${getClassroom.body[0].id}`)

        expect(getClassroomAgain.body.homeworks).toHaveLength(1)
    })

    test("try to delete a homework being a student", async () => {
        const { token } = await loginStudent()

        const getClassroom = await api.get(ROUTES.CLASSROOM)

        const homeworkInfo = { "id": getClassroom.body[0].homeworks[0] }

        const deleteHomework = await api.delete(ROUTES.HOMEWORK).set({ "authorization": token })
            .expect(401)

        const getClassroomAgain = await api.get(ROUTES.CLASSROOM + `/${getClassroom.body[0].id}`)

        expect(getClassroomAgain.body.homeworks).toHaveLength(1)
    })

    test("delete a homework ", async () => {
        const { token } = await loginTeacher()

        const getClassroom = await api.get(ROUTES.CLASSROOM)

        const homeworkInfo = {
            "id": getClassroom.body[0].homeworks[0]
        }

        const deleteHomework = await api.delete(ROUTES.HOMEWORK).send(homeworkInfo).set({ "authorization": token })
            .expect(200)

        const getClassroomAgain = await api.get(ROUTES.CLASSROOM + `/${getClassroom.body[0].id}`)

        expect(getClassroomAgain.body.homeworks).toHaveLength(0)
    })

    test("try to delete a classroom without id", async () => {
        const { token, teacher } = await loginTeacher()

        // aqui creamos una tarea para ver si despues de
        //que se elimine el classroom la tarea persiste o 
        //se elimina tambien
        const getClassroom1 = await api.get(ROUTES.CLASSROOM)
        const homeworkInfo = {
            "id": getClassroom1.body[0].id,
            "title": "tema 1, la importancia del valor monetario",
            "content": " realizar una diapositiva acerca del tema "
        }
        const makeHomework = await api.post(ROUTES.HOMEWORK).send(homeworkInfo).set({ "authorization": token })
            .expect(200)

        const allClassrooms = await api.get(ROUTES.CLASSROOM)
            .expect(200)
        await api.delete(ROUTES.CLASSROOM).set({ "authorization": token })
            .expect(400)

        const getClassroom = await api.get(ROUTES.CLASSROOM)
        expect(getClassroom.body).toHaveLength(1)

        const randomStudentId = allClassrooms.body[0].students[0]
        const student = await Student.findById(randomStudentId)
        expect(student.scores).toHaveLength(1)
        expect(student.classRooms).toHaveLength(1)

        const getTeacher = await Teacher.findOne({ name: teacher.name })
        expect(getTeacher).toHaveProperty("classrooms")
        expect(getTeacher.classrooms).toHaveLength(1)
    })

    test("try to delete a classroom being a student", async () => {
        const { token: studentTokem } = await loginStudent()
        const { token, teacher } = await loginTeacher()

        // aqui creamos una tarea para ver si despues de
        //que se elimine el classroom la tarea persiste o 
        //se elimina tambien
        const getClassroom1 = await api.get(ROUTES.CLASSROOM)
        const homeworkInfo = {
            "id": getClassroom1.body[0].id,
            "title": "tema 1, la importancia del valor monetario",
            "content": " realizar una diapositiva acerca del tema "
        }
        const makeHomework = await api.post(ROUTES.HOMEWORK).send(homeworkInfo).set({ "authorization": token })
            .expect(200)

        const allClassrooms = await api.get(ROUTES.CLASSROOM)
            .expect(200)
        const classroomId = { "id": allClassrooms.body[0].id }
        await api.delete(ROUTES.CLASSROOM).send(classroomId).set({ "authorization": studentTokem })
            .expect(401)

        const getClassroom = await api.get(ROUTES.CLASSROOM)
        expect(getClassroom.body).toHaveLength(1)

        const randomStudentId = allClassrooms.body[0].students[0]
        const student = await Student.findById(randomStudentId)
        expect(student.scores).toHaveLength(1)
        expect(student.classRooms).toHaveLength(1)

        const getTeacher = await Teacher.findOne({ name: teacher.name })
        expect(getTeacher).toHaveProperty("classrooms")
        expect(getTeacher.classrooms).toHaveLength(1)
    })

    test("delete a classroom", async () => {
        const { token, teacher } = await loginTeacher()

        // aqui creamos una tarea para ver si despues de
        //que se elimine el classroom la tarea persiste o 
        //se elimina tambien
        const getClassroom1 = await api.get(ROUTES.CLASSROOM)
        const homeworkInfo = {
            "id": getClassroom1.body[0].id,
            "title": "tema 1, la importancia del valor monetario",
            "content": " realizar una diapositiva acerca del tema "
        }
        const makeHomework = await api.post(ROUTES.HOMEWORK).send(homeworkInfo).set({ "authorization": token })
            .expect(200)



        const allClassrooms = await api.get(ROUTES.CLASSROOM)
            .expect(200)
        const classroomId = { "id": allClassrooms.body[0].id }
        await api.delete(ROUTES.CLASSROOM).send(classroomId).set({ "authorization": token })
            .expect(200)

        const getClassroom = await api.get(ROUTES.CLASSROOM)
        expect(getClassroom.body).toHaveLength(0)

        const randomStudentId = allClassrooms.body[0].students[0]
        const student = await Student.findById(randomStudentId)
        expect(student.scores).toHaveLength(0)
        expect(student.classRooms).toHaveLength(0)

        const getTeacher = await Teacher.findOne({ name: teacher.name })
        expect(getTeacher).toHaveProperty("classrooms")
        expect(getTeacher.classrooms).toHaveLength(0)
    })

    afterAll(() => {
        server.close()
    })
})