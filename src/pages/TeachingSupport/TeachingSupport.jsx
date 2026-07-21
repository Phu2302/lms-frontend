import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import { getAdminAnnouncementsAPI, getTeacherTicketsAPI, createTeacherTicketAPI } from '../../api/teacher/support';
import './TeachingSupport.css';

function TeachingSupport() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'announcements';
  const [activeTab, setActiveTab] = useState(initialTab); // announcements, tickets, resources

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName }, { replace: true });
  };

  // States
  const [announcements, setAnnouncements] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // States for new ticket modal
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketType, setTicketType] = useState('Mở khóa điểm');
  const [ticketContent, setTicketContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activeTab === 'announcements') {
      fetchAnnouncements();
    } else if (activeTab === 'tickets') {
      fetchTickets();
    }
  }, [activeTab]);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const res = await getAdminAnnouncementsAPI();
      setAnnouncements(res.data || []);
    } catch (err) {
      console.warn('Lỗi gọi API thông báo:', err);
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const res = await getTeacherTicketsAPI();
      setTickets(res.data || []);
    } catch (err) {
      console.warn('Lỗi gọi API phiếu yêu cầu:', err);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!ticketContent.trim()) {
      showToast('Vui lòng nhập nội dung chi tiết.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createTeacherTicketAPI({
        type: ticketType,
        content: ticketContent
      });
      showToast('Đã gửi yêu cầu thành công!', 'success');
      setShowNewTicketModal(false);
      setTicketContent('');
      fetchTickets();
    } catch (err) {
      console.warn('Lỗi tạo phiếu yêu cầu:', err);
      showToast('Hệ thống Backend chưa sẵn sàng (Chưa có API). Vui lòng cấu hình API POST /support/tickets.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="teaching-support-container">
      <Header view="teacher" />

      <div className="teaching-support-body">
        <button className="back-btn" onClick={() => navigate('/')}>
          ⬅ Quay lại Trang chủ
        </button>

        <div className="support-header">
          <h1>Hỗ trợ & Quản lý giảng dạy</h1>
          <p>Cổng giao tiếp giữa Giảng viên và Phòng Đào Tạo</p>
        </div>

        <div className="support-layout">
          {/* Sidebar Menu */}
          <div className="support-sidebar">
            <button 
              className={`sidebar-item ${activeTab === 'announcements' ? 'active' : ''}`}
              onClick={() => handleTabChange('announcements')}
            >
              📢 Thông báo từ P.ĐT
            </button>
            <button 
              className={`sidebar-item ${activeTab === 'tickets' ? 'active' : ''}`}
              onClick={() => handleTabChange('tickets')}
            >
              ✉️ Phiếu yêu cầu (Tickets)
            </button>
            <button 
              className={`sidebar-item ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => handleTabChange('resources')}
            >
              📁 Biểu mẫu & Tài liệu
            </button>
          </div>

          {/* Main Content Area */}
          <div className="support-content">
            {isLoading && (
              <div className="loading-state">⏳ Đang tải dữ liệu...</div>
            )}

            {/* TAB: ANNOUNCEMENTS */}
            {!isLoading && activeTab === 'announcements' && (
              <div className="tab-pane">
                <h2>Thông báo từ Phòng Đào Tạo</h2>
                {announcements.length > 0 ? (
                  <div className="announcements-list">
                    {announcements.map((item, idx) => (
                      <div key={idx} className="announcement-card">
                        <h3>{item.title}</h3>
                        <span className="announcement-date">{item.date ? new Date(item.date).toLocaleDateString() : ''}</span>
                        <p>{item.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    Hiện chưa có thông báo nào từ Phòng Đào Tạo.
                  </div>
                )}
              </div>
            )}

            {/* TAB: TICKETS */}
            {!isLoading && activeTab === 'tickets' && (
              <div className="tab-pane">
                <div className="tab-header-flex">
                  <h2>Danh sách Phiếu Yêu Cầu</h2>
                  <button className="create-btn" onClick={() => setShowNewTicketModal(true)}>
                    + Tạo yêu cầu mới
                  </button>
                </div>

                {tickets.length > 0 ? (
                  <table className="tickets-table">
                    <thead>
                      <tr>
                        <th>Mã phiếu</th>
                        <th>Loại yêu cầu</th>
                        <th>Nội dung</th>
                        <th>Trạng thái</th>
                        <th>Ngày gửi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map((t, idx) => (
                        <tr key={idx}>
                          <td>{t.ticket_id || `#TCK-${idx+1}`}</td>
                          <td><strong>{t.type}</strong></td>
                          <td>{t.content}</td>
                          <td>
                            <span className={`status-badge ${t.status === 'Đã xử lý' ? 'resolved' : 'pending'}`}>
                              {t.status || 'Đang chờ xử lý'}
                            </span>
                          </td>
                          <td>{t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    Bạn chưa gửi phiếu yêu cầu nào.
                  </div>
                )}
              </div>
            )}

            {/* TAB: RESOURCES */}
            {!isLoading && activeTab === 'resources' && (
              <div className="tab-pane">
                <h2>Biểu mẫu & Tài liệu Dành cho Giảng viên</h2>
                <p className="tab-subtitle">Các tài liệu, quy chế và biểu mẫu chuẩn từ Phòng Đào Tạo.</p>
                
                <div className="empty-state">
                  Chưa có biểu mẫu hoặc tài liệu nào được tải lên từ Phòng Đào Tạo.
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MODAL TẠO PHIẾU YÊU CẦU */}
      {showNewTicketModal && (
        <div className="support-modal-overlay">
          <div className="support-modal">
            <h2>Tạo phiếu yêu cầu mới</h2>
            <form onSubmit={handleSubmitTicket}>
              <div className="form-group">
                <label>Loại yêu cầu</label>
                <select value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
                  <option value="Mở khóa điểm">Mở khóa điểm trực tuyến</option>
                  <option value="Đổi phòng học/Dạy bù">Đổi phòng học / Dạy bù</option>
                  <option value="Báo cáo sự cố thiết bị">Báo cáo sự cố thiết bị</option>
                  <option value="Đăng ký lịch thi">Đăng ký lịch thi</option>
                  <option value="Khác">Khác...</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nội dung chi tiết</label>
                <textarea 
                  rows="4" 
                  value={ticketContent} 
                  onChange={(e) => setTicketContent(e.target.value)}
                  placeholder="Mô tả rõ yêu cầu của bạn (Ví dụ: Xin mở khóa bảng điểm lớp MT1001 do tôi đã chốt nhầm...)"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowNewTicketModal(false)}>Hủy</button>
                <button type="submit" className="submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TeachingSupport;
