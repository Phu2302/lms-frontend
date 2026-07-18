import api from '../../axios';

export const getStudentQuestionResponsesAPI = (quizEntryId) => {
  return api.get('/student-question-responses', { params: { entry_id: quizEntryId } });
};

export const submitBulkResponsesAPI = (data) => {
  return api.post('/student-question-responses/bulk', data);
};
