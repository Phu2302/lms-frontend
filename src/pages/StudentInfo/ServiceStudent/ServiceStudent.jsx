import React from 'react';
import ConfirmStudent from './ConfirmStudent/ConfirmStudent';
import CardStudent from './CardStudent/CardStudent';
import CourseWithdrawal from './CourseWithdrawal/CourseWithdrawal';
import GradeAppeal from './GradeAppeal/GradeAppeal';
import './ServiceStudent.css';

function ServiceStudent({ type = 'cert' }) {
  if (type === 'card') {
    return <CardStudent />;
  }
  if (type === 'withdraw') {
    return <CourseWithdrawal />;
  }
  if (type === 'appeal') {
    return <GradeAppeal />;
  }
  return <ConfirmStudent />;
}

export default ServiceStudent;
