// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/global.css';
import Home from './pages/Home/Home';
import StudentLogin from './pages/StudentLogin/StudentLogin';
import TeacherLogin from './pages/TeacherLogin/TeacherLogin';
import TeacherLanding from './pages/TeacherLanding/TeacherLanding';
import TeacherPanel from './pages/TeacherPanel/TeacherPanel';
import StudentPanel from './pages/StudentPanel/StudentPanel';
import StudentManagement from './pages/StudentManagement/StudentManagement';
import FileManagement from './pages/FileManagement/FileManagement';

function App() {
  // Initialize preloaded files in localStorage
  useEffect(() => {
    const preloadedFiles = [
      { name: '6-Kalmay.pdf', path: '/files/6-Kalmay.pdf' },
      { name: 'Ayatul-Kursi-With-Urdu-and-English-Translation.jpg', path: '/files/Ayatul-Kursi-With-Urdu-and-English-Translation.jpg' },
      { name: 'dua-e-qunoot Eng.jpg', path: '/files/dua-e-qunoot Eng.jpg' },
      { name: 'dua-e-qunoot Urdu.jpg', path: '/files/dua-e-qunoot Urdu.jpg' },
      { name: 'Eman-e-Mufassal.jpg', path: '/files/Eman-e-Mufassal.jpg' },
      { name: 'Eman-e-Mujmal.jpg', path: '/files/Eman-e-Mujmal.jpg' }
    ];

    // Store in localStorage for easy access
    localStorage.setItem('preloaded_files', JSON.stringify(preloadedFiles));
    console.log('Preloaded files initialized:', preloadedFiles.length);
  }, []);

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