import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage/HomePage';
import RolePage from './pages/RolePage/RolePage';
import LoginPage from './pages/LoginPage/LoginPage';
import LMS from './pages/LMS/LMS';
import CourseDetail from './pages/CourseDetail/CourseDetail';

import QuizPage from './pages/CourseDetail/QuizPage/QuizPage';
import AssignmentDetail from './pages/CourseDetail/AssignmentDetail/AssignmentDetail'; 
import StudentInfo from './pages/StudentInfo/StudentInfo';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/select-role" element={<RolePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lms" element={<LMS view="home" />} />
        <Route path="/lms/course" element={<LMS view="courses" />} />
        <Route path="/lms/course/:courseId" element={<CourseDetail />} /> 

        <Route path="/lms/assignment/:assignmentId" element={<AssignmentDetail />} /> 
        <Route path="/lms/quiz/:quizId" element={<QuizPage />} />
        <Route path="/student-info" element={<StudentInfo />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;