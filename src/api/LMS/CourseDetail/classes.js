import api from '../../axios';

export const getClassDetailAPI = (classId) => {
  return api.get(`/classes/view/${classId}`);
};
