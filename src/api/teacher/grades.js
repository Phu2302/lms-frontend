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
