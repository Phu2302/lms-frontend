import React from 'react';

/**
 * CourseModals — Tất cả các Dialog/Modal popup dùng trong CourseDetail
 */
export function AddAnnouncementModal({
  show,
  onClose,
  onSubmit,
  title,
  setTitle,
  content,
  setContent,
}) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div className="modal-header">
          <h3>Tạo thông báo lớp học mới</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Tiêu đề thông báo:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề thông báo..."
              required
            />
          </div>
          <div className="form-group">
            <label>Nội dung thông báo:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập nội dung chi tiết thông báo..."
              rows="4"
              required
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="submit" className="confirm-btn">
            Đăng thông báo
          </button>
          <button type="button" className="dismiss-btn" onClick={onClose}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export function AddChapterModal({ show, onClose, onSubmit, chapterName, setChapterName }) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div className="modal-header">
          <h3>Thêm chương học mới</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Tên chương học:</label>
            <input
              type="text"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              placeholder="Nhập tên chương..."
              required
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="submit" className="confirm-btn">
            Thêm chương
          </button>
          <button type="button" className="dismiss-btn" onClick={onClose}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export function AddQuizModal({
  show,
  onClose,
  onSubmit,
  title,
  setTitle,
  openTime,
  setOpenTime,
  deadline,
  setDeadline,
}) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div className="modal-header">
          <h3>Thêm bài Quiz mới</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Tiêu đề bài kiểm tra (Quiz):</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề quiz..."
              required
            />
          </div>
          <div className="form-group">
            <label>Thời gian mở đề (Tùy chọn):</label>
            <input
              type="datetime-local"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Hạn chót nộp bài (Tùy chọn):</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="submit" className="confirm-btn">
            Tạo Quiz
          </button>
          <button type="button" className="dismiss-btn" onClick={onClose}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export function AddForumModal({
  show,
  onClose,
  onSubmit,
  title,
  setTitle,
  description,
  setDescription,
}) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div className="modal-header">
          <h3>Thêm diễn đàn thảo luận mới</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Tiêu đề Diễn đàn:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề diễn đàn..."
              required
            />
          </div>
          <div className="form-group">
            <label>Mô tả ngắn (Mục đích thảo luận):</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả diễn đàn..."
              rows="3"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="submit" className="confirm-btn">
            Tạo Diễn đàn
          </button>
          <button type="button" className="dismiss-btn" onClick={onClose}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export function AddMaterialModal({
  show,
  onClose,
  onSubmit,
  type,
  setType,
  title,
  setTitle,
  link,
  setLink,
}) {
  if (!show) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div className="modal-header">
          <h3>Thêm tài liệu hoặc video mới</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Loại học liệu:</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e0',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="DOCUMENT">📄 Tài liệu (PDF/Word/PowerPoint)</option>
              <option value="VIDEO">🎥 Video bài giảng (Youtube link/Video link)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tiêu đề học liệu:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề học liệu..."
              required
            />
          </div>
          <div className="form-group">
            <label>Đường dẫn liên kết (Link tải/Link xem):</label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://example.com/..."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="submit" className="confirm-btn">
            Thêm học liệu
          </button>
          <button type="button" className="dismiss-btn" onClick={onClose}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditMaterialModal({ show, onClose, onSubmit, editingMaterial, setEditingMaterial }) {
  if (!show || !editingMaterial) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
        <div className="modal-header">
          <h3>Chỉnh sửa học liệu</h3>
          <button type="button" className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Loại học liệu:</label>
            <select
              value={editingMaterial.material_type}
              onChange={(e) =>
                setEditingMaterial({ ...editingMaterial, material_type: e.target.value })
              }
              style={{
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e0',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="DOCUMENT">📄 Tài liệu (PDF/Word/PowerPoint)</option>
              <option value="VIDEO">🎥 Video bài giảng (Youtube link/Video link)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Tiêu đề học liệu:</label>
            <input
              type="text"
              value={editingMaterial.title}
              onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
              placeholder="Nhập tiêu đề học liệu..."
              required
            />
          </div>
          <div className="form-group">
            <label>Đường dẫn liên kết (Link tải/Link xem):</label>
            <input
              type="url"
              value={editingMaterial.content_link}
              onChange={(e) =>
                setEditingMaterial({ ...editingMaterial, content_link: e.target.value })
              }
              placeholder="https://example.com/..."
            />
          </div>
        </div>
        <div className="modal-footer">
          <button type="submit" className="confirm-btn">
            Lưu thay đổi
          </button>
          <button type="button" className="dismiss-btn" onClick={onClose}>
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

export function DeleteConfirmModal({ show, itemToDelete, onClose, onConfirm }) {
  if (!show || !itemToDelete) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header delete-header">
          <h3>Xác nhận xóa</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p>
            Bạn có chắc chắn muốn xóa{' '}
            {itemToDelete.type === 'chapter'
              ? 'chương học'
              : itemToDelete.type === 'quiz'
              ? 'bài Quiz'
              : itemToDelete.type === 'forum'
              ? 'diễn đàn thảo luận'
              : 'tài liệu/video'}{' '}
            này không? Hành động này sẽ xóa vĩnh viễn mục đã chọn và không thể hoàn tác.
          </p>
        </div>
        <div className="modal-footer">
          <button className="confirm-delete-btn" onClick={onConfirm}>
            Xóa vĩnh viễn
          </button>
          <button className="dismiss-btn" onClick={onClose}>
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
}

export function QuizDetailsModal({ selectedStudent, studentQuizDetails, onClose }) {
  if (!selectedStudent) return null;
  const details = studentQuizDetails[selectedStudent.id] || [];
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px', width: '90%' }}>
        <h2>
          Chi tiết điểm Quiz của sinh viên: {selectedStudent.name} ({selectedStudent.id})
        </h2>

        <div style={{ marginTop: '20px', marginBottom: '20px' }}>
          {details.length > 0 ? (
            <table className="student-data-table">
              <thead>
                <tr>
                  <th>Tên Quiz</th>
                  <th>Điểm đạt được</th>
                  <th>Tổng điểm (Quiz)</th>
                  <th>Thời gian nộp</th>
                </tr>
              </thead>
              <tbody>
                {details.map((detail, idx) => (
                  <tr key={idx}>
                    <td>{detail.title}</td>
                    <td style={{ fontWeight: 'bold' }}>{detail.achieved_score}</td>
                    <td>{detail.max_score}</td>
                    <td>
                      {detail.entry_start_time
                        ? new Date(detail.entry_start_time).toLocaleString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#718096', textAlign: 'center' }}>
              Sinh viên này chưa làm bài quiz nào.
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              borderRadius: '4px',
              border: '1px solid #ccc',
              background: '#fff',
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
