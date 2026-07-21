import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage/HomePage';
import LoginPage from './pages/LoginPage/LoginPage';
import LMS from './pages/LMS/LMS';
import CourseDetail from './pages/LMS/CourseDetail/CourseDetail';
import QuizPage from './pages/LMS/CourseDetail/QuizPage/QuizPage';
import AssignmentDetail from './pages/LMS/CourseDetail/AssignmentDetail/AssignmentDetail';
import StudentInfo from './pages/StudentInfo/StudentInfo';
import Schedule from './pages/LMS/Schedule/Schedule';
import ForumPage from './pages/LMS/CourseDetail/ForumPage/ForumPage';
import ForumPostDetailPage from './pages/LMS/CourseDetail/ForumPostDetailPage/ForumPostDetailPage';
import CalendarPage from './pages/LMS/Schedule/CalendarPage';
import CourseRegistration from './pages/CourseRegistration/CourseRegistration';
import OnlineGrading from './pages/OnlineGrading/OnlineGrading';
import TeachingSupport from './pages/TeachingSupport/TeachingSupport';
import ProfilePage from './pages/ProfilePage/ProfilePage';

import AddQuiz from './pages/LMS/CourseDetail/AddQuiz/AddQuiz';
import EditQuiz from './pages/LMS/CourseDetail/EditQuiz/EditQuiz';
import AddMaterial from './pages/LMS/CourseDetail/AddMaterial/AddMaterial';
import AddForum from './pages/LMS/CourseDetail/AddForum/AddForum';

import { ToastProvider } from './components/Toast/ToastContext';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/lms" element={<LMS view="home" />} />
          <Route path="/lms/course" element={<LMS view="courses" />} />
          <Route path="/lms/course/:courseId" element={<CourseDetail />} />
          <Route path="/lms/assignment/:assignmentId" element={<AssignmentDetail />} />
          <Route path="/lms/quiz/:quizId" element={<QuizPage />} />
          <Route path="/lms/schedule" element={<Schedule />} />
          <Route path="/student-info" element={<StudentInfo />} />
          <Route path="/lms/course/:courseId/forum/:forumId" element={<ForumPage />} />
          <Route path="/lms/course/:courseId/forum-post/:postId" element={<ForumPostDetailPage />} />
          <Route path="/lms/calendar" element={<CalendarPage />} />
          <Route path="/course-registration" element={<CourseRegistration />} />
          <Route path="/online-grading" element={<OnlineGrading />} />
          <Route path="/teaching-support" element={<TeachingSupport />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Dedicated pages for adding/editing Quiz, Material, Forum */}
          <Route path="/lms/course/:courseId/chapter/:chapterId/add-quiz" element={<AddQuiz />} />
          <Route path="/lms/course/:courseId/quiz/:quizId/edit" element={<EditQuiz />} />
          <Route path="/lms/course/:courseId/chapter/:chapterId/add-material" element={<AddMaterial />} />
          <Route path="/lms/course/:courseId/chapter/:chapterId/add-forum" element={<AddForum />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);
}

export default App;
