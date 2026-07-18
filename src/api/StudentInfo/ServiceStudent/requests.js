import api from '../../axios';

export const getUserRequestsAPI = () => {
  return api.get('/users/requests');
};

export const createStudentRequestAPI = (data) => {
  return api.post('/users/requests', data);
};
