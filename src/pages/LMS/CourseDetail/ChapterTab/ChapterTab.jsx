import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../../components/Toast/ToastContext';
import './ChapterTab.css';

/**
 * ChapterTab — Tab "Khóa học" trong CourseDetail.
 * Hiển thị danh sách chapters dạng Accordion với Materials, Quizzes, Forums.
 *
 * Props:
 *  - courseId: string | number
 *  - chapters: array
 *  - openSections: array<boolean>
 *  - hasEditingPrivileges: boolean
 *  - onToggleSection: fn(index)
 *  - onAddChapter: fn
 *  - onDeleteItem: fn(e, type, id)
 *  - onOpenEditMaterial: fn(e, mat)
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
          {/* Header accordion */}
          <div className="accordion-header" onClick={() => onToggleSection(index)}>
            <div className="accordion-header-left">
              <span className={`accordion-arrow ${openSections[index] !== false ? 'open' : 'closed'}`}>
                {openSections[index] !== false ? '▼' : '▶'}
              </span>
              <span className="accordion-title">
                {chapter.chapter_name || chapter.title || `Chương ${index + 1}`}
              </span>
            </div>
            {hasEditingPrivileges && (
              <button
                className="delete-chapter-btn"
                onClick={(e) => onDeleteItem(e, 'chapter', chapter.chapter_id)}
                title="Xóa chương này"
              >
                🗑️ Xóa chương
              </button>
            )}
          </div>

          {/* Nội dung accordion */}
          {openSections[index] !== false && (
            <div className="accordion-content">
              {hasEditingPrivileges && (
                <div className="teacher-item-actions">
                  <button
                    className="add-item-btn"
                    onClick={() =>
                      navigate(
                        `/lms/course/${courseId}/chapter/${chapter.chapter_id}/add-material?order=${chapter.chapter_order || 1}`
                      )
                    }
                  >
                    + Thêm Tài liệu/Video
                  </button>
                  <button
                    className="add-item-btn"
                    onClick={() =>
                      navigate(`/lms/course/${courseId}/chapter/${chapter.chapter_id}/add-quiz`)
                    }
                  >
                    + Thêm bài Quiz
                  </button>
                  <button
                    className="add-item-btn"
                    onClick={() =>
                      navigate(`/lms/course/${courseId}/chapter/${chapter.chapter_id}/add-forum`)
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
                  onClick={() => {
                    if (mat.content_link) {
                      window.open(mat.content_link, '_blank');
                    } else {
                      showToast(`Đang mở tài liệu: ${mat.material_name || mat.title}`, 'info');
                    }
                  }}
                >
                  <div className="content-row-left">
                    <span className="content-icon">
                      {mat.material_type === 'VIDEO' ? '🎥' : '📄'}
                    </span>
                    <span>{mat.material_name || mat.title || 'Tài liệu'}</span>
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
                  onClick={() => navigate(`/lms/quiz/${quiz.quiz_id || quiz.id}`)}
                >
                  <div className="content-row-left">
                    <span className="content-icon">📝</span>
                    <span>{quiz.quiz_name || quiz.title || 'Quiz'}</span>
                  </div>
                  {hasEditingPrivileges && (
                    <div className="content-row-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="edit-item-btn-small"
                        onClick={() =>
                          navigate(`/lms/course/${courseId}/quiz/${quiz.quiz_id || quiz.id}/edit`)
                        }
                        title="Sửa Quiz"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="delete-item-btn-small"
                        onClick={(e) => onDeleteItem(e, 'quiz', quiz.quiz_id || quiz.id)}
                        title="Xóa Quiz"
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
                    navigate(`/lms/course/${courseId}/forum/${forum.forum_id || forum.id}`)
                  }
                >
                  <div className="content-row-left">
                    <span className="content-icon">💬</span>
                    <span>{forum.forum_name || forum.title || 'Forum'}</span>
                  </div>
                  {hasEditingPrivileges && (
                    <button
                      className="delete-item-btn-small"
                      onClick={(e) => onDeleteItem(e, 'forum', forum.forum_id || forum.id)}
                      title="Xóa diễn đàn"
                    >
                      🗑️ Xóa
                    </button>
                  )}
                </div>
              ))}

              {/* Assignments */}
              {(chapter.assignments || []).map((assign, ai) => (
                <div
                  key={ai}
                  className="content-row"
                  onClick={() =>
                    navigate(`/lms/assignment/${assign.assignment_id || assign.id}`)
                  }
                >
                  <span className="content-icon">📤</span>
                  <span>{assign.assignment_name || assign.title || 'Bài tập'}</span>
                </div>
              ))}

              {/* Chương trống */}
              {!(
                chapter.materials?.length ||
                chapter.quizzes?.length ||
                chapter.forums?.length ||
                chapter.assignments?.length
              ) && (
                <div className="empty-content-text">
                  Chưa có tài liệu hoặc hoạt động nào cho chương này.
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ChapterTab;
