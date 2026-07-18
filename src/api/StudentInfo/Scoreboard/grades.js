import api from '../../axios';

export const getStudentClassGradeAPI = (classId) => {
  return api.get(`/grades/${classId}/view`);
};
