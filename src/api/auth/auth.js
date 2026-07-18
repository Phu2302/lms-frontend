import api from '../axios';

export const loginAPI = (user_name, password) => {
  return api.post('/auth/login', { user_name, password });
};

export const logoutAPI = () => {
  return api.post('/auth/logout');
};
