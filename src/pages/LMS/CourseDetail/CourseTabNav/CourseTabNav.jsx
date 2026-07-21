import React from 'react';
import './CourseTabNav.css';

/**
 * CourseTabNav — Thanh chuyển tab giữa "Khóa học" và "Điểm"
 * Props:
 *  - activeTab: string ('khoahoc' | 'diem')
 *  - onTabChange: fn(tabName)
 */
function CourseTabNav({ activeTab, onTabChange }) {
  return (
    <div className="tabs-bar">
      <button
        className={`tab-button ${activeTab === 'khoahoc' ? 'active' : 'inactive'}`}
        onClick={() => onTabChange('khoahoc')}
      >
        Khóa học
      </button>
      <button
        className={`tab-button ${activeTab === 'diem' ? 'active' : 'inactive'}`}
        onClick={() => onTabChange('diem')}
      >
        Điểm
      </button>
    </div>
  );
}

export default CourseTabNav;
