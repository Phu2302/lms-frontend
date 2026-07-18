import api from '../../axios';

export const getMySchedulesAPI = () => {
  return api.get('/schedules/my');
};
