import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSemestersAPI } from '../../api/LMS/Schedule/semesters';
import { getUserClassesAPI } from '../../api/StudentInfo/Profile/users';
import { getAllClassesAPI, enrollClassAPI, unenrollClassAPI } from '../../api/CourseRegistration/classes';
import { getAllCoursesAPI } from '../../api/CourseRegistration/courses';
import { logoutAPI } from '../../api/auth/auth';
import { useToast } from '../../components/Toast/ToastContext';
import './CourseRegistration.css';

function CourseRegistration() {
  const navigate = useNavigate();
  const { showToast } = useToast();

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

  // State quản lý xem đang ở màn hình danh sách đợt hay chi tiết 1 đợt
  const [activePeriod, setActivePeriod] = useState(null);

  // Danh sách các đợt đăng ký môn học (tải từ học kỳ)
  const [periods, setPeriods] = useState([]);
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');

  // States phục vụ việc tìm kiếm lớp môn học để đăng ký
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchMessage, setSearchMessage] = useState('Nhập mã hoặc tên môn học để tìm kiếm lớp đăng ký.');

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const pad = (num) => String(num).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Kiểm tra xem thời điểm hiện tại có thuộc khoảng thời gian đăng ký (Từ ngày - Đến ngày) hay không
  const isRegistrationPeriodOpen = (period) => {
    if (!period) return false;
    if (period.rawStartDate && period.rawEndDate) {
      const now = new Date();
      const start = new Date(period.rawStartDate);
      const end = new Date(period.rawEndDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        return now >= start && now <= end;
      }
    }
    // Nếu chưa thiết lập thời gian đăng ký trong DB (null / trống), mặc định mở để phục vụ thử nghiệm
    return true;
  };

  // Tải dữ liệu ban đầu (các học kỳ làm đợt đăng ký và các môn học đã đăng ký)
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [semestersRes, registeredRes] = await Promise.all([
        getSemestersAPI(),
        getUserClassesAPI()
      ]);

      // Ánh xạ các học kỳ từ DB thành các đợt đăng ký học phần
      const mappedPeriods = (semestersRes.data || []).map(sem => ({
        id: String(sem.semester_id),
        name: `Đăng ký học phần - ${sem.semester_name}`,
        rawStartDate: sem.reg_start_date,
        rawEndDate: sem.reg_end_date,
        startDate: sem.reg_start_date ? formatDateTime(sem.reg_start_date) : '--',
        endDate: sem.reg_end_date ? formatDateTime(sem.reg_end_date) : '--'
      }));

      setPeriods(mappedPeriods);
      setRegisteredCourses(registeredRes.data || []);
    } catch (err) {
      console.error('Error fetching registration initial data:', err);
      setError('Không thể tải thông tin đợt đăng ký môn học.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tải lại danh sách môn học đã đăng ký sau khi thêm/xóa thành công
  const reloadRegisteredCourses = async () => {
    try {
      const res = await getUserClassesAPI();
      setRegisteredCourses(res.data || []);
    } catch (err) {
      console.error('Error reloading registered courses:', err);
    }
  };

  // Thực hiện tìm kiếm lớp môn học mở đăng ký
  const handleSearch = async () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      setSearchMessage('Vui lòng nhập từ khóa tìm kiếm (Mã hoặc Tên môn học).');
      return;
    }

    setIsSearching(true);
    setSearchMessage('Đang tìm kiếm lớp môn học...');
    try {
      // Gọi API lấy toàn bộ các lớp học mở và các môn học để map thông tin
      const [classesRes, coursesRes] = await Promise.all([
        getAllClassesAPI(),
        getAllCoursesAPI()
      ]);

      const classes = classesRes.data || [];
      const courses = coursesRes.data || [];

      // Lọc các lớp thuộc học kỳ hiện tại đang chọn đăng ký
      const currentSemesterClasses = classes.filter(cls => String(cls.semester_id) === String(activePeriod.id));

      // Map thông tin Course vào Class
      const mappedClasses = currentSemesterClasses.map(cls => {
        const course = courses.find(co => co.course_id === cls.course_id);
        return {
          ...cls,
          course_code: course ? course.course_code : 'N/A',
          course_name: course ? course.course_name : 'N/A',
          credit: course ? course.credit : 0
        };
      });

      // Lọc kết quả tìm kiếm theo mã môn hoặc tên môn học
      const filtered = mappedClasses.filter(item => 
        item.course_code.toLowerCase().includes(query) ||
        item.course_name.toLowerCase().includes(query) ||
        item.class_code.toLowerCase().includes(query)
      );

      setSearchResults(filtered);
      if (filtered.length === 0) {
        setSearchMessage('Không tìm thấy lớp môn học nào phù hợp.');
      } else {
        setSearchMessage('');
      }
    } catch (err) {
      console.error('Error searching classes:', err);
      setSearchMessage('Lỗi tìm kiếm lớp học. API /classes hoặc /courses chưa có sẵn.');
    } finally {
      setIsSearching(false);
    }
  };

  // Đăng ký một lớp học (kiểm tra hạn thời gian đăng ký)
  const handleEnroll = async (classId) => {
    if (!isRegistrationPeriodOpen(activePeriod)) {
      showToast('Đã HẾT THỜI GIAN ĐĂNG KÝ môn học! Bạn không thể đăng ký thêm môn học này.', 'error');
      return;
    }

    try {
      await enrollClassAPI(classId);
      showToast('Đăng ký lớp học thành công!', 'success');
      await reloadRegisteredCourses();
    } catch (err) {
      console.error('Enroll error:', err);
      showToast(err.response?.data?.error || 'Đăng ký thất bại. Lớp học có thể đã đầy hoặc API /classes/enroll chưa được backend cấu hình.', 'error');
    }
  };

  // Hủy đăng ký một lớp học (CHỈ CHO PHÉP TRONG THỜI GIAN ĐĂNG KÝ)
  const handleUnenroll = async (classId) => {
    if (!isRegistrationPeriodOpen(activePeriod)) {
      showToast('Đã HẾT THỜI GIAN ĐĂNG KÝ môn học! Bạn không thể hủy hoặc xóa môn học này.', 'error');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn hủy đăng ký lớp học này?')) return;
    try {
      await unenrollClassAPI(classId);
      showToast('Hủy đăng ký lớp học thành công!', 'info');
      await reloadRegisteredCourses();
    } catch (err) {
      console.error('Unenroll error:', err);
      showToast(err.response?.data?.error || 'Hủy đăng ký thất bại. Vui lòng thử lại sau.', 'error');
    }
  };

  // Lọc danh sách môn đã đăng ký hiển thị theo học kỳ đang active
  const activeRegisteredCourses = registeredCourses.filter(cls => 
    activePeriod && String(cls.semester_id) === String(activePeriod.id)
  );

  const isPeriodOpen = isRegistrationPeriodOpen(activePeriod);

  if (isLoading && periods.length === 0) {
    return <div className="cr-loading">Đang tải thông tin đợt đăng ký...</div>;
  }

  // Render màn hình Danh sách đợt đăng ký
  if (!activePeriod) {
    return (
      <div className="cr-layout">
        <nav className="cr-top-nav">
          <div className="nav-brand-box" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            myBH
          </div>
          <div className="cr-nav-title">Đăng ký môn học</div>
          <div className="cr-logout-wrapper" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="nav-home-btn" 
              onClick={() => navigate('/')} 
              style={{ background: '#008b44', color: '#fff', border: 'none', borderRadius: '0px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
            >
              Trang chủ
            </button>
            <button className="nav-logout-btn" onClick={handleLogout} style={{ borderRadius: '0px' }}>Đăng xuất</button>
          </div>
        </nav>
        <div className="cr-main-content">
          {error && <div className="cr-error-banner">{error}</div>}
          <div className="cr-card">
            <h2>DANH SÁCH ĐỢT ĐĂNG KÝ MÔN HỌC</h2>
            <table className="cr-table mt-15">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Đợt Đăng ký</th>
                  <th>Thời gian đăng ký</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {periods.length > 0 ? (
                  periods.map((period, index) => {
                    const open = isRegistrationPeriodOpen(period);
                    return (
                      <tr key={period.id}>
                        <td>{index + 1}</td>
                        <td>
                          <strong>{period.id}</strong>
                          <br/>
                          <span className="cr-text-small">{period.name}</span>
                        </td>
                        <td>{period.startDate} - {period.endDate}</td>
                        <td>
                          <span style={{ 
                            fontWeight: 'bold', 
                            color: open ? '#008b44' : '#e53e3e',
                            background: open ? '#e6f4ea' : '#fff5f5',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}>
                            {open ? 'Đang mở' : 'Đã kết thúc'}
                          </span>
                        </td>
                        <td>
                          <button className="cr-btn-primary" onClick={() => setActivePeriod(period)}>
                            Vào đăng ký
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="empty-message">Hiện tại chưa có đợt đăng ký môn học nào mở.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Render màn hình Chi tiết 1 đợt đăng ký
  return (
    <div className="cr-layout">
      {/* Header màu xanh của đợt */}
      <div className="cr-period-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="cr-back-btn" onClick={() => {
            setActivePeriod(null);
            setSearchResults([]);
            setSearchQuery('');
            setSearchMessage('Nhập mã hoặc tên môn học để tìm kiếm lớp đăng ký.');
          }}>🔙 Trở về</button>
          <span className="cr-period-title" style={{ marginLeft: '15px' }}>
            ĐĂNG KÝ/ HIỆU CHỈNH ({activePeriod.id}) {activePeriod.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="nav-home-btn" 
            onClick={() => navigate('/')} 
            style={{ background: '#ffffff', color: '#008b44', border: 'none', borderRadius: '0px', padding: '6px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
          >
            Trang chủ
          </button>
          <button className="nav-logout-btn" onClick={handleLogout} style={{ borderRadius: '0px' }}>Đăng xuất</button>
        </div>
      </div>

      <div className="cr-main-content">
        <div className="cr-detail-grid">
          
          {/* Cột trái: Lịch đăng ký */}
          <div className="cr-left-panel">
            <h3 className="cr-panel-title">Lịch đăng ký</h3>
            <table className="cr-table cr-table-small">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Từ ngày</th>
                  <th>Đến ngày</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ color: isPeriodOpen ? '#008b44' : '#e53e3e', fontWeight: 'bold' }}>
                    {isPeriodOpen ? '✔' : '✖'}
                  </td>
                  <td>{activePeriod.startDate}</td>
                  <td>{activePeriod.endDate}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cột phải: Chọn môn học & Tìm kiếm */}
          <div className="cr-right-panel">
            <h3 className="cr-panel-title">Chọn môn học đăng ký</h3>
            <div className="cr-search-wrapper">
              <input 
                type="text" 
                className="cr-search-input" 
                placeholder="Mã môn học/Tên môn học (Ví dụ: CO3015, Giải tích 1,...)" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              <button className="cr-search-btn" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? '...' : '🔍'}
              </button>
            </div>
            
            {searchMessage && <p className="cr-search-msg">{searchMessage}</p>}

            {/* Hiển thị kết quả tìm kiếm lớp học */}
            {searchResults.length > 0 && (
              <div className="cr-search-results mt-15">
                <table className="cr-table cr-table-small">
                  <thead>
                    <tr>
                      <th>Mã lớp</th>
                      <th>Mã môn</th>
                      <th>Tên môn học</th>
                      <th>Số TC</th>
                      <th>Sĩ số</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map(cls => {
                      const isAlreadyEnrolled = registeredCourses.some(rc => rc.class_id === cls.class_id);
                      return (
                        <tr key={cls.class_id}>
                          <td><strong>{cls.class_code}</strong></td>
                          <td>{cls.course_code}</td>
                          <td>{cls.course_name}</td>
                          <td>{cls.credit}</td>
                          <td>{cls.current_student} / {cls.max_student}</td>
                          <td>
                            {isAlreadyEnrolled ? (
                              <button className="cr-btn-disabled" disabled>Đã đăng ký</button>
                            ) : !isPeriodOpen ? (
                              <button className="cr-btn-disabled" disabled title="Đã hết thời hạn đăng ký môn học">Hết hạn đăng ký</button>
                            ) : (
                              <button 
                                className="cr-btn-primary cr-btn-small" 
                                onClick={() => handleEnroll(cls.class_id)}
                                disabled={cls.current_student >= cls.max_student}
                              >
                                {cls.current_student >= cls.max_student ? 'Đầy' : 'Đăng ký'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Phiếu đăng ký (nằm dưới cùng) */}
        <div className="cr-card mt-20">
          <h3 className="cr-panel-title">Phiếu đăng ký (Đã đăng ký thành công học kỳ {activePeriod.id})</h3>
          <table className="cr-table">
            <thead>
              <tr>
                <th>Mã MH</th>
                <th>Tên môn học</th>
                <th>Nhóm/Tổ</th>
                <th>Số TC</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {activeRegisteredCourses.length > 0 ? (
                activeRegisteredCourses.map((course, idx) => (
                  <tr key={course.class_id || idx}>
                    <td>{course.course_code || course.maMH}</td>
                    <td>{course.course_name || course.tenMH}</td>
                    <td>{course.class_code || course.nhom}</td>
                    <td>{course.credit || course.tinChi}</td>
                    <td>
                      {isPeriodOpen ? (
                        <button className="cr-btn-danger" onClick={() => handleUnenroll(course.class_id)}>
                          Xóa
                        </button>
                      ) : (
                        <button 
                          className="cr-btn-disabled" 
                          disabled 
                          title="Đã hết thời gian đăng ký. Không thể hủy hoặc xóa môn học."
                          style={{ opacity: 0.6, cursor: 'not-allowed', backgroundColor: '#a0aec0', color: '#fff', padding: '4px 10px', border: 'none', borderRadius: '4px' }}
                        >
                          Hết hạn xóa
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-message">Bạn chưa đăng ký môn học nào trong học kỳ này.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CourseRegistration;
