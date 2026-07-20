import api from '../../axios';

export const getMyQuizEntriesAPI = (quizId) => {
  return api.get('/quiz-entries/my', { params: { quiz_id: quizId } });
};

export const getAllQuizEntriesAPI = (quizId) => {
  return api.get('/quiz-entries', { params: { quiz_id: quizId } });
};

export const createQuizEntryAPI = (data) => {
  return api.post('/quiz-entries', data);
};

export const submitQuizEntryAPI = (id, responses) => {
  return api.post(`/quiz-entries/${id}/submit`, { responses });
};

export const gradeQuestionResponseAPI = (responseId, score) => {
  return api.post(`/quiz-entries/response/${responseId}/grade`, { score });
};

export const deleteQuizEntryAPI = (id) => {
  return api.delete(`/quiz-entries/${id}`);
};
