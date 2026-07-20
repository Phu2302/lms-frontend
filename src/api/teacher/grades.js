import api from '../axios';

export const getClassGradesAPI = (classId) => {
  return api.get(`/grades/class/${classId}/all`);
};

export const saveBatchGradesAPI = (data) => {
  return api.post('/grades/batch', data);
};

export const getStudentGradeAPI = (classId, studentId) => {
  return api.get(`/grades/${classId}/view${studentId ? `?studentId=${studentId}` : ''}`);
};

export const publishGradesAPI = (classId, isPublished) => {
  return api.put(`/classes/${classId}/publish-grades`, { is_grades_published: isPublished });
};
