import api from '../axios';

// Lấy danh sách sinh viên cùng điểm chính thức (đã chốt) của lớp
export const getOfficialClassGradesAPI = (classId) => {
  return api.get(`/official-grades/${classId}`);
};

// Lưu/Chốt điểm chính thức cho lớp
export const saveOfficialBatchGradesAPI = (classId, data) => {
  return api.put(`/official-grades/${classId}`, data);
};
