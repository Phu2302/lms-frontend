import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getForumPostDetailsAPI,
  createForumPostResponseAPI,
  deleteForumPostResponseAPI,
  deleteForumPostAPI
} from '../../../../api/LMS/CourseDetail/forumPosts';
import Header from '../../../../components/Header/Header';
import { useToast } from '../../../../components/Toast/ToastContext';
import './ForumPostDetailPage.css';

function ForumPostDetailPage() {
  const { courseId, postId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for new reply
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Custom delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Get current user details
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  const currentUserId = currentUser?.user_id;
  const userRole = currentUser?.role ? String(currentUser.role) : '1';

  useEffect(() => {
    fetchPostDetails();
  }, [postId]);

  const fetchPostDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getForumPostDetailsAPI(postId);
      setPost(res.data);
    } catch (err) {
      console.error('Error fetching post details:', err);
      setError('Không thể tải chi tiết bài đăng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) {
      showToast('Vui lòng nhập nội dung phản hồi!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await createForumPostResponseAPI(postId, {
        content: replyContent
      });
      setReplyContent('');
      showToast('Đã đăng phản hồi thành công!', 'success');
      // Reload post details to see the new reply
      const res = await getForumPostDetailsAPI(postId);
      setPost(res.data);
    } catch (err) {
      console.error('Error creating reply:', err);
      showToast('Đã xảy ra lỗi khi đăng phản hồi. Vui lòng thử lại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async (responseId, createdAt) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phản hồi này không?')) return;
    try {
      // Pass createdAt as query param so backend can delete by PK and SK
      await deleteForumPostResponseAPI(postId, responseId, createdAt);
      // Update state locally
      setPost({
        ...post,
        responses: post.responses.filter(r => r.response_id !== responseId)
      });
      showToast('Đã xóa phản hồi.', 'info');
    } catch (err) {
      console.error('Error deleting reply:', err);
      showToast(err.response?.data?.error || 'Không thể xóa phản hồi này.', 'error');
    }
  };

  const handleDeletePost = () => {
    setShowDeleteModal(true);
  };

  const executeDeletePost = async () => {
    try {
      await deleteForumPostAPI(postId);
      setShowDeleteModal(false);
      showToast('Đã xóa bài thảo luận.', 'info');
      // Redirect back to the forum page
      navigate(`/lms/course/${courseId}/forum/${post.forum_id}`);
    } catch (err) {
      console.error('Error deleting post:', err);
      showToast(err.response?.data?.error || 'Không thể xóa bài thảo luận này.', 'error');
      setShowDeleteModal(false);
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

  const getRoleBadge = (roleCode) => {
    switch (String(roleCode)) {
      case '3':
        return <span className="user-badge admin-badge">Admin</span>;
      case '2':
        return <span className="user-badge instructor-badge">Giảng viên</span>;
      default:
        return null;
    }
  };

  const getAvatarFallback = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="post-detail-container">
        <Header view="courses" />
        <div className="post-detail-body" style={{ textAlign: 'center', padding: '50px' }}>
          <div className="loading-spinner"></div>
          <p>Đang tải chi tiết cuộc thảo luận...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail-container">
      <Header view="courses" />
      <div className="post-detail-body">
        
        {post && (
          <button className="back-btn" onClick={() => navigate(`/lms/course/${courseId}/forum/${post.forum_id}`)}>
            ← Quay lại danh sách chủ đề
          </button>
        )}

        {error && <div className="error-banner">{error}</div>}

        {post && (
          <>
            {/* Main Thread Post */}
            <div className="main-post-card">
              <div className="main-post-header">
                <div className="post-author-info">
                  <div className="user-avatar">
                    {getAvatarFallback(post.user_name)}
                  </div>
                  <div>
                    <span className="author-name">{post.user_name}</span>
                    {getRoleBadge(post.role)}
                    <span className="post-timestamp">{formatDate(post.created_at)}</span>
                  </div>
                </div>
                {(String(post.user_id) === String(currentUserId) || userRole === '2' || userRole === '3') && (
                  <button className="delete-post-header-btn" onClick={handleDeletePost}>
                    🗑️ Xóa chủ đề
                  </button>
                )}
              </div>
              <div className="main-post-content">
                <h3 className="post-detail-title">{post.title}</h3>
                <p className="post-detail-body-text">{post.content}</p>
              </div>
            </div>

            {/* Replies Section */}
            <div className="replies-section">
              <h3>Ý kiến phản hồi ({post.responses?.length || 0})</h3>
              
              <div className="replies-list">
                {post.responses?.length === 0 ? (
                  <div className="no-replies-card">
                    💬 Chưa có phản hồi nào cho chủ đề này. Hãy đóng góp ý kiến của bạn!
                  </div>
                ) : (
                  post.responses.map((reply) => {
                    const isReplyAuthor = String(reply.user_id) === String(currentUserId);
                    const isPrivileged = userRole === '2' || userRole === '3';
                    
                    return (
                      <div key={reply.response_id} className="reply-card">
                        <div className="reply-header">
                          <div className="reply-author-info">
                            <div className="user-avatar reply-avatar">
                              {getAvatarFallback(reply.user_name)}
                            </div>
                            <div>
                              <span className="author-name">{reply.user_name}</span>
                              {getRoleBadge(reply.role)}
                              <span className="post-timestamp">{formatDate(reply.created_at)}</span>
                            </div>
                          </div>
                          {(isReplyAuthor || isPrivileged) && (
                            <button 
                              className="delete-reply-btn" 
                              onClick={() => handleDeleteReply(reply.response_id, reply.created_at)}
                              title="Xóa phản hồi này"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div className="reply-content">
                          <p>{reply.content}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Add Reply Form */}
            <form onSubmit={handleAddReply} className="reply-form-card">
              <h4>Gửi phản hồi của bạn</h4>
              <div className="form-group">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Nhập nội dung câu trả lời hoặc thảo luận..."
                  rows="4"
                  required
                />
              </div>
              <button type="submit" className="submit-reply-btn" disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
            </form>
          </>
        )}

      </div>

      {/* Bảng xác nhận xóa toàn bộ cuộc thảo luận */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header delete-header">
              <h3>Xác nhận xóa chủ đề</h3>
              <button className="close-btn" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa toàn bộ chủ đề thảo luận này không? Hành động này sẽ xóa tất cả các phản hồi liên quan và không thể hoàn tác.</p>
            </div>
            <div className="modal-footer">
              <button className="confirm-delete-btn" onClick={executeDeletePost}>
                Xóa chủ đề
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

export default ForumPostDetailPage;
