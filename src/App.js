// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/global.css'; // Moved to top
import Home from './pages/Home/Home';
import StudentLogin from './pages/StudentLogin/StudentLogin';
import TeacherLogin from './pages/TeacherLogin/TeacherLogin';
import TeacherLanding from './pages/TeacherLanding/TeacherLanding';
import TeacherPanel from './pages/TeacherPanel/TeacherPanel';
import StudentPanel from './pages/StudentPanel/StudentPanel';
import StudentManagement from './pages/StudentManagement/StudentManagement';
import FileManagement from './pages/FileManagement/FileManagement';

function App() {
  return (

    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/teacher-login" element={<TeacherLogin />} />
        <Route path="/teacher-landing" element={<TeacherLanding />} />
        <Route path="/teacher-panel" element={<TeacherPanel />} />
        <Route path="/student-panel" element={<StudentPanel />} />
        <Route path="/student-management" element={<StudentManagement />} />
        <Route path="/file-management" element={<FileManagement />} />
      </Routes>
    </Router>
  );
}

export default App;