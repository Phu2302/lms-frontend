import api from '../../axios';

export const getSemestersAPI = () => {
  return api.get('/semesters');
};
