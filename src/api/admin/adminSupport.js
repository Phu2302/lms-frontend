import api from '../axios';

// Lấy tất cả phiếu yêu cầu từ Giảng viên gửi tới P.ĐT (role 3)
export const getAllTicketsAPI = (status) => {
  const url = status ? `/support-tickets?status=${status}` : '/support-tickets';
  return api.get(url);
};

// Admin cập nhật trạng thái / phản hồi phiếu yêu cầu (role 3)
export const updateTicketStatusAPI = (ticketId, data) => {
  return api.put(`/support-tickets/${ticketId}/status`, data);
};

// Lấy danh sách thông báo hệ thống P.ĐT
export const getSystemAnnouncementsAPI = () => {
  return api.get('/system-announcements');
};

// Admin đăng thông báo hệ thống mới (role 3)
export const createSystemAnnouncementAPI = (data) => {
  return api.post('/system-announcements', data);
};

// Admin xóa thông báo hệ thống (role 3)
export const deleteSystemAnnouncementAPI = (id) => {
  return api.delete(`/system-announcements/${id}`);
};
