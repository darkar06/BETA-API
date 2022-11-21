const { app } = require("../../index")
const supertest = require("supertest")

const api = supertest(app)

const ROUTES = {
    TEACHER: "/api/teacher",
    LOGIN: "/api/login",
    CLASSROOM: "/api/classroom",
    HOMEWORK: "/api/homework",
    SCORE: "/api/score",
    STUDENT: "/api/student",
    ANUNCIOS: "/api/announcements"
}


const students = [
    {
        "name": "paca",
        "password": "1234",
        "email": "paca@gmail.com",
        "curse": "1ro",
        "section": "A"
    }, {
        "name": "juan",
        "password": "2020",
        "email": "damelio@gmail.com",
        "curse": "2do",
        "section": "A"
    }, {
        "name": "maria",
        "password": "2312",
        "email": "mari@gmail.com",
        "curse": "1ro",
        "section": "A"
    }, {
        "name": "juana",
        "password": "2312",
        "email": "juana@gmail.com",
        "curse": "1ro",
        "section": "A"
    }, {
        "name": "vanesa",
        "password": "2312",
        "email": "vanesa@gmail.com",
        "curse": "2do",
        "section": "A"
    }, {
        "name": "sofia",
        "password": "2312",
        "email": "sofi@gmail.com",
        "curse": "2do",
        "section": "A"
    }, {
        "name": "miranda",
        "password": "2312",
        "email": "miranda@gmail.com",
        "curse": "1ro",
        "section": "A"
    }
]

const teachers = [
    {
        "name": "ramses",
        "password": "ramses",
        "email": "ramses@gmail.com",
        "asignatures": ["lengua española", "sociales"],
        "curses": ["1ro", "2do"]
    }, {
        "name": "juan",
        "password": "juan",
        "email": "juan@gmail.com",
        "asignatures": ["matematicas", "sociales"],
        "curses": ["2"]
    }
]

const loginTeacher = async () => {
    const teacher = teachers[0]
    const teacherForLogin = {
        "email": teacher.email,
        "password": teacher.password
    }

    const login = await api.post(ROUTES.LOGIN).send(teacherForLogin)
        .expect(200)
        .expect("content-type", /application\/json/)
    expect(login.body).toHaveProperty("token")

    const token = "Bearer " + login.body.token

    return { token, teacher }
}

const loginStudent = async () => {
    const student = students[0]
    const studentForLogin = {
        "email": student.email,
        "password": student.password
    }

    const login = await api.post(ROUTES.LOGIN).send(studentForLogin)
        .expect(200)
        .expect("content-type", /application\/json/)
    expect(login.body).toHaveProperty("token")

    const token = "Bearer " + login.body.token

    return { token, student }
}



module.exports = {
    students,
    teachers,
    loginTeacher,
    loginStudent,
    ROUTES
}