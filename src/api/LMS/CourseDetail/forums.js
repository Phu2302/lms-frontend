import api from '../../axios';

export const createForumAPI = (data) => {
  return api.post('/forums', data);
};

export const deleteForumAPI = (id) => {
  return api.delete(`/forums/${id}`);
};

export const getForumAPI = (id) => {
  return api.get(`/forums/${id}`);
};
