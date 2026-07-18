import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { getUserDeadlinesAPI } from '../../../api/StudentInfo/Profile/users';
import Header from '../../../components/Header/Header';
import './CalendarPage.css';

function CalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const fetchDeadlines = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getUserDeadlinesAPI();
      setEvents(res.data);
    } catch (err) {
      console.error('Error fetching calendar deadlines:', err);
      setError('Không thể tải lịch trình deadline. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (info) => {
    // Intercept default link behavior to display detail modal popup first
    info.jsEvent.preventDefault();
    const event = info.event;
    
    setSelectedEvent({
      id: event.id,
      title: event.title.split(' - ')[0],
      fullTitle: event.title,
      start: event.start,
      url: event.url,
      courseName: event.extendedProps.course_name || 'Không rõ môn học',
      openTime: event.extendedProps.open_time,
      deadlineTime: event.extendedProps.deadline_time
    });
    setShowModal(true);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Chưa mở/Chưa thiết lập';
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="calendar-page-container">
      <Header view="calendar" />
      
      <div className="calendar-page-body">
        <h1 className="calendar-page-title">Lịch Deadline của tôi</h1>
        
        {error && <div className="error-banner">{error}</div>}
        
        <div className="calendar-card">
          {loading ? (
            <div className="calendar-loading">
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '10px' }}>Đang tải lịch deadline...</p>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={events}
              eventClick={handleEventClick}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: '' // Keep simple month grid view
              }}
              buttonText={{
                today: 'Hôm nay'
              }}
              height="auto"
              eventTimeFormat={{
                hour: '2-digit',
                minute: '2-digit',
                meridiem: false,
                hour12: false
              }}
            />
          )}
        </div>
      </div>

      {/* Modal Popup Chi tiết Deadline */}
      {showModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết hoạt động</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-item">
                <span className="detail-label">Hoạt động:</span>
                <strong className="detail-val highlight-title">{selectedEvent.title}</strong>
              </div>
              <div className="detail-item">
                <span className="detail-label">Môn học:</span>
                <span className="detail-val">{selectedEvent.courseName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Lớp học:</span>
                <span className="detail-val">{selectedEvent.fullTitle.split(' - ')[1] || 'Chưa rõ'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Thời gian mở đề:</span>
                <span className="detail-val">{formatDate(selectedEvent.openTime)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Hạn chót nộp bài:</span>
                <strong className="detail-val text-danger">{formatDate(selectedEvent.deadlineTime)}</strong>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="go-to-activity-btn" 
                onClick={() => {
                  setShowModal(false);
                  navigate(selectedEvent.url);
                }}
              >
                Đi tới bài kiểm tra →
              </button>
              <button className="dismiss-btn" onClick={() => setShowModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarPage;
