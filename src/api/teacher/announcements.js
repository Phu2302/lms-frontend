import api from '../axios';

export const getClassAnnouncementsAPI = (classId) => {
  return api.get(`/announcements?class_id=${classId}`);
};

export const createAnnouncementAPI = (data) => {
  return api.post('/announcements', data);
};

export const deleteAnnouncementAPI = (id) => {
  return api.delete(`/announcements/${id}`);
};
