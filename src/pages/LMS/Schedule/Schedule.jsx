import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSemestersAPI } from '../../../api/LMS/Schedule/semesters';
import { getMySchedulesAPI } from '../../../api/LMS/Schedule/schedules';
import Header from '../../../components/Header/Header';
import './Schedule.css';

// Tiết học → giờ
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

const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
const DAY_NUMBERS = [2, 3, 4, 5, 6, 7, 8]; // day_of_week values

// Màu ngẫu nhiên theo class_id
const CLASS_COLORS = [
  '#5f27cd', '#0abde3', '#10ac84', '#ee5253', '#ff9f43',
  '#48dbfb', '#1dd1a1', '#54a0ff', '#ff6b6b', '#c8d6e5'
];
const getColorForClass = (classId) => CLASS_COLORS[Number(classId) % CLASS_COLORS.length];

// Calculate current ISO week
const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Calculate available weeks based on selected semester
const getAvailableWeeks = (sem) => {
  if (!sem || sem.start_week == null || sem.end_week == null) return [];
  const start = Number(sem.start_week);
  const end = Number(sem.end_week);
  const weeks = [];
  for (let w = start; w <= end; w++) {
    weeks.push(w);
  }
  return weeks;
};

function Schedule() {
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [selectedSemester, setSelectedSemester] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Tải song song: semester list và schedule của user
      const [semRes, schedRes] = await Promise.all([
        getSemestersAPI(),
        getMySchedulesAPI()
      ]);

      const semList = Array.isArray(semRes.data) ? semRes.data : [];
      setSemesters(semList);

      const schedList = Array.isArray(schedRes.data) ? schedRes.data : [];
      setSchedules(schedList);

      // Tìm semester chứa ngày hôm nay (tuần hiện tại)
      const todayWeek = getISOWeek(new Date());
      let matchedSemester = null;

      if (semList.length > 0) {
        matchedSemester = semList.find(s => todayWeek >= Number(s.start_week) && todayWeek <= Number(s.end_week)) || semList[0];
        setSelectedSemester(matchedSemester);
      }

      // Đặt currentWeek
      if (matchedSemester) {
        const semWeeks = getAvailableWeeks(matchedSemester);
        if (semWeeks.includes(todayWeek)) {
          setCurrentWeek(todayWeek);
        } else {
          setCurrentWeek(semWeeks[0] || 1);
        }
      } else if (schedList.length > 0) {
        const weeks = schedList.map(s => s.week).filter(Boolean);
        const uniqueWeeks = [...new Set(weeks)].sort((a, b) => a - b);
        setCurrentWeek(uniqueWeeks[0] || 1);
      }
    } catch (err) {
      console.error('Lỗi tải thời khóa biểu:', err);
      setError('Không thể tải thời khóa biểu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Get current date string formatted, e.g. "Thứ Ba, 14/07/2026"
  const getTodayString = () => {
    const today = new Date();
    const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = daysOfWeek[today.getDay()];
    const dateStr = today.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return `${dayName}, ${dateStr}`;
  };

  // Calculate the dates for the Monday to Sunday of currentWeek
  const getDatesOfWeek = (weekNum, semesterName) => {
    let year = new Date().getFullYear();
    if (semesterName) {
      const match = semesterName.match(/\d{4}/);
      if (match) {
        year = parseInt(match[0], 10);
      }
    }

    const jan1 = new Date(year, 0, 1);
    const jan1Day = jan1.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const diff = jan1Day <= 4 && jan1Day > 0 ? 1 - jan1Day : (jan1Day === 0 ? 1 : 8 - jan1Day);
    const startOfFirstWeek = new Date(year, 0, 1 + diff);

    const startOfWeek = new Date(startOfFirstWeek);
    startOfWeek.setDate(startOfFirstWeek.getDate() + (weekNum - 1) * 7);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDates.push(d);
    }
    return weekDates;
  };

  const formatDateDDMM = (date) => {
    if (!date) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}`;
  };

  const weekDates = getDatesOfWeek(currentWeek, selectedSemester?.semester_name);

  // Lọc schedules theo tuần
  const weekSchedules = schedules.filter(s => s.week === currentWeek);

  // Lấy tất cả các tuần có của học kỳ
  const availableWeeks = getAvailableWeeks(selectedSemester);

  const hasPrevWeek = () => {
    const idx = availableWeeks.indexOf(currentWeek);
    if (idx > 0) return true;
    const sortedSems = [...semesters].sort((a, b) => Number(a.start_week) - Number(b.start_week));
    const currentSemIdx = sortedSems.findIndex(s => s.semester_id === selectedSemester?.semester_id);
    return currentSemIdx > 0;
  };

  const hasNextWeek = () => {
    const idx = availableWeeks.indexOf(currentWeek);
    if (idx < availableWeeks.length - 1) return true;
    const sortedSems = [...semesters].sort((a, b) => Number(a.start_week) - Number(b.start_week));
    const currentSemIdx = sortedSems.findIndex(s => s.semester_id === selectedSemester?.semester_id);
    return currentSemIdx !== -1 && currentSemIdx < sortedSems.length - 1;
  };

  const handlePrevWeek = () => {
    const idx = availableWeeks.indexOf(currentWeek);
    if (idx > 0) {
      setCurrentWeek(availableWeeks[idx - 1]);
    } else {
      const sortedSems = [...semesters].sort((a, b) => Number(a.start_week) - Number(b.start_week));
      const currentSemIdx = sortedSems.findIndex(s => s.semester_id === selectedSemester?.semester_id);
      if (currentSemIdx > 0) {
        const prevSem = sortedSems[currentSemIdx - 1];
        setSelectedSemester(prevSem);
        const prevSemWeeks = getAvailableWeeks(prevSem);
        setCurrentWeek(prevSemWeeks[prevSemWeeks.length - 1]);
      }
    }
  };

  const handleNextWeek = () => {
    const idx = availableWeeks.indexOf(currentWeek);
    if (idx < availableWeeks.length - 1) {
      setCurrentWeek(availableWeeks[idx + 1]);
    } else {
      const sortedSems = [...semesters].sort((a, b) => Number(a.start_week) - Number(b.start_week));
      const currentSemIdx = sortedSems.findIndex(s => s.semester_id === selectedSemester?.semester_id);
      if (currentSemIdx !== -1 && currentSemIdx < sortedSems.length - 1) {
        const nextSem = sortedSems[currentSemIdx + 1];
        setSelectedSemester(nextSem);
        const nextSemWeeks = getAvailableWeeks(nextSem);
        setCurrentWeek(nextSemWeeks[0]);
      }
    }
  };

  // Lấy các tiết học có trong tuần này
  const allSlots = [];
  for (let slot = 1; slot <= 12; slot++) {
    allSlots.push(slot);
  }

  // Kiểm tra có lịch ở slot và ngày này không
  const getScheduleForDaySlot = (dayNum, slot) => {
    return weekSchedules.filter(s =>
      Number(s.day_of_week) === dayNum &&
      Number(s.start_slot) <= slot &&
      Number(s.end_slot) >= slot
    );
  };

  return (
    <div className="schedule-layout">
      {/* NAVBAR */}
      <Header view="schedule" />

      <div className="schedule-content">
        <div className="schedule-header-row">
          <div className="schedule-title-group">
            <h1 className="schedule-title">📅 Thời Khóa Biểu</h1>
            <div className="today-date-badge">
              📍 Hôm nay: {getTodayString()}
            </div>
          </div>

          {/* Semester selector */}
          {semesters.length > 0 && (
            <select
              className="semester-selector"
              value={selectedSemester?.semester_id || ''}
              onChange={(e) => {
                const sem = semesters.find(s => String(s.semester_id) === String(e.target.value));
                setSelectedSemester(sem);
                if (sem) {
                  const todayWeek = getISOWeek(new Date());
                  const semWeeks = getAvailableWeeks(sem);
                  if (semWeeks.includes(todayWeek)) {
                    setCurrentWeek(todayWeek);
                  } else {
                    setCurrentWeek(semWeeks[0] || 1);
                  }
                }
              }}
            >
              {semesters.map(sem => (
                <option key={sem.semester_id} value={sem.semester_id}>
                  {sem.semester_name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Week selector */}
        <div className="week-selector-row">
          <button
            className="week-nav-btn"
            onClick={handlePrevWeek}
            disabled={!hasPrevWeek()}
          >
            ← Tuần trước
          </button>

          <div className="week-display">
            {availableWeeks.length > 0 ? (
              <>
                <span className="week-label">Tuần {currentWeek}</span>
                <div className="week-dots">
                  {availableWeeks.map(w => (
                    <button
                      key={w}
                      className={`week-dot ${w === currentWeek ? 'active' : ''}`}
                      onClick={() => setCurrentWeek(w)}
                      title={`Tuần ${w}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <span className="week-label">Tuần {currentWeek}</span>
            )}
          </div>

          <button
            className="week-nav-btn"
            onClick={handleNextWeek}
            disabled={!hasNextWeek()}
          >
            Tuần sau →
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="schedule-loading">
            <div className="loading-spinner"></div>
            <p>Đang tải thời khóa biểu...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="schedule-error">
            <p>❌ {error}</p>
            <button onClick={fetchData}>Thử lại</button>
          </div>
        )}

        {/* Schedule grid */}
        {!loading && !error && (
          <div className="schedule-grid-wrapper">
            <table className="schedule-grid">
              <thead>
                <tr>
                  <th className="slot-header">Tiết</th>
                  <th className="slot-header time-header">Giờ</th>
                  {DAYS.map((day, index) => {
                    const dateObj = weekDates[index];
                    const isToday = dateObj ? (
                      dateObj.getDate() === new Date().getDate() &&
                      dateObj.getMonth() === new Date().getMonth() &&
                      dateObj.getFullYear() === new Date().getFullYear()
                    ) : false;

                    return (
                      <th 
                        key={day} 
                        className={`day-header ${isToday ? 'today-column-header' : ''}`}
                      >
                        <div>{day}</div>
                        {dateObj && <div className="day-date-sub">{formatDateDDMM(dateObj)}</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {allSlots.map(slot => {
                  const slotTime = SLOT_TIMES[slot];
                  return (
                    <tr key={slot} className="schedule-row">
                      <td className="slot-number">{slot}</td>
                      <td className="slot-time">
                        {slotTime ? `${slotTime.start}` : ''}
                      </td>
                      {DAY_NUMBERS.map((dayNum, index) => {
                        const items = getScheduleForDaySlot(dayNum, slot);
                        const dateObj = weekDates[index];
                        const isToday = dateObj ? (
                          dateObj.getDate() === new Date().getDate() &&
                          dateObj.getMonth() === new Date().getMonth() &&
                          dateObj.getFullYear() === new Date().getFullYear()
                        ) : false;

                        return (
                          <td key={dayNum} className={`schedule-cell ${isToday ? 'today-cell' : ''}`}>
                            {items.map((item, idx) => (
                              <div
                                key={idx}
                                className="schedule-item"
                                style={{
                                  backgroundColor: getColorForClass(item.class_id),
                                }}
                                title={`Phòng: ${item.room_name || 'N/A'} | Lớp: ${item.class_id}`}
                              >
                                <div className="schedule-item-class">Lớp {item.class_id}</div>
                                {item.room_name && (
                                  <div className="schedule-item-room">📍 {item.room_name}</div>
                                )}
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Empty state */}
            {weekSchedules.length === 0 && (
              <div className="schedule-empty">
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <p>Không có lịch học nào trong tuần {currentWeek}.</p>
                {availableWeeks.length > 0 && (
                  <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
                    Có lịch ở các tuần: {availableWeeks.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Schedule;
