import api from '../../axios';

export const createChapterAPI = (data) => {
  return api.post('/chapters', data);
};

export const deleteChapterAPI = (id) => {
  return api.delete(`/chapters/${id}`);
};
