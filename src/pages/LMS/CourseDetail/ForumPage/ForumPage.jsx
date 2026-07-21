import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getForumAPI } from '../../../../api/LMS/CourseDetail/forums';
import { getForumPostsByForumIdAPI, createForumPostAPI, deleteForumPostAPI } from '../../../../api/LMS/CourseDetail/forumPosts';
import Header from '../../../../components/Header/Header';
import { useToast } from '../../../../components/Toast/ToastContext';
import './ForumPage.css';

function ForumPage() {
  const { courseId, forumId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [forum, setForum] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for creating new post
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Custom delete confirmation modal state
  const [postToDelete, setPostToDelete] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Get current user details
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  const currentUserId = currentUser?.user_id;
  const userRole = currentUser?.role ? String(currentUser.role) : '1';

  useEffect(() => {
    fetchForumAndPosts();
  }, [forumId]);

  const fetchForumAndPosts = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch forum metadata
      const forumRes = await getForumAPI(forumId);
      setForum(forumRes.data);
      
      // 2. Fetch conversations under this forum
      const postsRes = await getForumPostsByForumIdAPI(forumId);
      setPosts(postsRes.data);
    } catch (err) {
      console.error('Error fetching forum data:', err);
      setError('Không thể tải dữ liệu diễn đàn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast('Vui lòng nhập đầy đủ tiêu đề và nội dung!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createForumPostAPI({
        forum_id: Number(forumId),
        title,
        content
      });
      setTitle('');
      setContent('');
      setShowForm(false);
      showToast('Đăng bài thảo luận thành công!', 'success');
      // Reload posts
      const postsRes = await getForumPostsByForumIdAPI(forumId);
      setPosts(postsRes.data);
    } catch (err) {
      console.error('Error creating post:', err);
      showToast('Đã xảy ra lỗi khi đăng bài. Vui lòng thử lại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeletePost = (postId) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  const executeDeletePost = async () => {
    if (!postToDelete) return;
    try {
      await deleteForumPostAPI(postToDelete);
      setPosts(posts.filter(p => p.post_id !== postToDelete));
      setShowDeleteModal(false);
      setPostToDelete(null);
      showToast('Đã xóa bài viết thành công.', 'info');
    } catch (err) {
      console.error('Error deleting post:', err);
      showToast(err.response?.data?.error || 'Không thể xóa bài viết này.', 'error');
      setShowDeleteModal(false);
      setPostToDelete(null);
    }
  };

  // Helper to format date
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="forum-container">
        <Header view="courses" />
        <div className="forum-body" style={{ textAlign: 'center', padding: '50px' }}>
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu diễn đàn...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="forum-container">
      <Header view="courses" />
      <div className="forum-body">
        
        <button className="back-btn" onClick={() => navigate(`/lms/course/${courseId}`)}>
          ← Quay lại lớp học
        </button>

        {error && <div className="error-banner">{error}</div>}

        {forum && (
          <div className="forum-header-card">
            <span className="forum-icon">💬</span>
            <div className="forum-header-info">
              <h2>{forum.title}</h2>
              <p>{forum.description || 'Chưa có mô tả diễn đàn.'}</p>
            </div>
          </div>
        )}

        <div className="forum-actions">
          <h3>Chủ đề thảo luận ({posts.length})</h3>
          {!showForm && (
            <button className="new-thread-btn" onClick={() => setShowForm(true)}>
              + Tạo cuộc thảo luận mới
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleCreatePost} className="new-post-form">
            <h4>Tạo chủ đề thảo luận mới</h4>
            <div className="form-group">
              <label>Tiêu đề</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Nhập tiêu đề cuộc thảo luận..."
                required
              />
            </div>
            <div className="form-group">
              <label>Nội dung</label>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Nhập nội dung chi tiết bài đăng..."
                rows="6"
                required
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Đăng bài'}
              </button>
              <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>
                Hủy
              </button>
            </div>
          </form>
        )}

        <div className="posts-list">
          {posts.length === 0 ? (
            <div className="no-posts-card">
              📭 Chưa có cuộc thảo luận nào. Hãy là người đầu tiên bắt đầu cuộc trò chuyện!
            </div>
          ) : (
            posts.map((post) => {
              const isAuthor = String(post.user_id) === String(currentUserId);
              const isPrivileged = userRole === '2' || userRole === '3';
              
              return (
                <div key={post.post_id || post.conversation_id} className="post-card">
                  <div className="post-card-main" onClick={() => navigate(`/lms/course/${courseId}/forum-post/${post.post_id || post.conversation_id}`)}>
                    <h4 className="post-title">{post.title}</h4>
                    <p className="post-content-snippet">
                      {post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content}
                    </p>
                    <div className="post-meta">
                      <span className="post-author">
                        Người đăng: <strong>{post.user_name}</strong>
                      </span>
                      <span className="post-date">
                        • {formatDate(post.created_at)}
                      </span>
                    </div>
                  </div>
                  {(isAuthor || isPrivileged) && (
                    <button 
                      className="delete-post-btn"
                      onClick={() => confirmDeletePost(post.post_id || post.conversation_id)}
                      title="Xóa chủ đề này"
                    >
                      🗑️ Xóa
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Bảng xác nhận xóa cuộc thảo luận */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header delete-header">
              <h3>Xác nhận xóa chủ đề</h3>
              <button className="close-btn" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa chủ đề thảo luận này không? Tất cả các bình luận và phản hồi liên quan sẽ bị xóa vĩnh viễn.</p>
            </div>
            <div className="modal-footer">
              <button className="confirm-delete-btn" onClick={executeDeletePost}>
                Xóa bài đăng
              </button>
              <button className="dismiss-btn" onClick={() => setShowDeleteModal(false)}>
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForumPage;
