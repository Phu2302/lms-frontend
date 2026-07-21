import React from 'react';
import './AnnouncementBanner.css';

/**
 * AnnouncementBanner — hiển thị khối thông báo lớp học phía trên CourseDetail.
 * Props:
 *  - announcements: array
 *  - hasEditingPrivileges: boolean
 *  - onAddClick: fn
 *  - onDelete: fn(id)
 */
function AnnouncementBanner({ announcements, hasEditingPrivileges, onAddClick, onDelete }) {
  return (
    <div className="announcement-banner">
      <div className="announcement-banner-header">
        <h3 className="announcement-banner-title">📢 THÔNG BÁO LỚP HỌC</h3>
        {hasEditingPrivileges && (
          <button className="announcement-add-btn" onClick={onAddClick}>
            + Tạo thông báo mới
          </button>
        )}
      </div>

      {announcements.length > 0 ? (
        <div className="announcement-list">
          {announcements.map((anc) => (
            <div key={anc.announcement_id} className="announcement-card">
              <div className="announcement-card-header">
                <strong className="announcement-card-title">{anc.title}</strong>
                <div className="announcement-card-meta">
                  <span className="announcement-card-author">
                    {anc.author_name || 'Giảng viên'} -{' '}
                    {anc.created_at ? new Date(anc.created_at).toLocaleDateString('vi-VN') : ''}
                  </span>
                  {hasEditingPrivileges && (
                    <button
                      className="announcement-delete-btn"
                      onClick={() => onDelete(anc.announcement_id)}
                    >
                      ✕ Xóa
                    </button>
                  )}
                </div>
              </div>
              <p className="announcement-card-content">{anc.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="announcement-empty">Chưa có thông báo mới cho lớp học này.</p>
      )}
    </div>
  );
}

export default AnnouncementBanner;
