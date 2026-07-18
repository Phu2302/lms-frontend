import api from '../axios';

export const getAllCoursesAPI = () => {
  return api.get('/courses');
};
