import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../../components/Toast/ToastContext';
import './ChapterTab.css';

/**
 * Extract YouTube embed URL from various YouTube link formats
 */
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
  }
  return null;
};

/**
 * ChapterTab — Tab "Khóa học" trong CourseDetail.
 * Hiển thị danh sách chapters dạng Accordion với Materials, Quizzes, Forums.
 */
function ChapterTab({
  courseId,
  chapters,
  openSections,
  hasEditingPrivileges,
  onToggleSection,
  onAddChapter,
  onDeleteItem,
  onOpenEditMaterial,
}) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [activeVideo, setActiveVideo] = useState(null);

  const handleMaterialClick = (mat) => {
    const fileName = mat.title || mat.material_name || 'TaiLieu_BaiGiang.pdf';
    const linkStr = mat.content_link || '';

    // 1. Kiểm tra nếu là Video YouTube
    const embedUrl = getYouTubeEmbedUrl(linkStr);
    if (embedUrl || mat.material_type === 'VIDEO') {
      setActiveVideo({
        title: fileName,
        originalUrl: linkStr,
        embedUrl: embedUrl || linkStr
      });
      return;
    }

    // 2. Kiểm tra xem file có lưu trong đệm bộ nhớ localStorage theo bất kỳ tên key nào không
    let extractedName = '';
    if (linkStr.includes('/files/')) {
      extractedName = decodeURIComponent(linkStr.split('/files/')[1] || '');
    }

    const matId = mat.material_id || mat.id;
    const savedDataUrl = 
      (matId && localStorage.getItem(`lms_material_id_${matId}`)) ||
      (extractedName && localStorage.getItem(`lms_file_${extractedName}`)) ||
      (extractedName && localStorage.getItem(`lms_file_${encodeURIComponent(extractedName)}`)) ||
      localStorage.getItem(`lms_file_${fileName}`) ||
      localStorage.getItem(`lms_file_${encodeURIComponent(fileName)}`) ||
      (mat.title && localStorage.getItem(`lms_file_${mat.title}`)) ||
      (mat.material_name && localStorage.getItem(`lms_file_${mat.material_name}`)) ||
      localStorage.getItem('lms_file_last_uploaded');

    if (savedDataUrl) {
      triggerFileDownload(savedDataUrl, extractedName || fileName);
      return;
    }

    if (linkStr.startsWith('data:')) {
      triggerFileDownload(linkStr, fileName);
      return;
    }

    if (linkStr.startsWith('http://') || linkStr.startsWith('https://')) {
      window.open(linkStr, '_blank');
      return;
    }

    // 4. Nếu tài liệu chưa được Upload đính kèm file thật
    if (hasEditingPrivileges) {
      showToast(`Tài liệu "${fileName}" chưa đính kèm file gốc. Giảng viên hãy bấm nút "✏️ Sửa" để Upload file từ máy tính.`, 'info');
    } else {
      showToast(`Giảng viên chưa đính kèm file tài liệu thực tế cho "${fileName}".`, 'info');
    }
  };

  const triggerFileDownload = (url, name) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Đã tải xuống tài liệu: ${name}`, 'success');
  };

  return (
    <div className="accordion-wrapper">
      {hasEditingPrivileges && (
        <div className="teacher-chapter-actions">
          <button className="add-chapter-btn" onClick={onAddChapter}>
            + Thêm chương học mới
          </button>
        </div>
      )}

      {chapters.length === 0 && (
        <div className="chapter-empty-state">
          📭 Chưa có chương học nào cho lớp này.
        </div>
      )}

      {chapters.map((chapter, index) => (
        <div key={chapter.chapter_id || chapter.id || index} className="accordion-item">
          {/* Header Chương */}
          <div
            className="accordion-header flex-row-justify"
            onClick={() => onToggleSection(index)}
          >
            <div className="accordion-header-left">
              <span className={`accordion-arrow ${openSections[index] ? 'open' : ''}`}>
                ▶
              </span>
              <span className="accordion-title font-bold">
                {chapter.chapter_name || chapter.name || `Chương ${index + 1}`}
              </span>
            </div>

            {hasEditingPrivileges && (
              <div className="accordion-header-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="delete-item-btn-small"
                  onClick={(e) => onDeleteItem(e, 'chapter', chapter.chapter_id || chapter.id)}
                  title="Xóa chương"
                >
                  🗑️ Xóa chương
                </button>
              </div>
            )}
          </div>

          {/* Body Chương (Nội dung bài học) */}
          {openSections[index] && (
            <div className="accordion-content">
              {hasEditingPrivileges && (
                <div className="add-sub-items-bar">
                  <button
                    className="add-sub-btn"
                    onClick={() =>
                      navigate(
                        `/lms/course/${courseId}/chapter/${chapter.chapter_id}/add-material?order=${chapter.chapter_order || 1}`
                      )
                    }
                  >
                    + Thêm Học liệu (Tài liệu / Video)
                  </button>
                  <button
                    className="add-sub-btn"
                    onClick={() =>
                      navigate(
                        `/lms/course/${courseId}/chapter/${chapter.chapter_id}/add-quiz`
                      )
                    }
                  >
                    + Thêm Bài kiểm tra (Quiz)
                  </button>
                  <button
                    className="add-sub-btn"
                    onClick={() =>
                      navigate(
                        `/lms/course/${courseId}/chapter/${chapter.chapter_id}/add-forum`
                      )
                    }
                  >
                    + Thêm Diễn đàn thảo luận
                  </button>
                </div>
              )}

              {/* Materials */}
              {(chapter.materials || []).map((mat, mi) => (
                <div
                  key={mi}
                  className="content-row flex-row-justify"
                  onClick={() => handleMaterialClick(mat)}
                >
                  <div className="content-row-left">
                    <span className="content-icon">
                      {mat.material_type === 'VIDEO' ? '🎥' : '📄'}
                    </span>
                    <span>{mat.material_name || mat.title || 'Tài liệu'}</span>
                    {mat.material_type === 'VIDEO' && (
                      <span style={{ fontSize: '11px', color: '#008b44', marginLeft: '6px', fontWeight: 'bold' }}>
                        (Xem trực tiếp)
                      </span>
                    )}
                  </div>
                  {hasEditingPrivileges && (
                    <div className="content-row-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="edit-item-btn-small"
                        onClick={(e) => onOpenEditMaterial(e, mat)}
                        title="Sửa học liệu"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="delete-item-btn-small"
                        onClick={(e) => onDeleteItem(e, 'material', mat.material_id || mat.id)}
                        title="Xóa tài liệu"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Quizzes */}
              {(chapter.quizzes || []).map((quiz, qi) => (
                <div
                  key={qi}
                  className="content-row flex-row-justify"
                  onClick={() =>
                    navigate(
                      `/lms/course/${courseId}/chapter/${chapter.chapter_id}/quiz/${quiz.quiz_id || quiz.id}`
                    )
                  }
                >
                  <div className="content-row-left">
                    <span className="content-icon">✏️</span>
                    <span>{quiz.quiz_title || quiz.title || 'Bài kiểm tra'}</span>
                  </div>
                  {hasEditingPrivileges && (
                    <div className="content-row-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="delete-item-btn-small"
                        onClick={(e) => onDeleteItem(e, 'quiz', quiz.quiz_id || quiz.id)}
                        title="Xóa quiz"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Forums */}
              {(chapter.forums || []).map((forum, fi) => (
                <div
                  key={fi}
                  className="content-row flex-row-justify"
                  onClick={() =>
                    navigate(
                      `/lms/course/${courseId}/chapter/${chapter.chapter_id}/forum/${forum.forum_id || forum.id}`
                    )
                  }
                >
                  <div className="content-row-left">
                    <span className="content-icon">💬</span>
                    <span>{forum.title || forum.forum_title || 'Diễn đàn thảo luận'}</span>
                  </div>
                  {hasEditingPrivileges && (
                    <div className="content-row-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="delete-item-btn-small"
                        onClick={(e) => onDeleteItem(e, 'forum', forum.forum_id || forum.id)}
                        title="Xóa forum"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {(!chapter.materials?.length &&
                !chapter.quizzes?.length &&
                !chapter.forums?.length) && (
                <div className="empty-sub-content">
                  Chưa có nội dung nào trong chương này.
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Modern Video Player Modal */}
      {activeVideo && (
        <div className="video-modal-overlay" onClick={() => setActiveVideo(null)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h3 className="video-modal-title">
                🎥 {activeVideo.title}
              </h3>
              <button 
                className="video-modal-close-btn" 
                onClick={() => setActiveVideo(null)}
                title="Đóng video"
              >
                ×
              </button>
            </div>
            
            <div className="video-player-container">
              <iframe
                src={activeVideo.embedUrl}
                title={activeVideo.title}
                className="video-player-iframe"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            <div className="video-modal-footer">
              <a 
                href={activeVideo.originalUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="video-open-external-btn"
              >
                Mở trong ứng dụng YouTube ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChapterTab;
