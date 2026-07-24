import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header/Header';
import { getAdminAnnouncementsAPI, getTeacherTicketsAPI, createTeacherTicketAPI } from '../../api/teacher/support';
import { useToast } from '../../components/Toast/ToastContext';
import './TeachingSupport.css';

function TeachingSupport() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'announcements';
  const [activeTab, setActiveTab] = useState(initialTab); // announcements, tickets, resources

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName }, { replace: true });
  };

  const handleLogout = async () => {
    try {
      await logoutAPI();
    } catch (err) {
      console.warn('Logout API error:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // States
  const [announcements, setAnnouncements] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // States for new ticket modal
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketType, setTicketType] = useState('Yêu cầu chỉnh sửa điểm');
  const [ticketContent, setTicketContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    const currentUser = userString ? JSON.parse(userString) : null;
    const userRole = String(currentUser?.role || '1');

    if (userRole === '1') {
      showToast('Khu vực "Hỗ trợ & Quản lý giảng dạy" chỉ dành riêng cho Giảng viên và Admin!', 'error');
      navigate('/', { replace: true });
      return;
    }
  }, [navigate]);

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
        ticket_type: ticketType,
        content: ticketContent
      });
      showToast('Đã gửi phiếu yêu cầu thành công!', 'success');
      setShowNewTicketModal(false);
      setTicketContent('');
      fetchTickets();
    } catch (err) {
      console.warn('Lỗi tạo phiếu yêu cầu:', err);
      if (err.response?.status === 500) {
        showToast('Lỗi 500 CSDL Backend: Bảng SupportTickets chưa có trong MySQL. Vui lòng chạy lệnh CREATE TABLE SupportTickets trong MySQL!', 'error');
      } else {
        showToast(err.response?.data?.error || 'Lỗi khi gửi phiếu yêu cầu. Vui lòng kiểm tra lại.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="teaching-support-container">
      <nav className="teacher-top-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#008b44', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="nav-brand-box" onClick={() => navigate('/')} style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '20px' }}>
            myBH
          </div>
          <span style={{ fontSize: '15px', fontWeight: 'bold', borderLeft: '1px solid rgba(255,255,255,0.4)', paddingLeft: '15px' }}>
            HỖ TRỢ & QUẢN LÝ GIẢNG DẠY
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ background: '#ffffff', color: '#008b44', border: 'none', borderRadius: '0px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            Trang chủ
          </button>
          <button 
            onClick={handleLogout} 
            style={{ background: '#e53e3e', color: '#fff', border: 'none', borderRadius: '0px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            Đăng xuất
          </button>
        </div>
      </nav>

      <div className="teaching-support-body">


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
                          <td><strong>{t.ticket_type || t.type}</strong></td>
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
                <p className="tab-subtitle">Các tài liệu, quy chế và biểu mẫu chuẩn phát hành từ Phòng Đào Tạo.</p>

                {(() => {
                  const saved = localStorage.getItem('system_resources');
                  const list = saved ? JSON.parse(saved) : [];
                  const teacherResources = list.filter(r => r.category === 'Giảng viên' || r.category === 'Tất cả');

                  if (teacherResources.length === 0) {
                    return (
                      <div className="empty-state">
                        Chưa có biểu mẫu hoặc tài liệu nào được tải lên từ Phòng Đào Tạo.
                      </div>
                    );
                  }

                  return (
                    <div style={{ marginTop: '15px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                          <tr style={{ background: '#e8f5e9', color: '#005a2b', textAlign: 'left' }}>
                            <th style={{ padding: '10px 12px', border: '1px solid #c8e6c9' }}>Tên tài liệu / Biểu mẫu</th>
                            <th style={{ padding: '10px 12px', border: '1px solid #c8e6c9' }}>Dung lượng</th>
                            <th style={{ padding: '10px 12px', border: '1px solid #c8e6c9' }}>Ngày phát hành</th>
                            <th style={{ padding: '10px 12px', border: '1px solid #c8e6c9' }}>Tải về</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teacherResources.map((item) => (
                            <tr key={item.id}>
                              <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0' }}><strong>{item.name}</strong></td>
                              <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0' }}>{item.size}</td>
                              <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0' }}>{item.date}</td>
                              <td style={{ padding: '10px 12px', border: '1px solid #e2e8f0' }}>
                                {item.fileUrl ? (
                                  <a
                                    href={item.fileUrl}
                                    download={item.fileName || `${item.name}.pdf`}
                                    style={{ background: '#008b44', color: '#fff', padding: '5px 12px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }}
                                    onClick={() => showToast(`Đang tải xuống biểu mẫu: ${item.name}`, 'info')}
                                  >
                                    📥 Tải về
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => showToast(`Đang tải xuống biểu mẫu: ${item.name}`, 'info')}
                                    style={{ background: '#008b44', color: '#fff', border: 'none', padding: '5px 12px', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}
                                  >
                                    📥 Tải về
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
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
                  <option value="Yêu cầu chỉnh sửa điểm">Yêu cầu chỉnh sửa điểm / Mở khóa điểm</option>
                  <option value="Hỗ trợ kỹ thuật">Hỗ trợ kỹ thuật</option>
                  <option value="Đề nghị cấp tài nguyên">Đề nghị cấp tài nguyên</option>
                  <option value="Phản hồi về lịch dạy">Phản hồi về lịch dạy / Đổi phòng học</option>
                  <option value="Báo cáo sự cố lớp học">Báo cáo sự cố lớp học</option>
                  <option value="Khác">Khác</option>
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
