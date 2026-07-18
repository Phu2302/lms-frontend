import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClassDetailAPI } from '../../../api/LMS/CourseDetail/classes';
import { createChapterAPI, deleteChapterAPI } from '../../../api/LMS/CourseDetail/chapters';
import { createQuizAPI, deleteQuizAPI } from '../../../api/LMS/CourseDetail/quizzes';
import { createForumAPI, deleteForumAPI } from '../../../api/LMS/CourseDetail/forums';
import { createMaterialAPI, deleteMaterialAPI } from '../../../api/LMS/CourseDetail/materials';
import Header from '../../../components/Header/Header';
import './CourseDetail.css';

function CourseDetail() {
  const { courseId } = useParams(); // Lấy mã môn học từ URL (ví dụ: CO3005)
  const navigate = useNavigate();

  // State quản lý Tab nào đang bật (mặc định là 'khoahoc')
  const [activeTab, setActiveTab] = useState('khoahoc');

  // State dữ liệu từ API
  const [classData, setClassData] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State quản lý trạng thái đóng/mở của các Accordion
  const [openSections, setOpenSections] = useState([]);

  // Quyền chỉnh sửa của giảng viên sở hữu lớp hoặc admin
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  const currentUserId = currentUser?.user_id;
  const userRole = currentUser?.role ? String(currentUser.role) : '1';
  
  const isTeacher = userRole === '2';
  const isOwner = classData?.class?.owner_id === currentUserId;
  const isAdmin = userRole === '3';
  const hasEditingPrivileges = (isTeacher && isOwner) || isAdmin;

  // Add Chapter state
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [newChapterName, setNewChapterName] = useState('');

  // Add Quiz state
  const [showAddQuizModal, setShowAddQuizModal] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState(null);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizOpenTime, setNewQuizOpenTime] = useState('');
  const [newQuizDeadline, setNewQuizDeadline] = useState('');

  // Add Forum state
  const [showAddForumModal, setShowAddForumModal] = useState(false);
  const [newForumTitle, setNewForumTitle] = useState('');
  const [newForumDescription, setNewForumDescription] = useState('');

  // Add Material state
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialType, setNewMaterialType] = useState('DOCUMENT');
  const [newMaterialLink, setNewMaterialLink] = useState('');

  // Delete state
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'chapter'|'quiz'|'forum'|'material', id: number }
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Gọi API lấy chi tiết class khi component mount
  useEffect(() => {
    fetchClassDetail();
  }, [courseId]);

  const fetchClassDetail = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getClassDetailAPI(courseId);
      const data = res.data;
      
      setClassData(data);
      
      // Extract chapters từ response
      const chapterList = data.chapters || data.Chapters || [];
      const materials = data.materials || data.Materials || [];
      const quizzes = data.quizzes || data.Quizzes || [];
      const forums = data.forums || data.Forums || [];
      
      // Map materials, quizzes, forums to their corresponding chapter
      const chaptersWithContent = chapterList.map(chapter => {
        const chapterId = Number(chapter.chapter_id);
        return {
          ...chapter,
          materials: materials.filter(m => Number(m.chapter_id) === chapterId),
          quizzes: quizzes.filter(q => Number(q.chapter_id) === chapterId),
          forums: forums.filter(f => Number(f.chapter_id) === chapterId),
          assignments: []
        };
      });

      setChapters(chaptersWithContent);
      
      // Mở accordion đầu tiên, đóng các cái khác
      setOpenSections(chapterList.map((_, i) => i === 0));
    } catch (err) {
      console.error('Lỗi tải chi tiết lớp học:', err);
      const status = err.response?.status;
      if (status === 403) {
        setError('Bạn không có quyền truy cập lớp học này.');
      } else if (status === 404) {
        setError('Không tìm thấy lớp học này.');
      } else {
        setError('Không thể tải chi tiết lớp học. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Hàm đảo ngược trạng thái đóng/mở khi click vào Header của Accordion
  const toggleSection = (index) => {
    const updatedSections = [...openSections];
    updatedSections[index] = !updatedSections[index];
    setOpenSections(updatedSections);
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!newChapterName.trim()) return;
    try {
      await createChapterAPI({
        class_id: Number(courseId),
        chapter_name: newChapterName.trim(),
        chapter_order: chapters.length + 1
      });
      setNewChapterName('');
      setShowAddChapterModal(false);
      fetchClassDetail();
    } catch (err) {
      console.error('Error creating chapter:', err);
      alert(err.response?.data?.error || 'Không thể tạo chương mới. Vui lòng thử lại.');
    }
  };

  const handleAddQuiz = async (e) => {
    e.preventDefault();
    if (!newQuizTitle.trim() || !targetChapterId) return;
    try {
      await createQuizAPI({
        chapter_id: Number(targetChapterId),
        class_id: Number(courseId),
        title: newQuizTitle.trim(),
        open_time: newQuizOpenTime ? new Date(newQuizOpenTime).toISOString() : undefined,
        deadline_time: newQuizDeadline ? new Date(newQuizDeadline).toISOString() : undefined
      });
      setNewQuizTitle('');
      setNewQuizOpenTime('');
      setNewQuizDeadline('');
      setTargetChapterId(null);
      setShowAddQuizModal(false);
      fetchClassDetail();
    } catch (err) {
      console.error('Error creating quiz:', err);
      alert(err.response?.data?.error || 'Không thể tạo quiz mới. Vui lòng thử lại.');
    }
  };

  const handleAddForum = async (e) => {
    e.preventDefault();
    if (!newForumTitle.trim() || !targetChapterId) return;
    try {
      await createForumAPI({
        chapter_id: Number(targetChapterId),
        title: newForumTitle.trim(),
        description: newForumDescription.trim()
      });
      setNewForumTitle('');
      setNewForumDescription('');
      setTargetChapterId(null);
      setShowAddForumModal(false);
      fetchClassDetail();
    } catch (err) {
      console.error('Error creating forum:', err);
      alert(err.response?.data?.error || 'Không thể tạo diễn đàn thảo luận mới. Vui lòng thử lại.');
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterialTitle.trim() || !targetChapterId) return;

    const targetChapter = chapters.find(c => Number(c.chapter_id) === Number(targetChapterId));
    const chapterOrder = targetChapter ? targetChapter.chapter_order : 1;

    try {
      await createMaterialAPI({
        chapter_id: Number(targetChapterId),
        class_id: Number(courseId),
        title: newMaterialTitle.trim(),
        material_type: newMaterialType,
        content_link: newMaterialLink.trim() || undefined,
        chapter_order: chapterOrder
      });
      setNewMaterialTitle('');
      setNewMaterialType('DOCUMENT');
      setNewMaterialLink('');
      setTargetChapterId(null);
      setShowAddMaterialModal(false);
      fetchClassDetail();
    } catch (err) {
      console.error('Error creating material:', err);
      alert(err.response?.data?.error || 'Không thể tạo học liệu mới. Vui lòng thử lại.');
    }
  };

  const confirmDelete = (e, type, id) => {
    e.stopPropagation();
    setItemToDelete({ type, id });
    setShowDeleteConfirm(true);
  };

  const executeDelete = async () => {
    if (!itemToDelete) return;
    const { type, id } = itemToDelete;
    try {
      if (type === 'chapter') {
        await deleteChapterAPI(id);
      } else if (type === 'quiz') {
        await deleteQuizAPI(id);
      } else if (type === 'forum') {
        await deleteForumAPI(id);
      } else if (type === 'material') {
        await deleteMaterialAPI(id);
      }
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      fetchClassDetail();
    } catch (err) {
      console.error(`Error deleting ${type}:`, err);
      alert(err.response?.data?.error || `Không thể xóa ${type}. Vui lòng thử lại.`);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  // Lấy tên class để hiển thị
  const className = classData?.class?.course_name || classData?.class_name || classData?.course_name || `Lớp học ${courseId}`;

  return (
    <div className="course-detail-container">
      
      {/* TẬN DỤNG LẠI THANH NAVBAR NGANG TRÊN CÙNG ĐỂ ĐỒ ÁN ĐỒNG BỘ */}
      <Header view="courses" />

      {/* NỘI DUNG CHI TIẾT LỚP HỌC */}
      <div className="course-detail-body">
        
        {/* Nút quay lại danh sách nhanh */}
        <button 
          onClick={() => navigate('/lms/course')} 
          style={{ marginBottom: '15px', cursor: 'pointer', padding: '5px 10px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          ← Trở về danh sách môn
        </button>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            ⏳ Đang tải chi tiết lớp học...
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#c00', background: '#fee', borderRadius: '8px', margin: '10px 0' }}>
            {error}
            <br />
            <button onClick={fetchClassDetail} style={{ marginTop: '10px', padding: '6px 16px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px' }}>
              Thử lại
            </button>
          </div>
        )}

        {/* Nội dung chính khi đã load xong */}
        {!loading && !error && (
          <>
            {/* Tên môn học đầy đủ */}
            <h1 className="course-detail-title" style={{ marginBottom: '5px' }}>
              {className}
            </h1>
            {classData?.class?.falcuty_name && (
              <div style={{ fontSize: '14px', color: '#666666', marginBottom: '20px', fontStyle: 'italic' }}>
                Khoa: {classData.class.falcuty_name}
              </div>
            )}

            {/* THANH CHỨA TÁC VỤ TAB (Khóa học / Điểm) */}
            <div className="tabs-bar">
              <button 
                className={`tab-button ${activeTab === 'khoahoc' ? 'active' : 'inactive'}`}
                onClick={() => setActiveTab('khoahoc')}
              >
                Khóa học
              </button>
              <button 
                className={`tab-button ${activeTab === 'diem' ? 'active' : 'inactive'}`}
                onClick={() => setActiveTab('diem')}
              >
                Điểm
              </button>
            </div>

            {/* NỘI DUNG HIỂN THỊ DƯỚI TAB */}
            {activeTab === 'khoahoc' ? (
              
              // --- DIỆN MẠO TAB KHÓA HỌC (CHỨA CÁC ACCORDION DYNAMIC) ---
              <div className="accordion-wrapper">
                
                {hasEditingPrivileges && (
                  <div className="teacher-chapter-actions">
                    <button className="add-chapter-btn" onClick={() => setShowAddChapterModal(true)}>
                      + Thêm chương học mới
                    </button>
                  </div>
                )}

                {chapters.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    📭 Chưa có chương học nào cho lớp này.
                  </div>
                )}

                {chapters.map((chapter, index) => (
                  <div key={chapter.chapter_id || chapter.id || index} className="accordion-item">
                    <div className="accordion-header" onClick={() => toggleSection(index)}>
                      <div className="accordion-header-left">
                        <span className={`accordion-arrow ${openSections[index] ? 'open' : 'closed'}`}>
                          {openSections[index] ? '▼' : '▶'}
                        </span>
                        <span className="accordion-title">
                          {chapter.chapter_name || chapter.title || `Chương ${index + 1}`}
                        </span>
                      </div>
                      {hasEditingPrivileges && (
                        <button 
                          className="delete-chapter-btn" 
                          onClick={(e) => confirmDelete(e, 'chapter', chapter.chapter_id)}
                          title="Xóa chương này"
                        >
                          🗑️ Xóa chương
                        </button>
                      )}
                    </div>
                    
                    {/* Nội dung xổ xuống nếu mở */}
                    {openSections[index] && (
                      <div className="accordion-content">
                        {hasEditingPrivileges && (
                          <div className="teacher-item-actions">
                            <button 
                              className="add-item-btn" 
                              onClick={() => {
                                setTargetChapterId(chapter.chapter_id);
                                setShowAddMaterialModal(true);
                              }}
                            >
                              + Thêm Tài liệu/Video
                            </button>
                            <button 
                              className="add-item-btn" 
                              onClick={() => {
                                setTargetChapterId(chapter.chapter_id);
                                setShowAddQuizModal(true);
                              }}
                            >
                              + Thêm bài Quiz
                            </button>
                            <button 
                              className="add-item-btn" 
                              onClick={() => {
                                setTargetChapterId(chapter.chapter_id);
                                setShowAddForumModal(true);
                              }}
                            >
                              + Thêm Diễn đàn thảo luận
                            </button>
                          </div>
                        )}

                        {/* Materials */}
                        {(chapter.materials || []).map((mat, mi) => (
                          <div key={mi} className="content-row flex-row-justify" onClick={() => {
                            if (mat.content_link) {
                              window.open(mat.content_link, '_blank');
                            } else {
                              alert(`Đang tải: ${mat.material_name || mat.title}`);
                            }
                          }}>
                            <div className="content-row-left">
                              <span className="content-icon">{mat.material_type === 'VIDEO' ? '🎥' : '📄'}</span>
                              <span>{mat.material_name || mat.title || 'Tài liệu'}</span>
                            </div>
                            {hasEditingPrivileges && (
                              <button 
                                className="delete-item-btn-small" 
                                onClick={(e) => confirmDelete(e, 'material', mat.material_id || mat.id)}
                                title="Xóa tài liệu"
                              >
                                🗑️ Xóa
                              </button>
                            )}
                          </div>
                        ))}
 
                        {/* Quizzes */}
                        {(chapter.quizzes || []).map((quiz, qi) => (
                          <div key={qi} className="content-row flex-row-justify" onClick={() => navigate(`/lms/quiz/${quiz.quiz_id || quiz.id}`)}>
                            <div className="content-row-left">
                              <span className="content-icon">📝</span>
                              <span>{quiz.quiz_name || quiz.title || 'Quiz'}</span>
                            </div>
                            {hasEditingPrivileges && (
                              <button 
                                className="delete-item-btn-small" 
                                onClick={(e) => confirmDelete(e, 'quiz', quiz.quiz_id || quiz.id)}
                                title="Xóa Quiz"
                              >
                                🗑️ Xóa
                              </button>
                            )}
                          </div>
                        ))}
 
                        {/* Forums */}
                        {(chapter.forums || []).map((forum, fi) => (
                          <div key={fi} className="content-row flex-row-justify" onClick={() => navigate(`/lms/course/${courseId}/forum/${forum.forum_id || forum.id}`)}>
                            <div className="content-row-left">
                              <span className="content-icon">💬</span>
                              <span>{forum.forum_name || forum.title || 'Forum'}</span>
                            </div>
                            {hasEditingPrivileges && (
                              <button 
                                className="delete-item-btn-small" 
                                onClick={(e) => confirmDelete(e, 'forum', forum.forum_id || forum.id)}
                                title="Xóa diễn đàn"
                              >
                                🗑️ Xóa
                              </button>
                            )}
                          </div>
                        ))}
 
                        {/* Assignments */}
                        {(chapter.assignments || []).map((assign, ai) => (
                          <div key={ai} className="content-row" onClick={() => navigate(`/lms/assignment/${assign.assignment_id || assign.id}`)}>
                            <span className="content-icon">📤</span>
                            <span>{assign.assignment_name || assign.title || 'Bài tập'}</span>
                          </div>
                        ))}
 
                        {/* Nếu chương trống */}
                        {!(chapter.materials?.length || chapter.quizzes?.length || chapter.forums?.length || chapter.assignments?.length) && (
                          <div className="empty-content-text">Chưa có tài liệu hoặc hoạt động nào cho chương này.</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

              </div>

            ) : (
              // --- DIỆN MẠO TAB ĐIỂM SỐ ---
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ccc' }}>
                <h3>Bảng điểm chi tiết môn học</h3>
                <p style={{ marginTop: '10px', color: '#666' }}>Chưa có dữ liệu điểm số đồng bộ cho học kỳ này.</p>
              </div>
            )}
          </>
        )}

      </div>

      {/* Modal Thêm Chương mới */}
      {showAddChapterModal && (
        <div className="modal-overlay" onClick={() => setShowAddChapterModal(false)}>
          <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleAddChapter}>
            <div className="modal-header">
              <h3>Thêm chương học mới</h3>
              <button type="button" className="close-btn" onClick={() => setShowAddChapterModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tên chương học:</label>
                <input 
                  type="text" 
                  value={newChapterName} 
                  onChange={(e) => setNewChapterName(e.target.value)} 
                  placeholder="Nhập tên chương..." 
                  required 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="confirm-btn">Thêm chương</button>
              <button type="button" className="dismiss-btn" onClick={() => setShowAddChapterModal(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Thêm Quiz mới */}
      {showAddQuizModal && (
        <div className="modal-overlay" onClick={() => setShowAddQuizModal(false)}>
          <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleAddQuiz}>
            <div className="modal-header">
              <h3>Thêm bài Quiz mới</h3>
              <button type="button" className="close-btn" onClick={() => setShowAddQuizModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tiêu đề bài kiểm tra (Quiz):</label>
                <input 
                  type="text" 
                  value={newQuizTitle} 
                  onChange={(e) => setNewQuizTitle(e.target.value)} 
                  placeholder="Nhập tiêu đề quiz..." 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Thời gian mở đề (Tùy chọn):</label>
                <input 
                  type="datetime-local" 
                  value={newQuizOpenTime} 
                  onChange={(e) => setNewQuizOpenTime(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label>Hạn chót nộp bài (Tùy chọn):</label>
                <input 
                  type="datetime-local" 
                  value={newQuizDeadline} 
                  onChange={(e) => setNewQuizDeadline(e.target.value)} 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="confirm-btn">Tạo Quiz</button>
              <button type="button" className="dismiss-btn" onClick={() => setShowAddQuizModal(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Thêm Diễn đàn mới */}
      {showAddForumModal && (
        <div className="modal-overlay" onClick={() => setShowAddForumModal(false)}>
          <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleAddForum}>
            <div className="modal-header">
              <h3>Thêm diễn đàn thảo luận mới</h3>
              <button type="button" className="close-btn" onClick={() => setShowAddForumModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tiêu đề Diễn đàn:</label>
                <input 
                  type="text" 
                  value={newForumTitle} 
                  onChange={(e) => setNewForumTitle(e.target.value)} 
                  placeholder="Nhập tiêu đề diễn đàn..." 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Mô tả ngắn (Mục đích thảo luận):</label>
                <textarea 
                  value={newForumDescription} 
                  onChange={(e) => setNewForumDescription(e.target.value)} 
                  placeholder="Nhập mô tả diễn đàn..." 
                  rows="3" 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="confirm-btn">Tạo Diễn đàn</button>
              <button type="button" className="dismiss-btn" onClick={() => setShowAddForumModal(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Thêm Tài liệu/Video mới */}
      {showAddMaterialModal && (
        <div className="modal-overlay" onClick={() => setShowAddMaterialModal(false)}>
          <form className="modal-content" onClick={(e) => e.stopPropagation()} onSubmit={handleAddMaterial}>
            <div className="modal-header">
              <h3>Thêm tài liệu hoặc video mới</h3>
              <button type="button" className="close-btn" onClick={() => setShowAddMaterialModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Loại học liệu:</label>
                <select 
                  value={newMaterialType} 
                  onChange={(e) => setNewMaterialType(e.target.value)}
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', fontSize: '14px', outline: 'none' }}
                >
                  <option value="DOCUMENT">📄 Tài liệu (PDF/Word/PowerPoint)</option>
                  <option value="VIDEO">🎥 Video bài giảng (Youtube link/Video link)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tiêu đề học liệu:</label>
                <input 
                  type="text" 
                  value={newMaterialTitle} 
                  onChange={(e) => setNewMaterialTitle(e.target.value)} 
                  placeholder="Nhập tiêu đề học liệu..." 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Đường dẫn liên kết (Link tải/Link xem):</label>
                <input 
                  type="url" 
                  value={newMaterialLink} 
                  onChange={(e) => setNewMaterialLink(e.target.value)} 
                  placeholder="https://example.com/..." 
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="confirm-btn">Thêm học liệu</button>
              <button type="button" className="dismiss-btn" onClick={() => setShowAddMaterialModal(false)}>Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Xác nhận xóa */}
      {showDeleteConfirm && itemToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header delete-header">
              <h3>Xác nhận xóa</h3>
              <button className="close-btn" onClick={() => setShowDeleteConfirm(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>
                Bạn có chắc chắn muốn xóa {itemToDelete.type === 'chapter' ? 'chương học' : itemToDelete.type === 'quiz' ? 'bài Quiz' : itemToDelete.type === 'forum' ? 'diễn đàn thảo luận' : 'tài liệu/video'} này không?
                Hành động này sẽ xóa vĩnh viễn mục đã chọn và không thể hoàn tác.
              </p>
            </div>
            <div className="modal-footer">
              <button className="confirm-delete-btn" onClick={executeDelete}>Xóa vĩnh viễn</button>
              <button className="dismiss-btn" onClick={() => setShowDeleteConfirm(false)}>Hủy bỏ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetail;