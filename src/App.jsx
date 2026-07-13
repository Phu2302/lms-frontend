import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage/HomePage';
import RolePage from './pages/RolePage/RolePage';
import LoginPage from './pages/LoginPage/LoginPage';
import LMS from './pages/LMS/LMS';
import CourseDetail from './pages/LMS/CourseDetail/CourseDetail';

import QuizPage from './pages/LMS/CourseDetail/QuizPage/QuizPage';
import AssignmentDetail from './pages/LMS/CourseDetail/AssignmentDetail/AssignmentDetail'; 
import StudentInfo from './pages/StudentInfo/StudentInfo';
import CourseRegistration from './pages/CourseRegistration/CourseRegistration';

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
        <Route path="/course-registration" element={<CourseRegistration />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;