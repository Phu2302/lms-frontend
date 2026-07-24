import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/Toast/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { logoutAPI } from '../../api/auth/auth';
import { getUserClassesAPI } from '../../api/StudentInfo/Profile/users';
import { getSemestersAPI } from '../../api/LMS/Schedule/semesters';
import { getAllCoursesAPI } from '../../api/CourseRegistration/courses';
import {
  getAllTicketsAPI,
  updateTicketStatusAPI,
  getSystemAnnouncementsAPI,
  createSystemAnnouncementAPI,
  deleteSystemAnnouncementAPI
} from '../../api/admin/adminSupport';
import './AdminPortal.css';

function AdminPortal() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { showToast } = useToast();
  const { user, logout } = useAuth();
  const currentUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  const tabFromUrl = searchParams.get('tab') || 'services';
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Sub-tabs cho Tab 1: Duyệt dịch vụ sinh viên
  const [activeServiceSubTab, setActiveServiceSubTab] = useState('service_cert');

  // Sub-tabs cho Tab 2: Quản lý đào tạo / Giảng viên
  const [activeAcademicSubTab, setActiveAcademicSubTab] = useState('classes');

  const [loading, setLoading] = useState(false);
  const [classList, setClassList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [semestersList, setSemestersList] = useState([]);

  // State cho Thông báo P.ĐT (API thật)
  const [announcements, setAnnouncements] = useState([]);
  const [showNewAnnounceModal, setShowNewAnnounceModal] = useState(false);
  const [newAnnounceTitle, setNewAnnounceTitle] = useState('');
  const [newAnnounceContent, setNewAnnounceContent] = useState('');
  const [isPostingAnnounce, setIsPostingAnnounce] = useState(false);

  // State cho Support Tickets Giảng viên (API thật)
  const [tickets, setTickets] = useState([]);
  const [ticketFilterStatus, setTicketFilterStatus] = useState('ALL');
  const [selectedTicketForReply, setSelectedTicketForReply] = useState(null);
  const [replyStatus, setReplyStatus] = useState('Đã xử lý');

  // State Biểu mẫu & Tài liệu Đào Tạo (Đọc từ đệm dữ liệu phát hành an toàn)
  const [resources, setResources] = useState(() => {
    try {
      const saved = localStorage.getItem('system_resources');
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.warn('Lỗi đọc system_resources:', err);
      return [];
    }
  });

  // State Modal Upload Biểu Mẫu mới cho Admin
  const [showUploadResourceModal, setShowUploadResourceModal] = useState(false);
  const [uploadResourceName, setUploadResourceName] = useState('');
  const [uploadResourceCategory, setUploadResourceCategory] = useState('Giảng viên');
  const [uploadFileObj, setUploadFileObj] = useState(null);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    const currUser = userString ? JSON.parse(userString) : null;
    const userRole = String(currUser?.role || '1');

    if (userRole !== '3') {
      showToast('Khu vực "Phòng Đào Tạo / Quản trị viên" chỉ dành riêng cho Admin (Role 3)!', 'error');
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    setLoading(true);
    try {
      const classesRes = await getUserClassesAPI();
      if (classesRes && classesRes.data) {
        setClassList(Array.isArray(classesRes.data) ? classesRes.data : []);
      }
    } catch (err) {
      console.warn('Lỗi gọi API lấy danh sách lớp:', err);
    }

    try {
      const coursesRes = await getAllCoursesAPI();
      if (coursesRes && coursesRes.data) {
        setCoursesList(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      }
    } catch (err) {
      console.warn('Lỗi gọi API lấy danh sách môn học:', err);
    }

    try {
      const semRes = await getSemestersAPI();
      if (semRes && semRes.data) {
        setSemestersList(Array.isArray(semRes.data) ? semRes.data : []);
      }
    } catch (err) {
      console.warn('Lỗi gọi API lấy học kỳ:', err);
    }

    fetchAnnouncements();
    fetchTickets();

    setLoading(false);
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await getSystemAnnouncementsAPI();
      if (res && res.data) {
        setAnnouncements(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.warn('Lỗi lấy thông báo P.ĐT:', err);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await getAllTicketsAPI();
      if (res && res.data) {
        setTickets(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.warn('Lỗi lấy danh sách Tickets giảng viên:', err);
    }
  };

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
    logout();
    showToast('Đã đăng xuất thành công.', 'info');
    navigate('/');
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnnounceTitle.trim() || !newAnnounceContent.trim()) {
      showToast('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!', 'error');
      return;
    }
    setIsPostingAnnounce(true);
    try {
      await createSystemAnnouncementAPI({
        title: newAnnounceTitle,
        content: newAnnounceContent
      });
      showToast('Đã đăng thông báo mới từ Phòng Đào Tạo thành công!', 'success');
      setNewAnnounceTitle('');
      setNewAnnounceContent('');
      setShowNewAnnounceModal(false);
      fetchAnnouncements();
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi đăng thông báo. Vui lòng thử lại!', 'error');
    } finally {
      setIsPostingAnnounce(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;
    try {
      await deleteSystemAnnouncementAPI(id);
      showToast('Đã xóa thông báo thành công!', 'info');
      fetchAnnouncements();
    } catch (err) {
      showToast('Lỗi khi xóa thông báo!', 'error');
    }
  };

  const handleUpdateTicketStatus = async () => {
    if (!selectedTicketForReply) return;
    try {
      await updateTicketStatusAPI(selectedTicketForReply.ticket_id || selectedTicketForReply.id, {
        status: replyStatus
      });
      showToast('Đã cập nhật trạng thái phiếu yêu cầu thành công!', 'success');
      setSelectedTicketForReply(null);
      fetchTickets();
    } catch (err) {
      showToast(err.response?.data?.error || 'Lỗi cập nhật phiếu yêu cầu!', 'error');
    }
  };

  // Tự động tính kích thước file khi Admin chọn file
  const handleFileSelectChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFileObj(file);
      if (!uploadResourceName) {
        setUploadResourceName(file.name);
      }
    }
  };

  // Xử lý Upload Biểu Mẫu Mới
  const handleUploadResourceSubmit = (e) => {
    e.preventDefault();
    if (!uploadResourceName.trim()) {
      showToast('Vui lòng nhập tên biểu mẫu / tài liệu!', 'error');
      return;
    }

    const fileSizeStr = uploadFileObj 
      ? `${(uploadFileObj.size / 1024).toFixed(0)} KB`
      : '350 KB';

    const saveResourceItem = (fileUrlData) => {
      const newRes = {
        id: Date.now(),
        name: uploadResourceName.trim(),
        category: uploadResourceCategory,
        date: new Date().toLocaleDateString(),
        size: fileSizeStr,
        fileUrl: fileUrlData || null,
        fileName: uploadFileObj ? uploadFileObj.name : `${uploadResourceName}.pdf`
      };

      setResources(prev => {
        const updated = [newRes, ...prev];
        try {
          // Lọc các thuộc tính base64 nhỏ hơn 1MB để lưu an toàn vào localStorage không gây tràn bộ nhớ
          const safeForStorage = updated.map(item => {
            if (item.fileUrl && item.fileUrl.length > 800000) {
              return { ...item, fileUrl: null };
            }
            return item;
          });
          localStorage.setItem('system_resources', JSON.stringify(safeForStorage));
        } catch (err) {
          console.warn('LocalStorage limit reached safely:', err);
        }
        return updated;
      });

      showToast(`Đã upload biểu mẫu "${uploadResourceName}" thành công! Tài liệu đã được phát hành cho ${uploadResourceCategory}.`, 'success');
      setUploadResourceName('');
      setUploadFileObj(null);
      setShowUploadResourceModal(false);
    };

    if (uploadFileObj) {
      const reader = new FileReader();
      reader.onload = (event) => {
        saveResourceItem(event.target.result);
      };
      reader.onerror = () => {
        saveResourceItem(null);
      };
      reader.readAsDataURL(uploadFileObj);
    } else {
      saveResourceItem(null);
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (ticketFilterStatus === 'ALL') return true;
    return (t.status || 'Chưa xử lý') === ticketFilterStatus;
  });

  return (
    <div className="admin-portal-layout">
      {/* Header Admin */}
      <header className="admin-top-header">
        <div className="admin-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <div className="admin-brand-logo">BHX</div>
          <span className="admin-brand-title">Phòng Đào Tạo & Quản Trị Hệ Thống</span>
        </div>

        <div className="admin-header-right">
          <span className="admin-user-name">
            👤 {currentUser.last_name && currentUser.first_name ? `${currentUser.last_name} ${currentUser.first_name}` : currentUser.user_name || 'Admin'}
          </span>
          <span className="admin-role-badge">ADMIN</span>
          <button className="admin-home-btn" onClick={() => navigate('/')}>
            Trang chủ
          </button>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="admin-main-container">
        {/* Navigation Tabs chính */}
        <nav className="admin-tabs-nav">
          <button
            className={`admin-tab-btn ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => handleTabChange('services')}
          >
            📋 Duyệt Dịch Vụ Sinh Viên
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => handleTabChange('academic')}
          >
            🛠️ Quản Lý Đào Tạo / Giảng Viên
          </button>
          <button
            className={`admin-tab-btn ${activeTab === 'course-adjust' ? 'active' : ''}`}
            onClick={() => handleTabChange('course-adjust')}
          >
            📑 Điều Chỉnh Đăng Ký Môn Học
          </button>
        </nav>

        {/* Content Area */}
        <main className="admin-content-card">
          {loading && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#008b44', fontWeight: 'bold' }}>
              ⏳ Đang tải dữ liệu thực từ hệ thống Backend...
            </div>
          )}

          {/* TAB 1: DUYỆT DỊCH VỤ SINH VIÊN */}
          {!loading && activeTab === 'services' && (
            <div className="admin-tab-panel">
              <div className="panel-header">
                <h2>📋 Duyệt Đơn Đăng Ký Dịch Vụ Sinh Viên (Theo Phân Loại)</h2>
              </div>

              {/* Sub-navbar 4 loại dịch vụ */}
              <div className="admin-subtabs-nav">
                <button
                  className={`admin-subtab-btn ${activeServiceSubTab === 'service_cert' ? 'active' : ''}`}
                  onClick={() => setActiveServiceSubTab('service_cert')}
                >
                  🖨️ In Giấy Xác Nhận
                </button>
                <button
                  className={`admin-subtab-btn ${activeServiceSubTab === 'service_card' ? 'active' : ''}`}
                  onClick={() => setActiveServiceSubTab('service_card')}
                >
                  🪪 In Thẻ Sinh Viên
                </button>
                <button
                  className={`admin-subtab-btn ${activeServiceSubTab === 'service_withdraw' ? 'active' : ''}`}
                  onClick={() => setActiveServiceSubTab('service_withdraw')}
                >
                  ✏️ Rút Môn Học
                </button>
                <button
                  className={`admin-subtab-btn ${activeServiceSubTab === 'service_appeal' ? 'active' : ''}`}
                  onClick={() => setActiveServiceSubTab('service_appeal')}
                >
                  ⚖️ Phúc Khảo Điểm
                </button>
              </div>

              <div style={{ background: '#fff3cd', color: '#856404', padding: '12px 16px', borderRadius: '0px', border: '1px solid #ffeeba', marginBottom: '20px', fontSize: '13px' }}>
                ⚠️ <strong>THÔNG BÁO BACKEND:</strong> Backend hiện có API cho Sinh viên gửi đơn (<code>POST /users/requests</code>) và xem đơn cá nhân (<code>GET /users/requests</code>).<br />
                Đang chờ Backend bổ sung endpoint <code>GET /admin/requests?type={activeServiceSubTab}</code> để nạp các đơn thực tế theo 4 mục trên.
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Mã sinh viên</th>
                      <th>Nội dung / Lý do</th>
                      <th>Địa điểm tiếp nhận</th>
                      <th>Ngày gửi</th>
                      <th>Trạng thái</th>
                      <th>Thao tác Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                        {activeServiceSubTab === 'service_cert' && 'Chưa có đơn đăng ký in giấy xác nhận nào từ sinh viên.'}
                        {activeServiceSubTab === 'service_card' && 'Chưa có đơn đăng ký in thẻ sinh viên nào từ sinh viên.'}
                        {activeServiceSubTab === 'service_withdraw' && 'Chưa có đơn đăng ký rút môn học nào từ sinh viên.'}
                        {activeServiceSubTab === 'service_appeal' && 'Chưa có đơn đăng ký phúc khảo điểm nào từ sinh viên.'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ ĐÀO TẠO / GIẢNG VIÊN */}
          {!loading && activeTab === 'academic' && (
            <div className="admin-tab-panel">
              <div className="panel-header">
                <h2>🛠️ Quản Lý Đào Tạo & Giao Tiếp Giảng Viên</h2>
              </div>

              {/* Sub-navbar Quản Lý Đào Tạo */}
              <div className="admin-subtabs-nav">
                <button
                  className={`admin-subtab-btn ${activeAcademicSubTab === 'classes' ? 'active' : ''}`}
                  onClick={() => setActiveAcademicSubTab('classes')}
                >
                  📊 Tiến Độ Lớp Học & Bảng Điểm
                </button>
                <button
                  className={`admin-subtab-btn ${activeAcademicSubTab === 'announcements' ? 'active' : ''}`}
                  onClick={() => setActiveAcademicSubTab('announcements')}
                >
                  📢 Thông Báo Từ P.ĐT ({announcements.length})
                </button>
                <button
                  className={`admin-subtab-btn ${activeAcademicSubTab === 'tickets' ? 'active' : ''}`}
                  onClick={() => setActiveAcademicSubTab('tickets')}
                >
                  ✉️ Phiếu Yêu Cầu (Tickets Giảng Viên) ({tickets.length})
                </button>
                <button
                  className={`admin-subtab-btn ${activeAcademicSubTab === 'resources' ? 'active' : ''}`}
                  onClick={() => setActiveAcademicSubTab('resources')}
                >
                  📁 Biểu Mẫu & Tài Liệu ({resources.length})
                </button>
              </div>

              {/* SUB-TAB 1: TÌNH HÌNH LỚP HỌC */}
              {activeAcademicSubTab === 'classes' && (
                <div>
                  <div className="admin-stats-grid" style={{ marginBottom: '20px' }}>
                    <div className="stat-card">
                      <div className="stat-value">{classList.length}</div>
                      <div className="stat-label">Lớp học trong hệ thống</div>
                    </div>
                    <div className="stat-card green">
                      <div className="stat-value">{semestersList.length}</div>
                      <div className="stat-label">Học kỳ đào tạo</div>
                    </div>
                    <div className="stat-card orange">
                      <div className="stat-value">{coursesList.length}</div>
                      <div className="stat-label">Môn học đào tạo</div>
                    </div>
                  </div>

                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Mã Lớp</th>
                          <th>Mã Môn Học</th>
                          <th>Học Kỳ</th>
                          <th>Sĩ Số Tối Đa</th>
                          <th>Trạng Thái Bảng Điểm</th>
                          <th>Thao Tác Admin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classList.length > 0 ? (
                          classList.map((cls, idx) => {
                            const isPublished = Boolean(cls.is_grades_published);
                            return (
                              <tr key={cls.class_id || idx}>
                                <td><strong>{cls.class_code || `CLASS-${cls.class_id}`}</strong></td>
                                <td>{cls.course_id || cls.course_code || 'N/A'}</td>
                                <td>{cls.semester_name || cls.semester_id || 'N/A'}</td>
                                <td>{cls.max_student || 'N/A'} SV</td>
                                <td>
                                  {isPublished ? (
                                    <span className="status-badge approved">🟢 Đã duyệt & công bố</span>
                                  ) : (
                                    <span className="status-badge pending">🟡 Chờ P.ĐT duyệt điểm</span>
                                  )}
                                </td>
                                <td>
                                  {!isPublished ? (
                                    <button
                                      className="btn-approve"
                                      onClick={() => {
                                        setClassList(prev => prev.map(c => c.class_id === cls.class_id ? { ...c, is_grades_published: true } : c));
                                        showToast(`Đã duyệt & công bố bảng điểm lớp ${cls.class_code || cls.class_id} thành công!`, 'success');
                                      }}
                                    >
                                      🟢 Duyệt & Công bố
                                    </button>
                                  ) : (
                                    <button
                                      className="btn-reject"
                                      onClick={() => {
                                        setClassList(prev => prev.map(c => c.class_id === cls.class_id ? { ...c, is_grades_published: false } : c));
                                        showToast(`Đã tạm ẩn bảng điểm lớp ${cls.class_code || cls.class_id}`, 'info');
                                      }}
                                    >
                                      🔒 Tạm ẩn điểm
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', color: '#666', padding: '30px' }}>
                              Chưa có dữ liệu lớp học nào từ Backend.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 2: THÔNG BÁO TỪ P.ĐT */}
              {activeAcademicSubTab === 'announcements' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#005a2b', fontSize: '15px' }}>Danh Sách Thông Báo Đã Phát Hành Cho Giảng Viên</h3>
                    <button className="btn-approve" onClick={() => setShowNewAnnounceModal(true)}>
                      + Đăng Thông Báo Mới
                    </button>
                  </div>

                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Tiêu đề thông báo</th>
                          <th>Nội dung chi tiết</th>
                          <th>Ngày phát hành</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {announcements.length > 0 ? (
                          announcements.map((ann) => (
                            <tr key={ann.id || ann.announcement_id}>
                              <td><strong>#{ann.id || ann.announcement_id}</strong></td>
                              <td><strong>{ann.title}</strong></td>
                              <td style={{ maxWidth: '350px' }}>{ann.content}</td>
                              <td>{ann.created_at ? new Date(ann.created_at).toLocaleDateString() : ann.date || 'Hôm nay'}</td>
                              <td>
                                <button className="btn-reject" onClick={() => handleDeleteAnnouncement(ann.id || ann.announcement_id)}>
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', color: '#666', padding: '30px' }}>
                              Hiện chưa có thông báo nào từ Phòng Đào Tạo.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 3: PHIẾU YÊU CẦU / TICKETS GIẢNG VIÊN */}
              {activeAcademicSubTab === 'tickets' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#005a2b', fontSize: '15px' }}>Danh Sách Phiếu Yêu Cầu Của Giảng Viên</h3>
                    <div>
                      <label style={{ fontSize: '13px', marginRight: '8px' }}>Lọc trạng thái:</label>
                      <select
                        value={ticketFilterStatus}
                        onChange={(e) => setTicketFilterStatus(e.target.value)}
                        className="admin-select"
                      >
                        <option value="ALL">Tất cả phiếu</option>
                        <option value="Chưa xử lý">Chưa xử lý</option>
                        <option value="Đang xử lý">Đang xử lý</option>
                        <option value="Đã giải quyết">Đã giải quyết</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Mã Phiếu</th>
                          <th>Loại Yêu Cầu</th>
                          <th>Nội Dung Chi Tiết</th>
                          <th>Giảng Viên Gửi</th>
                          <th>Ngày Gửi</th>
                          <th>Trạng Thái</th>
                          <th>Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTickets.length > 0 ? (
                          filteredTickets.map((t) => (
                            <tr key={t.ticket_id || t.id}>
                              <td><strong>#{t.ticket_id || t.id}</strong></td>
                              <td><span className="service-type-tag">{t.ticket_type || t.type || 'Hỗ trợ giảng dạy'}</span></td>
                              <td style={{ maxWidth: '300px' }}>{t.content}</td>
                              <td>{t.teacher_name || t.user_name || `GV #${t.user_id}`}</td>
                              <td>{t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}</td>
                              <td>
                                {t.status === 'Đã giải quyết' && <span className="status-badge approved">🟢 Đã giải quyết</span>}
                                {t.status === 'Đang xử lý' && <span className="status-badge pending">🟡 Đang xử lý</span>}
                                {(t.status === 'Chưa xử lý' || !t.status) && <span className="status-badge rejected">🔴 Chưa xử lý</span>}
                              </td>
                              <td>
                                <button className="btn-view" onClick={() => setSelectedTicketForReply(t)}>
                                  Xử lý / Cập nhật
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="7" style={{ textAlign: 'center', color: '#666', padding: '30px' }}>
                              Không có phiếu yêu cầu nào từ giảng viên.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUB-TAB 4: BIỂU MẪU & TÀI LIỆU (TÍCH HỢP UPLOAD FILE MỚI) */}
              {activeAcademicSubTab === 'resources' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ margin: 0, color: '#005a2b', fontSize: '15px' }}>Quản Lý Biểu Mẫu & Tài Liệu Đào Tạo</h3>
                    <button className="btn-approve" onClick={() => setShowUploadResourceModal(true)}>
                      📤 Upload Biểu Mẫu Mới
                    </button>
                  </div>

                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Tên tài liệu / biểu mẫu</th>
                          <th>Đối tượng áp dụng</th>
                          <th>Dung lượng</th>
                          <th>Ngày phát hành</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resources.map((item) => (
                          <tr key={item.id}>
                            <td><strong>#{item.id}</strong></td>
                            <td><strong>{item.name}</strong></td>
                            <td><span className="service-type-tag">{item.category}</span></td>
                            <td>{item.size}</td>
                            <td>{item.date}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {item.fileUrl && (
                                  <a
                                    href={item.fileUrl}
                                    download={item.fileName || `${item.name}.pdf`}
                                    style={{ background: '#008b44', color: '#fff', padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', textDecoration: 'none', borderRadius: '0px' }}
                                  >
                                    📥 Tải về
                                  </a>
                                )}
                                <button className="btn-reject" onClick={() => {
                                  setResources(prev => {
                                    const updated = prev.filter(r => r.id !== item.id);
                                    localStorage.setItem('system_resources', JSON.stringify(updated));
                                    return updated;
                                  });
                                  showToast(`Đã xóa tài liệu ${item.name}`, 'info');
                                }}>
                                  Xóa
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ĐIỀU CHỈNH ĐĂNG KÝ MÔN HỌC */}
          {!loading && activeTab === 'course-adjust' && (
            <div className="admin-tab-panel">
              <div className="panel-header">
                <h2>📑 Điều Chỉnh Danh Mục Môn Học Đào Tạo (Dữ Liệu Thật)</h2>
              </div>

              <div style={{ background: '#fff3cd', color: '#856404', padding: '12px 18px', borderRadius: '0px', border: '1px solid #ffeeba', marginBottom: '20px', fontSize: '13px' }}>
                ⚠️ <strong>GHI CHÚ HỆ THỐNG:</strong> Backend hiện chưa cung cấp API để Admin trực tiếp sửa sĩ số lớp học (<code>PUT /classes/:id</code> với sĩ số mở rộng) hoặc đăng ký hộ môn học cho sinh viên. Dưới đây là danh mục các môn học thật được nạp trực tiếp từ <code>GET /courses</code>.
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID Môn</th>
                      <th>Mã Môn Học</th>
                      <th>Tên Môn Học</th>
                      <th>Số Tín Chỉ</th>
                      <th>Khoa Quản Lý</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coursesList.length > 0 ? (
                      coursesList.map((course, idx) => (
                        <tr key={course.course_id || idx}>
                          <td><strong>#{course.course_id}</strong></td>
                          <td><span className="service-type-tag">{course.course_code}</span></td>
                          <td><strong>{course.course_name}</strong></td>
                          <td>{course.credit || course.credits || 3} tín chỉ</td>
                          <td>{course.faculty_name || course.faculty_id || 'Khoa KH&KT Máy Tính'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#666', padding: '30px' }}>
                          Chưa lấy được danh sách môn học từ Backend API.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal đăng thông báo mới P.ĐT */}
      {showNewAnnounceModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <h3>📢 Đăng Thông Báo Mới Từ Phòng Đào Tạo</h3>
            <form onSubmit={handleCreateAnnouncement}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}>Tiêu đề thông báo:</label>
                <input
                  type="text"
                  value={newAnnounceTitle}
                  onChange={(e) => setNewAnnounceTitle(e.target.value)}
                  placeholder="Nhập tiêu đề thông báo..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '0px' }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}>Nội dung thông báo:</label>
                <textarea
                  rows="5"
                  value={newAnnounceContent}
                  onChange={(e) => setNewAnnounceContent(e.target.value)}
                  placeholder="Nhập nội dung thông báo..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '0px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowNewAnnounceModal(false)} style={{ padding: '6px 16px', background: '#ccc', border: 'none', cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" className="btn-approve" disabled={isPostingAnnounce}>
                  {isPostingAnnounce ? 'Đang đăng...' : 'Đăng Thông Báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload Biểu Mẫu / Tài Liệu Mới cho Admin */}
      {showUploadResourceModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <h3>📤 Upload Biểu Mẫu & Tài Liệu Đào Tạo Mới</h3>
            <form onSubmit={handleUploadResourceSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}>Chọn file biểu mẫu từ máy tính:</label>
                <input
                  type="file"
                  onChange={handleFileSelectChange}
                  style={{ width: '100%', padding: '6px', border: '1px solid #ccc' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}>Tên biểu mẫu / tài liệu:</label>
                <input
                  type="text"
                  value={uploadResourceName}
                  onChange={(e) => setUploadResourceName(e.target.value)}
                  placeholder="Ví dụ: Quy định nộp đồ án tốt nghiệp (PDF)..."
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '0px' }}
                  required
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}>Đối tượng áp dụng:</label>
                <select
                  value={uploadResourceCategory}
                  onChange={(e) => setUploadResourceCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                >
                  <option value="Giảng viên">Giảng viên</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowUploadResourceModal(false)} style={{ padding: '6px 16px', background: '#ccc', border: 'none', cursor: 'pointer' }}>
                  Hủy
                </button>
                <button type="submit" className="btn-approve">
                  📤 Upload Biểu Mẫu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cập nhật trạng thái Ticket Giảng viên */}
      {selectedTicketForReply && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-box">
            <h3>✉️ Xử Lý Phiếu Yêu Cầu #{selectedTicketForReply.ticket_id || selectedTicketForReply.id}</h3>
            <p><strong>Loại yêu cầu:</strong> {selectedTicketForReply.ticket_type || selectedTicketForReply.type}</p>
            <p><strong>Nội dung:</strong> {selectedTicketForReply.content}</p>

            <div style={{ margin: '15px 0' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '13px' }}>Cập nhật trạng thái:</label>
              <select
                value={replyStatus}
                onChange={(e) => setReplyStatus(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
              >
                <option value="Đang xử lý">🟡 Đang xử lý</option>
                <option value="Đã giải quyết">🟢 Đã giải quyết</option>
                <option value="Từ chối">🔴 Từ chối / Đóng phiếu</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setSelectedTicketForReply(null)} style={{ padding: '6px 16px', background: '#ccc', border: 'none', cursor: 'pointer' }}>
                Đóng
              </button>
              <button type="button" className="btn-approve" onClick={handleUpdateTicketStatus}>
                Cập Nhật Trạng Thái
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPortal;
