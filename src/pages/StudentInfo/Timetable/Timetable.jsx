import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMySchedulesAPI } from '../../../api/LMS/Schedule/schedules';
import { getSemestersAPI } from '../../../api/LMS/Schedule/semesters';
import './Timetable.css';

// Mapping 16 tiết học kèm giờ bắt đầu & kết thúc
const SLOT_TIMES = {
  1: { start: '06:00', end: '06:50' },
  2: { start: '07:00', end: '07:50' },
  3: { start: '08:00', end: '08:50' },
  4: { start: '09:00', end: '09:50' },
  5: { start: '10:00', end: '10:50' },
  6: { start: '11:00', end: '11:50' },
  7: { start: '12:00', end: '12:50' },
  8: { start: '13:00', end: '13:50' },
  9: { start: '14:00', end: '14:50' },
  10: { start: '15:00', end: '15:50' },
  11: { start: '16:00', end: '16:50' },
  12: { start: '17:00', end: '17:50' },
  13: { start: '18:00', end: '18:50' },
  14: { start: '19:00', end: '19:50' },
  15: { start: '20:00', end: '20:50' },
  16: { start: '21:00', end: '21:50' },
};

const ALL_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const DAY_NUMBERS = [2, 3, 4, 5, 6, 7, 8];

// Bảng màu sắc tương phản nổi bật theo từng môn học
const CLASS_COLORS = [
  '#008b44', '#1a73e8', '#d97706', '#dc2626', '#7c3aed',
  '#0284c7', '#059669', '#d946ef', '#e11d48', '#4f46e5'
];

function getColorForClass(classId) {
  return CLASS_COLORS[Number(classId || 0) % CLASS_COLORS.length];
}

function getTodayDayNumber() {
  const day = new Date().getDay();
  return day === 0 ? 8 : day + 1; // 2=T2, 8=CN
}

function Timetable() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedItemModal, setSelectedItemModal] = useState(null);

  const todayDayNum = getTodayDayNumber();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [semRes, schedRes] = await Promise.all([
        getSemestersAPI().catch(() => ({ data: [] })),
        getMySchedulesAPI().catch(() => ({ data: [] })),
      ]);

      const semList = Array.isArray(semRes.data) ? semRes.data : [];
      setSemesters(semList);
      if (semList.length > 0) {
        setSelectedSemester(semList[0].semester_id);
      }

      setSchedules(Array.isArray(schedRes.data) ? schedRes.data : []);
    } catch (err) {
      console.error('Lỗi tải thời khóa biểu:', err);
      setError('Không thể tải dữ liệu thời khóa biểu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Lọc danh sách lịch trong tuần hiện tại
  const weekSchedules = schedules.filter((s) => {
    if (s.week != null && Number(s.week) !== Number(currentWeek)) return false;
    return true;
  });

  // Kiểm tra 1 ô (ngày, tiết) có lịch học hay không
  const getScheduleForDaySlot = (dayNum, slot) => {
    return weekSchedules.filter((item) => {
      const dVal = item.day_of_week;
      let dayMatches = false;

      if (typeof dVal === 'number' || !isNaN(Number(dVal))) {
        dayMatches = Number(dVal) === Number(dayNum);
      } else if (typeof dVal === 'string') {
        const dayMap = { 'Thứ 2': 2, 'Thứ 3': 3, 'Thứ 4': 4, 'Thứ 5': 5, 'Thứ 6': 6, 'Thứ 7': 7, 'CN': 8, 'Chủ nhật': 8 };
        dayMatches = (dayMap[dVal] || 0) === Number(dayNum);
      }

      const startSlot = Number(item.start_slot || item.slot || 1);
      const endSlot = Number(item.end_slot || startSlot);
      const slotMatches = slot >= startSlot && slot <= endSlot;

      return dayMatches && slotMatches;
    });
  };

  const handlePrevWeek = () => {
    if (currentWeek > 1) setCurrentWeek(currentWeek - 1);
  };

  const handleNextWeek = () => {
    if (currentWeek < 20) setCurrentWeek(currentWeek + 1);
  };

  const handlePrint = () => {
    window.print();
  };

  // Thống kê nhanh
  const uniqueCourses = new Set(weekSchedules.map((s) => s.course_name || s.class_id)).size;

  return (
    <div className="timetable-student-container">
      {/* 1. Header Bar */}
      <div className="timetable-header-bar">
        <div>
          <h3 className="timetable-title">📅 Thời Khóa Biểu Sinh Viên</h3>
          <span className="timetable-subtitle">Chi tiết theo từng tiết học (Tiết 1 đến Tiết 16)</span>
        </div>

        <div className="timetable-actions-group">
          <button className="action-btn print-btn" onClick={handlePrint} title="In thời khóa biểu">
            🖨️ In TKB
          </button>
        </div>
      </div>

      {/* 2. Control Toolbar */}
      <div className="timetable-toolbar">
        <div className="toolbar-left">
          {semesters.length > 0 && (
            <div className="toolbar-select-item">
              <label>Học kỳ:</label>
              <select
                value={selectedSemester || ''}
                onChange={(e) => setSelectedSemester(e.target.value)}
              >
                {semesters.map((s) => (
                  <option key={s.semester_id} value={s.semester_id}>
                    {s.semester_name || `Học kỳ ${s.semester_id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="week-navigation-group">
            <button
              className="week-nav-btn"
              onClick={handlePrevWeek}
              disabled={currentWeek <= 1}
            >
              ← Tuần trước
            </button>

            <div className="week-select-box">
              <span>Tuần:</span>
              <select
                value={currentWeek}
                onChange={(e) => setCurrentWeek(Number(e.target.value))}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>
                    Tuần {w}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="week-nav-btn"
              onClick={handleNextWeek}
              disabled={currentWeek >= 20}
            >
              Tuần sau →
            </button>
          </div>
        </div>

        <div className="toolbar-right-stats">
          <div className="stat-pill">
            <span className="stat-num">{weekSchedules.length}</span>
            <span className="stat-lbl">Tiết học</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num">{uniqueCourses}</span>
            <span className="stat-lbl">Môn học</span>
          </div>
        </div>
      </div>

      {/* States Loading / Error */}
      {loading && (
        <div className="timetable-state-box">⏳ Đang tải dữ liệu thời khóa biểu...</div>
      )}

      {error && (
        <div className="timetable-error-box">
          {error}
          <br />
          <button onClick={fetchData} className="retry-btn-modern">
            Thử lại
          </button>
        </div>
      )}

      {/* 3. Lưới Thời Khóa Biểu Chia Từng Tiết Học */}
      {!loading && !error && (
        <div className="timetable-grid-wrapper">
          <table className="timetable-grid-table">
            <thead>
              <tr>
                <th className="slot-col-header" style={{ width: '50px' }}>Tiết</th>
                <th className="slot-col-header" style={{ width: '100px' }}>Giờ</th>
                {DAYS.map((day, idx) => {
                  const dayNum = DAY_NUMBERS[idx];
                  const isToday = dayNum === todayDayNum;
                  return (
                    <th
                      key={day}
                      className={`day-col-header ${isToday ? 'is-today-header' : ''}`}
                    >
                      <div className="day-header-content">
                        <span>{day}</span>
                        {isToday && <span className="today-badge">Hôm nay</span>}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ALL_SLOTS.map((slot) => {
                const time = SLOT_TIMES[slot];
                return (
                  <tr key={slot} className="timetable-row">
                    <td className="slot-number-td">{slot}</td>
                    <td className="slot-time-td">{time?.start} - {time?.end}</td>
                    {DAY_NUMBERS.map((dayNum) => {
                      const isTodayCell = dayNum === todayDayNum;

                      // Check if covered by a previous slot (start_slot < slot)
                      const coveredByPrev = weekSchedules.find((s) => {
                        const dVal = s.day_of_week;
                        let dayMatches = false;
                        if (typeof dVal === 'number' || !isNaN(Number(dVal))) {
                          dayMatches = Number(dVal) === Number(dayNum);
                        } else if (typeof dVal === 'string') {
                          const dayMap = { 'Thứ 2': 2, 'Thứ 3': 3, 'Thứ 4': 4, 'Thứ 5': 5, 'Thứ 6': 6, 'Thứ 7': 7, 'CN': 8, 'Chủ nhật': 8 };
                          dayMatches = (dayMap[dVal] || 0) === Number(dayNum);
                        }

                        const startSlot = Number(s.start_slot || s.slot || 1);
                        const endSlot = Number(s.end_slot || startSlot);
                        return dayMatches && startSlot < slot && slot <= endSlot;
                      });

                      if (coveredByPrev) {
                        // Covered by previous start_slot rowSpan, skip td
                        return null;
                      }

                      // Check items starting at this slot
                      const startingItems = weekSchedules.filter((s) => {
                        const dVal = s.day_of_week;
                        let dayMatches = false;
                        if (typeof dVal === 'number' || !isNaN(Number(dVal))) {
                          dayMatches = Number(dVal) === Number(dayNum);
                        } else if (typeof dVal === 'string') {
                          const dayMap = { 'Thứ 2': 2, 'Thứ 3': 3, 'Thứ 4': 4, 'Thứ 5': 5, 'Thứ 6': 6, 'Thứ 7': 7, 'CN': 8, 'Chủ nhật': 8 };
                          dayMatches = (dayMap[dVal] || 0) === Number(dayNum);
                        }

                        const startSlot = Number(s.start_slot || s.slot || 1);
                        return dayMatches && startSlot === slot;
                      });

                      if (startingItems.length > 0) {
                        const firstItem = startingItems[0];
                        const startSlot = Number(firstItem.start_slot || firstItem.slot || 1);
                        const endSlot = Number(firstItem.end_slot || startSlot);
                        const rowSpanVal = endSlot - startSlot + 1;

                        return (
                          <td
                            key={dayNum}
                            rowSpan={rowSpanVal > 1 ? rowSpanVal : 1}
                            className={`timetable-cell merged-cell ${isTodayCell ? 'is-today-cell' : ''}`}
                            style={{ verticalAlign: 'middle' }}
                          >
                            {startingItems.map((item, iIdx) => {
                              const bg = getColorForClass(item.class_id || item.course_id || iIdx);
                              return (
                                <div
                                  key={iIdx}
                                  className="slot-course-card merged-card-fancy"
                                  style={{
                                    backgroundColor: bg,
                                    height: '100%',
                                    minHeight: `${rowSpanVal * 42}px`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                  }}
                                  onClick={() => setSelectedItemModal(item)}
                                  title={`Môn: ${item.course_name || item.title || item.class_id} | Phòng: ${item.room_name || 'N/A'} | Tiết ${startSlot}-${endSlot}`}
                                >
                                  <div className="slot-course-title">
                                    {item.course_name || item.title || 'Khóa học'}
                                  </div>
                                  <div className="slot-course-meta">
                                    <span className="slot-code">{item.course_code || item.class_code || 'Môn học'}</span>
                                    <span className="slot-room">📍 {item.room_name || item.location || 'H6-201'}</span>
                                  </div>
                                  <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '4px' }}>
                                    ⏰ Tiết {startSlot} - {endSlot}
                                  </div>
                                </div>
                              );
                            })}
                          </td>
                        );
                      }

                      // Empty cell
                      return (
                        <td key={dayNum} className={`timetable-cell ${isTodayCell ? 'is-today-cell' : ''}`}>
                          <span className="empty-cell-text">-</span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {weekSchedules.length === 0 && (
            <div className="timetable-empty-banner">
              📭 Không có lịch học nào trong tuần {currentWeek}.
            </div>
          )}
        </div>
      )}

      {/* 4. Modal Chi Tiết Buổi Học */}
      {selectedItemModal && (
        <div className="modal-overlay" onClick={() => setSelectedItemModal(null)}>
          <div className="modal-content sched-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết môn học</h3>
              <button className="close-btn" onClick={() => setSelectedItemModal(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="sched-detail-card">
                <h4 className="sched-detail-course-name">
                  {selectedItemModal.course_name || selectedItemModal.title || `Lớp ${selectedItemModal.class_id}`}
                </h4>
                <div className="sched-detail-grid">
                  <div className="detail-item">
                    <span className="lbl">Mã lớp:</span>
                    <span className="val">{selectedItemModal.class_code || selectedItemModal.class_id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="lbl">Phòng học:</span>
                    <span className="val">{selectedItemModal.room_name || selectedItemModal.location || 'H6-201'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="lbl">Tiết học:</span>
                    <span className="val">Tiết {selectedItemModal.start_slot || 1} - Tiết {selectedItemModal.end_slot || 3}</span>
                  </div>
                  <div className="detail-item">
                    <span className="lbl">Giờ học:</span>
                    <span className="val">
                      {SLOT_TIMES[selectedItemModal.start_slot || 1]?.start} - {SLOT_TIMES[selectedItemModal.end_slot || 3]?.end}
                    </span>
                  </div>
                  {selectedItemModal.teacher_name && (
                    <div className="detail-item">
                      <span className="lbl">Giảng viên:</span>
                      <span className="val">{selectedItemModal.teacher_name}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="lbl">Tuần học:</span>
                    <span className="val">Tuần {selectedItemModal.week || currentWeek}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {selectedItemModal.class_id && (
                <button
                  className="confirm-btn"
                  onClick={() => {
                    setSelectedItemModal(null);
                    navigate(`/lms/course/${selectedItemModal.class_id}`);
                  }}
                >
                  🚀 Vào lớp học LMS
                </button>
              )}
              <button className="dismiss-btn" onClick={() => setSelectedItemModal(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Timetable;
