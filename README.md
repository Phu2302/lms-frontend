# LMS/TNTT Frontend

Frontend cho hệ thống LMS/TNTT.

## 📂 Cấu trúc dự án tạm thời 

```text
lms-frontend
├── README.md
├── index.html
├── package-lock.json
├── package.json
├── src
│   ├── App.jsx
│   ├── api
│   │   ├── CourseRegistration
│   │   │   ├── classes.js
│   │   │   └── courses.js
│   │   ├── LMS
│   │   │   ├── CourseDetail
│   │   │   │   ├── chapters.js
│   │   │   │   ├── classes.js
│   │   │   │   ├── forumPosts.js
│   │   │   │   ├── forums.js
│   │   │   │   ├── materials.js
│   │   │   │   ├── quizEntries.js
│   │   │   │   ├── quizzes.js
│   │   │   │   └── studentQuestionResponses.js
│   │   │   └── Schedule
│   │   │       ├── schedules.js
│   │   │       └── semesters.js
│   │   ├── StudentInfo
│   │   │   ├── ExamSchedule
│   │   │   │   └── exams.js
│   │   │   ├── Profile
│   │   │   │   └── users.js
│   │   │   ├── Scoreboard
│   │   │   │   └── grades.js
│   │   │   └── ServiceStudent
│   │   │       └── requests.js
│   │   ├── auth
│   │   │   └── auth.js
│   │   ├── axios.js
│   │   └── teacher
│   │       ├── announcements.js
│   │       ├── grades.js
│   │       ├── onlineGrades.js
│   │       └── support.js
│   ├── components
│   │   └── Header
│   │       └── Header.jsx
│   ├── index.css
│   ├── main.jsx
│   └── pages
│       ├── CourseRegistration
│       │   ├── CourseRegistration.css
│       │   └── CourseRegistration.jsx
│       ├── HomePage
│       │   ├── HomePage.css
│       │   └── HomePage.jsx
│       ├── LMS
│       │   ├── CourseDetail
│       │   │   ├── AddForum
│       │   │   │   ├── AddForum.css
│       │   │   │   └── AddForum.jsx
│       │   │   ├── AddMaterial
│       │   │   │   ├── AddMaterial.css
│       │   │   │   └── AddMaterial.jsx
│       │   │   ├── AddQuiz
│       │   │   │   ├── AddQuiz.css
│       │   │   │   └── AddQuiz.jsx
│       │   │   ├── AssignmentDetail
│       │   │   │   ├── AssignmentDetail.css
│       │   │   │   └── AssignmentDetail.jsx
│       │   │   ├── CourseDetail.css
│       │   │   ├── CourseDetail.jsx
│       │   │   ├── EditQuiz
│       │   │   │   └── EditQuiz.jsx
│       │   │   ├── ForumPage
│       │   │   │   ├── ForumPage.css
│       │   │   │   └── ForumPage.jsx
│       │   │   ├── ForumPostDetailPage
│       │   │   │   ├── ForumPostDetailPage.css
│       │   │   │   └── ForumPostDetailPage.jsx
│       │   │   └── QuizPage
│       │   │       ├── QuizPage.css
│       │   │       └── QuizPage.jsx
│       │   ├── LMS.css
│       │   ├── LMS.jsx
│       │   └── Schedule
│       │       ├── CalendarPage.css
│       │       ├── CalendarPage.jsx
│       │       ├── Schedule.css
│       │       └── Schedule.jsx
│       ├── LoginPage
│       │   ├── LoginPage.css
│       │   └── LoginPage.jsx
│       ├── OnlineGrading
│       │   ├── OnlineGrading.css
│       │   └── OnlineGrading.jsx
│       ├── StudentInfo
│       │   ├── ExamSchedule
│       │   │   ├── ExamSchedule.css
│       │   │   └── ExamSchedule.jsx
│       │   ├── Scoreboard
│       │   │   ├── Scoreboard.css
│       │   │   └── Scoreboard.jsx
│       │   ├── ServiceStudent
│       │   │   ├── ServiceStudent.css
│       │   │   └── ServiceStudent.jsx
│       │   ├── StudentInfo.css
│       │   ├── StudentInfo.jsx
│       │   └── Timetable
│       │       ├── Timetable.css
│       │       └── Timetable.jsx
│       └── TeachingSupport
│           ├── TeachingSupport.css
│           └── TeachingSupport.jsx
└── vite.config.js
```

## Cài đặt và Chạy
```bash
# Cài đặt thư viện
npm install

# Chạy dự án local
npm run dev
```
