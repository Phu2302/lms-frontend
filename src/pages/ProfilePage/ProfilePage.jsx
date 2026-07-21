import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import { getUserProfileAPI } from '../../api/StudentInfo/Profile/users';
import { useToast } from '../../components/Toast/ToastContext';
import './ProfilePage.css';

function ProfilePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Hồ sơ cá nhân - BK LMS';
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getUserProfileAPI();
      setProfile(res.data);
    } catch (err) {
      console.error('Lỗi tải thông tin cá nhân:', err);
      setError('Không thể tải thông tin hồ sơ cá nhân. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const r = String(role || '1');
    if (r === '2') return { text: 'Giảng viên', bg: '#2b6cb0' };
    if (r === '3') return { text: 'Quản trị viên', bg: '#805ad5' };
    return { text: 'Sinh viên', bg: '#008b44' };
  };

  const roleBadge = getRoleLabel(profile?.role);

  return (
    <div className="profile-page-container">
      <Header view="profile" />

      <div className="profile-page-body">
        <button className="back-btn-modern" onClick={() => navigate(-1)}>
          ← Quay lại
        </button>

        <div className="profile-main-card">
          <div className="profile-card-header-gradient">
            <h2>Hồ Sơ Cá Nhân</h2>
            <span className="subtitle">Thông tin tài khoản hệ thống BK LMS</span>
          </div>

          {loading && (
            <div className="profile-state-box">
              ⏳ Đang tải dữ liệu hồ sơ...
            </div>
          )}

          {error && (
            <div className="profile-error-box">
              {error}
              <br />
              <button onClick={fetchProfileData} className="retry-btn-modern">
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && profile && (
            <div className="profile-card-content">
              {/* Vùng Avatar & Tóm tắt */}
              <div className="profile-header-section">
                <div className="profile-avatar-circle" style={{ backgroundColor: roleBadge.bg }}>
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Avatar" className="profile-avatar-img" />
                  ) : (
                    <span>
                      {profile.first_name
                        ? profile.first_name.substring(0, 2).toUpperCase()
                        : (profile.user_name || 'U').substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="profile-header-info">
                  <h3 className="profile-user-fullname">
                    {profile.last_name && profile.first_name
                      ? `${profile.last_name} ${profile.first_name}`
                      : profile.user_name || 'Người dùng'}
                  </h3>
                  <div className="profile-header-meta">
                    <span className="role-tag-badge" style={{ backgroundColor: roleBadge.bg }}>
                      {roleBadge.text}
                    </span>
                    <span className="user-id-tag">Mã ID: {profile.user_id}</span>
                  </div>
                </div>
              </div>

              <hr className="profile-divider" />

              {/* Lưới Thông tin chi tiết */}
              <div className="profile-sections-grid">
                {/* Khối 1: Thông tin cơ bản */}
                <div className="profile-section-block">
                  <h4 className="section-block-title">📌 Thông tin cơ bản</h4>
                  <div className="profile-info-list">
                    <div className="profile-info-row">
                      <span className="info-label">Tên tài khoản:</span>
                      <span className="info-val">{profile.user_name || 'N/A'}</span>
                    </div>

                    <div className="profile-info-row">
                      <span className="info-label">Họ và tên lót:</span>
                      <span className="info-val">{profile.last_name || 'N/A'}</span>
                    </div>

                    <div className="profile-info-row">
                      <span className="info-label">Tên:</span>
                      <span className="info-val">{profile.first_name || 'N/A'}</span>
                    </div>

                    <div className="profile-info-row">
                      <span className="info-label">Ngày sinh:</span>
                      <span className="info-val">{profile.date_of_birth || 'N/A'}</span>
                    </div>

                    <div className="profile-info-row">
                      <span className="info-label">Giới tính:</span>
                      <span className="info-val">{profile.gender || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Khối 2: Liên hệ & Quản lý */}
                <div className="profile-section-block">
                  <h4 className="section-block-title">📬 Liên hệ & Tổ chức</h4>
                  <div className="profile-info-list">
                    <div className="profile-info-row">
                      <span className="info-label">Email:</span>
                      <span className="info-val">{profile.email || 'N/A'}</span>
                    </div>

                    <div className="profile-info-row">
                      <span className="info-label">Số điện thoại:</span>
                      <span className="info-val">{profile.phone_num || 'N/A'}</span>
                    </div>

                    <div className="profile-info-row">
                      <span className="info-label">Địa chỉ / Quê quán:</span>
                      <span className="info-val">{profile.address || 'N/A'}</span>
                    </div>

                    <div className="profile-info-row">
                      <span className="info-label">Khoa / Đơn vị:</span>
                      <span className="info-val">{profile.faculty_name || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Khối 3: Thông tin Đào tạo (nếu có) */}
                {(String(profile.role) === '1' || profile.class_name || profile.major) && (
                  <div className="profile-section-block full-width-block">
                    <h4 className="section-block-title">🎓 Thông tin Đào tạo / Học tập</h4>
                    <div className="profile-info-grid-2col">
                      <div className="profile-info-row">
                        <span className="info-label">Lớp danh nghĩa:</span>
                        <span className="info-val">{profile.class_name || 'N/A'}</span>
                      </div>

                      <div className="profile-info-row">
                        <span className="info-label">Khóa học:</span>
                        <span className="info-val">{profile.enrollment_year || 'N/A'}</span>
                      </div>

                      <div className="profile-info-row">
                        <span className="info-label">Ngành học:</span>
                        <span className="info-val">{profile.major || 'N/A'}</span>
                      </div>

                      <div className="profile-info-row">
                        <span className="info-label">Bậc đào tạo:</span>
                        <span className="info-val">{profile.education_level || 'Đại học chính quy'}</span>
                      </div>

                      <div className="profile-info-row">
                        <span className="info-label">Trạng thái:</span>
                        <span className="info-val status-text">{profile.status || 'Đang học'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
