import api from '../axios';

// Lấy danh sách thông báo từ Admin (Phòng Đào Tạo)
export const getAdminAnnouncementsAPI = () => {
  return api.get('/support/announcements');
};

// Lấy danh sách phiếu yêu cầu của giảng viên đang đăng nhập
export const getTeacherTicketsAPI = () => {
  return api.get('/support-tickets/my');
};

// Lấy danh sách loại yêu cầu hợp lệ từ Backend
export const getTicketTypesAPI = () => {
  return api.get('/support-tickets/ticket-types');
};

// Tạo một phiếu yêu cầu mới gửi Admin (POST /support-tickets)
export const createTeacherTicketAPI = (data) => {
  return api.post('/support-tickets', {
    ticket_type: data.ticket_type || data.type,
    content: data.content
  });
};
