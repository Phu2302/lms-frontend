import api from '../axios';

export const getAllClassesAPI = () => {
  return api.get('/classes');
};

export const enrollClassAPI = (classId) => {
  return api.post('/classes/enroll', { class_id: classId });
};

export const unenrollClassAPI = (classId) => {
  return api.post('/classes/unenroll', { class_id: classId });
};
