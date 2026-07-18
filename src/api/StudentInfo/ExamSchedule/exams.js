import api from '../../axios';

export const getUserExamsAPI = (semester) => {
  return api.get('/users/exams', { params: { semester } });
};
