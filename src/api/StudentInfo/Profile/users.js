import api from '../../axios';

export const getUserProfileAPI = () => {
  return api.get('/users/profile');
};

export const getUserClassesAPI = () => {
  return api.get('/users/classes');
};

export const getUserDeadlinesAPI = () => {
  return api.get('/users/deadlines');
};
