import api from '../../axios';

export const createQuizAPI = (data) => {
  return api.post('/quizzes', data);
};

export const deleteQuizAPI = (id) => {
  return api.delete(`/quizzes/${id}`);
};

export const getQuizQuestionsAPI = (id) => {
  return api.get(`/quizzes/${id}/questions`);
};
