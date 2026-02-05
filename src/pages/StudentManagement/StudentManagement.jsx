// src/pages/StudentManagement/StudentManagement.jsx
import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import Header from '../../components/Header/Header';
import styles from './StudentManagement.module.css';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [newStudent, setNewStudent] = useState({ 
    name: '', 
    username: '',
    age: '', 
    contact: '',
    studentSince: '', // Will store as "YYYY-MM" for month picker
    password: ''
  });
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const modalRef = useRef(null);

  // Function to convert month-year string to ISO date (1st of month, 00:00:00)
  const convertMonthYearToDate = (monthYear) => {
    if (!monthYear) return '';
    try {
      const [year, month] = monthYear.split('-');
      // Create date for 1st of the month at 00:00:00
      const date = new Date(year, month - 1, 1, 0, 0, 0, 0);
      return date.toISOString();
    } catch (error) {
      console.error('Error converting monthYear to date:', error);
      return '';
    }
  };

  // Function to convert ISO date back to month-year string
  const convertDateToMonthYear = (isoDate) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    } catch (error) {
      console.error('Error converting date to monthYear:', error);
      return '';
    }
  };

  // Calculate timestamps and status defaults according to your requirements
  const calculateBackgroundFields = () => {
    const now = new Date();
    
    // createdAt: 2 hours before current time
    const createdAt = new Date(now.getTime() - (2 * 60 * 60 * 1000));
    
    // lastLogin: 30 minutes after createdAt
    const lastLogin = new Date(createdAt.getTime() + (30 * 60 * 1000));
    
    // lastSeen: 5 minutes after lastLogin
    const lastSeen = new Date(lastLogin.getTime() + (5 * 60 * 1000));
    
    return {
      createdAt: createdAt.toISOString(),
      lastLogin: lastLogin.toISOString(),
      lastSeen: lastSeen.toISOString(),
      isActive: true, // Default value
      onlineStatus: 'online' // Default value
    };
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        if (showDetailModal && !editMode && !showDeleteConfirm) {
          setShowDetailModal(false);
        }
        if (showAddModal) {
          setShowAddModal(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDetailModal, showAddModal, editMode, showDeleteConfirm]);

  // Fetch students from Firestore
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'students'));
        const studentsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStudents(studentsData);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
    fetchStudents();
  }, []);

  const handleAddStudent = async () => {
    try {
      // Calculate the background fields (timestamps and status)
      const backgroundFields = calculateBackgroundFields();
      
      // Convert month-year to full date (1st of month, 00:00:00)
      const studentSinceDate = newStudent.studentSince ? convertMonthYearToDate(newStudent.studentSince) : '';
      
      const docRef = await addDoc(collection(db, 'students'), {
        name: newStudent.name,
        username: newStudent.username,
        age: Number(newStudent.age),
        contact: newStudent.contact,
        studentSince: studentSinceDate,
        password: newStudent.password,
        // Add background fields
        isActive: backgroundFields.isActive,
        onlineStatus: backgroundFields.onlineStatus,
        createdAt: backgroundFields.createdAt,
        lastLogin: backgroundFields.lastLogin,
        lastSeen: backgroundFields.lastSeen
      });
      
      setStudents([...students, { 
        id: docRef.id, 
        ...newStudent,
        age: Number(newStudent.age),
        studentSince: studentSinceDate,
        // Include background fields in local state
        isActive: backgroundFields.isActive,
        onlineStatus: backgroundFields.onlineStatus,
        createdAt: backgroundFields.createdAt,
        lastLogin: backgroundFields.lastLogin,
        lastSeen: backgroundFields.lastSeen
      }]);
      
      setShowAddModal(false);
      // Reset form
      setNewStudent({ 
        name: '', 
        username: '',
        age: '', 
        contact: '',
        studentSince: '',
        password: ''
      });
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleDeleteStudent = async () => {
    try {
      await deleteDoc(doc(db, 'students', selectedStudent.id));
      setStudents(students.filter(student => student.id !== selectedStudent.id));
      setShowDeleteConfirm(false);
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const handleUpdateStudent = async () => {
    try {
      // Convert month-year to full date for update
      const studentSinceDate = selectedStudent.studentSince ? convertMonthYearToDate(selectedStudent.studentSince) : '';
      
      // Don't update background fields during edit (except isActive can be changed)
      await updateDoc(doc(db, 'students', selectedStudent.id), {
        name: selectedStudent.name,
        username: selectedStudent.username,
        age: Number(selectedStudent.age),
        contact: selectedStudent.contact,
        studentSince: studentSinceDate,
        password: selectedStudent.password,
        isActive: selectedStudent.isActive,
        onlineStatus: selectedStudent.onlineStatus
      });
      
      setStudents(students.map(student => 
        student.id === selectedStudent.id ? {
          ...selectedStudent,
          age: Number(selectedStudent.age),
          studentSince: studentSinceDate
        } : student
      ));
      setEditMode(false);
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  const openStudentDetails = (student) => {
    // Convert stored ISO date to month-year format for display
    const studentWithMonthYear = {
      ...student,
      studentSince: convertDateToMonthYear(student.studentSince)
    };
    setSelectedStudent(studentWithMonthYear);
    setShowDetailModal(true);
    setEditMode(false);
  };

  const closeAllModals = () => {
    setShowAddModal(false);
    setShowDetailModal(false);
    setEditMode(false);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header showBackButton backUrl="/teacher-landing" title="Manage Students" />
      
      <main className="flex-grow pt-20 pb-4 px-4">
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg mb-4 flex items-center transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <i className="ri-user-add-line mr-2"></i> Add New Student
        </button>

        <div className={`${styles.panelSection} p-4`}>
          <div className="overflow-y-auto max-h-[calc(100vh-255px)]">
            <div className="space-y-2">
              {students.map(student => (
                <div key={student.id} className="flex justify-between items-center p-3 hover:bg-white hover:bg-opacity-5 rounded cursor-pointer transition-all duration-200 hover:transform hover:scale-[1.02]" onClick={() => openStudentDetails(student)}>
                  <div>
                    <div className="text-white font-medium hover:text-amber-400 transition-colors duration-200">{student.name}</div>
                    <div className="text-gray-400 text-sm">{student.username} • {student.contact}</div>
                    {student.studentSince && (
                      <div className="text-gray-500 text-xs mt-1">
                        Student since: {new Date(student.studentSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${student.onlineStatus === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    <div className="text-gray-400 text-sm capitalize">{student.onlineStatus}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Student Modal - Made scrollable */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <div className={`${styles.panelSection} p-6 max-w-md w-full max-h-[90vh] flex flex-col animate-slideUp`} ref={modalRef}>
              <h3 className="text-white text-heading mb-4">Add Student</h3>
              <div className="overflow-y-auto pr-2 flex-grow">
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full p-2 bg-black bg-opacity-30 text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-black focus:bg-opacity-40"
                  />
                  <input 
                    type="text" 
                    placeholder="Username"
                    value={newStudent.username}
                    onChange={(e) => setNewStudent({...newStudent, username: e.target.value})}
                    className="w-full p-2 bg-black bg-opacity-30 text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-black focus:bg-opacity-40"
                  />                
                  <input 
                    type="number" 
                    placeholder="Age"
                    value={newStudent.age}
                    onChange={(e) => setNewStudent({...newStudent, age: e.target.value})}
                    className="w-full p-2 bg-black bg-opacity-30 text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-black focus:bg-opacity-40"
                  />
                  <input 
                    type="text" 
                    placeholder="Contact (Email/Phone)"
                    value={newStudent.contact}
                    onChange={(e) => setNewStudent({...newStudent, contact: e.target.value})}
                    className="w-full p-2 bg-black bg-opacity-30 text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-black focus:bg-opacity-40"
                  />
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Student Since (Month & Year)</label>
                    <input 
                      type="month" 
                      value={newStudent.studentSince}
                      onChange={(e) => setNewStudent({...newStudent, studentSince: e.target.value})}
                      className="w-full p-2 bg-black bg-opacity-30 text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-black focus:bg-opacity-40"
                    />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Password"
                    value={newStudent.password}
                    onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                    className="w-full p-2 bg-black bg-opacity-30 text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-black focus:bg-opacity-40"
                  />
                </div>
              </div>
              <div className="flex space-x-2 pt-4 mt-4 border-t border-gray-700">
                <button 
                  onClick={closeAllModals}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex-1 transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddStudent}
                  className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg flex-1 transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student Details Modal - Made scrollable */}
        {showDetailModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <div className={`${styles.panelSection} p-6 max-w-md w-full max-h-[90vh] flex flex-col animate-slideUp`} ref={modalRef}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white text-heading">Student Details</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditMode(!editMode);
                    }}
                    className="text-blue-400 hover:text-blue-300 p-1 transition-all duration-300 transform hover:scale-110 active:scale-95"
                  >
                    <i className="ri-edit-line text-lg"></i>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    className="text-red-400 hover:text-red-300 p-1 transition-all duration-300 transform hover:scale-110 active:scale-95"
                  >
                    <i className="ri-delete-bin-line text-lg"></i>
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto pr-2 flex-grow">
                <div className="space-y-3">
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Name</label>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={selectedStudent.name}
                        onChange={(e) => setSelectedStudent({...selectedStudent, name: e.target.value})}
                        className="w-full p-2 bg-black bg-opacity-30 text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-black focus:bg-opacity-40"
                      />
                    ) : (
                      <div className="text-white p-2 bg-black bg-opacity-20 rounded">{selectedStudent.name}</div>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Username</label>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={selectedStudent.username}
                        onChange={(e) => setSelectedStudent({...selectedStudent, username: e.target.value})}
                        className="w-full p-2 bg-black bg-opacity-30 text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-black focus:bg-opacity-40"
                      />
                    ) : (
                      <div className="text-white p-2 bg-black bg-opacity-20 rounded">{selectedStudent.username}</div>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Age</label>
                    {editMode ? (
                      <input 
                        type="number" 
                        value={selectedStudent.age}
                        onChange={(e) => setSelectedStudent({...selectedStudent, age: e.target.value})}
                        className="w-full p-2 bg-black bg-opacity-30 text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-black focus:bg-opacity-40"
                      />
                    ) : (
                      <div className="text-white p-2 bg-black bg-opacity-20 rounded">{selectedStudent.age}</div>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Contact</label>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={selectedStudent.contact}
                        onChange={(e) => setSelectedStudent({...selectedStudent, contact: e.target.value})}
                        className="w-full p-2 bg-black bg-opacity-30 text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-black focus:bg-opacity-40"
                      />
                    ) : (
                      <div className="text-white p-2 bg-black bg-opacity-20 rounded">{selectedStudent.contact}</div>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Student Since (Month & Year)</label>
                    {editMode ? (
                      <input 
                        type="month" 
                        value={selectedStudent.studentSince}
                        onChange={(e) => setSelectedStudent({...selectedStudent, studentSince: e.target.value})}
                        className="w-full p-2 bg-black bg-opacity-30 text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-black focus:bg-opacity-40"
                      />
                    ) : (
                      <div className="text-white p-2 bg-black bg-opacity-20 rounded">
                        {selectedStudent.studentSince ? 
                          new Date(selectedStudent.studentSince + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 
                          'N/A'
                        }
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Password</label>
                    {editMode ? (
                      <input 
                        type="text" 
                        value={selectedStudent.password}
                        onChange={(e) => setSelectedStudent({...selectedStudent, password: e.target.value})}
                        className="w-full p-2 bg-black bg-opacity-30 text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-black focus:bg-opacity-40"
                      />
                    ) : (
                      <div className="text-white p-2 bg-black bg-opacity-20 rounded">{selectedStudent.password}</div>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Active Status</label>
                    {editMode ? (
                      <div className="flex items-center mt-1 p-2 bg-black bg-opacity-20 rounded">
                        <input 
                          type="checkbox" 
                          id="editIsActive"
                          checked={selectedStudent.isActive}
                          onChange={(e) => setSelectedStudent({...selectedStudent, isActive: e.target.checked})}
                          className="mr-2 w-4 h-4 cursor-pointer transition-all duration-200"
                        />
                        <label htmlFor="editIsActive" className="text-white cursor-pointer">Active Student</label>
                      </div>
                    ) : (
                      <div className="text-white p-2 bg-black bg-opacity-20 rounded">
                        {selectedStudent.isActive ? 'Active' : 'Inactive'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Online Status</label>
                    {editMode ? (
                      <select 
                        value={selectedStudent.onlineStatus}
                        onChange={(e) => setSelectedStudent({...selectedStudent, onlineStatus: e.target.value})}
                        className="w-full p-2 bg-black bg-opacity-30 text-white rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-black focus:bg-opacity-40 cursor-pointer"
                      >
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="away">Away</option>
                      </select>
                    ) : (
                      <div className="flex items-center p-2 bg-black bg-opacity-20 rounded">
                        <div className={`w-2 h-2 rounded-full mr-2 ${selectedStudent.onlineStatus === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                        <div className="text-white capitalize">{selectedStudent.onlineStatus}</div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Created At</label>
                    <div className="text-white p-2 bg-black bg-opacity-20 rounded">
                      {selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleString() : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Last Login</label>
                    <div className="text-white p-2 bg-black bg-opacity-20 rounded">
                      {selectedStudent.lastLogin ? new Date(selectedStudent.lastLogin).toLocaleString() : 'N/A'}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Last Seen</label>
                    <div className="text-white p-2 bg-black bg-opacity-20 rounded">
                      {selectedStudent.lastSeen ? new Date(selectedStudent.lastSeen).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {editMode && (
                <div className="flex space-x-2 pt-4 mt-4 border-t border-gray-700">
                  <button 
                    onClick={() => {
                      setEditMode(false);
                      setShowDetailModal(false);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex-1 transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateStudent}
                    className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg flex-1 transition-all duration-300 transform hover:scale-105 active:scale-95"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
            <div className={`${styles.panelSection} p-6 max-w-md w-full animate-slideUp`} ref={modalRef}>
              <h3 className="text-white text-heading mb-4">Confirm Delete</h3>
              <p className="text-white mb-6">Are you sure you want to delete {selectedStudent?.name}?</p>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex-1 transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteStudent}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex-1 transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add CSS animations to your global styles or component styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StudentManagement;