import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../../api/axios';
import Header from '../../../../components/Header/Header';
import './AddForum.css';

function AddForum() {
  const { courseId, chapterId } = useParams();
  const navigate = useNavigate();

  const [courseName, setCourseName] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/classes/view/${courseId}`);
        const data = res.data;
        const cName = data?.class?.course_name || data?.class_name || data?.course_name || `Lớp học ${courseId}`;
        setCourseName(cName);

        const chapterList = data.chapters || data.Chapters || [];
        const currentChapter = chapterList.find(c => Number(c.chapter_id) === Number(chapterId));
        if (currentChapter) {
          setChapterName(currentChapter.chapter_name);
        }
      } catch (err) {
        console.error('Lỗi tải thông tin chi tiết:', err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
  }, [courseId, chapterId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await api.post('/forums', {
        chapter_id: Number(chapterId),
        title: title.trim(),
        description: description.trim()
      });
      showToast('Tạo diễn đàn thảo luận mới thành công!', 'success');
      navigate(`/lms/course/${courseId}`);
    } catch (err) {
      console.error('Error creating forum:', err);
      showToast(err.response?.data?.error || 'Không thể tạo diễn đàn thảo luận mới. Vui lòng thử lại.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-content-page-container">
      <Header view="courses" />
      <div className="add-content-body">
        <button className="back-btn-modern" onClick={() => navigate(`/lms/course/${courseId}`)}>
          ← Quay lại môn học
        </button>

        <div className="add-content-card">
          <div className="card-header-gradient">
            <h2>Thêm Diễn Đàn Thảo Luận Mới</h2>
            {loadingDetails ? (
              <span className="subtitle-loading">Đang tải thông tin...</span>
            ) : (
              <span className="subtitle">
                {courseName} &gt; {chapterName || `Chương ${chapterId}`}
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="add-content-form">
            <div className="form-group-modern">
              <label htmlFor="forum-title">Tiêu đề diễn đàn:</label>
              <input
                id="forum-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề diễn đàn..."
                required
                disabled={loading}
              />
            </div>

            <div className="form-group-modern">
              <label htmlFor="forum-desc">Mô tả ngắn (Mục đích thảo luận):</label>
              <textarea
                id="forum-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả chi tiết hoặc nội quy diễn đàn..."
                rows="5"
                disabled={loading}
              />
            </div>

            <div className="form-actions-modern">
              <button type="submit" className="submit-btn-modern" disabled={loading}>
                {loading ? 'Đang tạo...' : 'Tạo diễn đàn'}
              </button>
              <button
                type="button"
                className="cancel-btn-modern"
                onClick={() => navigate(`/lms/course/${courseId}`)}
                disabled={loading}
              >
                Hủy bỏ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddForum;
