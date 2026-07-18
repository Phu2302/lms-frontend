import api from '../../axios';

export const getForumPostsByForumIdAPI = (forumId) => {
  return api.get(`/forum-posts/forum/${forumId}`);
};

export const createForumPostAPI = (data) => {
  return api.post('/forum-posts', data);
};

export const getForumPostDetailsAPI = (id) => {
  return api.get(`/forum-posts/${id}/details`);
};

export const createForumPostResponseAPI = (postId, data) => {
  return api.post(`/forum-posts/${postId}/responses`, data);
};

export const deleteForumPostResponseAPI = (postId, responseId, responseDate) => {
  return api.delete(`/forum-posts/${postId}/responses/${responseId}`, { data: { response_date: responseDate } });
};

export const deleteForumPostAPI = (id) => {
  return api.delete(`/forum-posts/${id}`);
};
