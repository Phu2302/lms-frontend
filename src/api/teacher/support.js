import api from '../axios';

// Lấy danh sách thông báo từ Admin (Phòng Đào Tạo)
export const getAdminAnnouncementsAPI = () => {
  return api.get('/support/announcements');
};

// Lấy danh sách phiếu yêu cầu của giảng viên
export const getTeacherTicketsAPI = () => {
  return api.get('/support/tickets');
};

// Tạo một phiếu yêu cầu mới gửi Admin
export const createTeacherTicketAPI = (data) => {
  return api.post('/support/tickets', data);
};
