import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../../api/axios';
import Header from '../../../../components/Header/Header';
import './AddMaterial.css';

function AddMaterial() {
  const { courseId, chapterId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const chapterOrder = Number(searchParams.get('order')) || 1;

  const [courseName, setCourseName] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [title, setTitle] = useState('');
  const [materialType, setMaterialType] = useState('DOCUMENT');
  const [contentLink, setContentLink] = useState('');

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
      await api.post('/materials', {
        chapter_id: Number(chapterId),
        class_id: Number(courseId),
        title: title.trim(),
        material_type: materialType,
        content_link: contentLink.trim() || undefined,
        chapter_order: chapterOrder
      });
      showToast('Đã thêm học liệu mới thành công!', 'success');
      navigate(`/lms/course/${courseId}`);
    } catch (err) {
      console.error('Error creating material:', err);
      showToast(err.response?.data?.error || 'Không thể tạo học liệu mới. Vui lòng thử lại.', 'error');
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
            <h2>Thêm Tài Liệu / Video Mới</h2>
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
              <label htmlFor="material-type">Loại học liệu:</label>
              <select
                id="material-type"
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                disabled={loading}
              >
                <option value="DOCUMENT">📄 Tài liệu (PDF/Word/PowerPoint)</option>
                <option value="VIDEO">🎥 Video bài giảng (Youtube link/Video link)</option>
              </select>
            </div>

            <div className="form-group-modern">
              <label htmlFor="material-title">Tiêu đề học liệu:</label>
              <input
                id="material-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề học liệu..."
                required
                disabled={loading}
              />
            </div>

            <div className="form-group-modern">
              <label htmlFor="material-link">Đường dẫn liên kết (Link tải/Link xem):</label>
              <input
                id="material-link"
                type="url"
                value={contentLink}
                onChange={(e) => setContentLink(e.target.value)}
                placeholder="https://example.com/..."
                disabled={loading}
              />
            </div>

            <div className="form-actions-modern">
              <button type="submit" className="submit-btn-modern" disabled={loading}>
                {loading ? 'Đang thêm...' : 'Thêm học liệu'}
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

export default AddMaterial;
