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
    contact: '', 
    age: '', 
    password: '' 
  });
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const modalRef = useRef(null);

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
      const docRef = await addDoc(collection(db, 'students'), {
        ...newStudent,
        createdAt: new Date().toISOString()
      });
      setStudents([...students, { id: docRef.id, ...newStudent }]);
      setShowAddModal(false);
      setNewStudent({ name: '', username: '', contact: '', age: '', password: '' });
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
      await updateDoc(doc(db, 'students', selectedStudent.id), {
        ...selectedStudent
      });
      setStudents(students.map(student => 
        student.id === selectedStudent.id ? selectedStudent : student
      ));
      setEditMode(false);
      setShowDetailModal(false);
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  const openStudentDetails = (student) => {
    setSelectedStudent(student);
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
          className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-lg mb-4 flex items-center"
        >
          <i className="ri-user-add-line mr-2"></i> Add New Student
        </button>

        <div className={`${styles.panelSection} p-4`}>
          <div className="overflow-y-auto max-h-[calc(100vh-255px)]">
            <div className="space-y-2">
              {students.map(student => (
                <div key={student.id} className="flex justify-between items-center p-3 hover:bg-white hover:bg-opacity-5 rounded cursor-pointer" onClick={() => openStudentDetails(student)}>
                  <div>
                    <div className="text-white font-medium hover:text-amber-400">{student.name}</div>
                    <div className="text-gray-400 text-sm">{student.contact}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${styles.panelSection} p-6 max-w-md w-full`} ref={modalRef}>
              <h3 className="text-white text-heading mb-4">Add Student</h3>
              <div className="space-y-4">
                <input 
                  type="text" 
                  placeholder="Full Name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full p-2 bg-black bg-opacity-30 text-white rounded"
                />
                <input 
                  type="text" 
                  placeholder="Username"
                  value={newStudent.username}
                  onChange={(e) => setNewStudent({...newStudent, username: e.target.value})}
                  className="w-full p-2 bg-black bg-opacity-30 text-white rounded"
                />                
                <input 
                  type="text" 
                  placeholder="Email/Phone"
                  value={newStudent.contact}
                  onChange={(e) => setNewStudent({...newStudent, contact: e.target.value})}
                  className="w-full p-2 bg-black bg-opacity-30 text-white rounded"
                />
                <input 
                  type="number" 
                  placeholder="Age"
                  value={newStudent.age}
                  onChange={(e) => setNewStudent({...newStudent, age: e.target.value})}
                  className="w-full p-2 bg-black bg-opacity-30 text-white rounded"
                />
                <input 
                  type="text" 
                  placeholder="Password"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                  className="w-full p-2 bg-black bg-opacity-30 text-white rounded"
                />
                <div className="flex space-x-2">
                  <button 
                    onClick={closeAllModals}
                    className="bg-gray-600 text-white py-2 px-4 rounded-lg flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddStudent}
                    className="bg-amber-600 text-white py-2 px-4 rounded-lg flex-1"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Student Details Modal */}
        {showDetailModal && selectedStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${styles.panelSection} p-6 max-w-md w-full`} ref={modalRef}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white text-heading">Student Details</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditMode(!editMode);
                    }}
                    className="text-blue-400 hover:text-blue-300 p-1"
                  >
                    <i className="ri-edit-line"></i>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    className="text-red-400 hover:text-red-300 p-1"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div>
                  <label className="text-gray-400 text-sm">Name</label>
                  {editMode ? (
                    <input 
                      type="text" 
                      value={selectedStudent.name}
                      onChange={(e) => setSelectedStudent({...selectedStudent, name: e.target.value})}
                      className="w-full p-2 bg-black bg-opacity-30 text-white rounded"
                    />
                  ) : (
                    <div className="text-white p-2">{selectedStudent.name}</div>
                  )}
                </div>

                <div>
                  <label className="text-gray-400 text-sm">Username</label>
                  {editMode ? (
                    <input 
                      type="text" 
                      value={selectedStudent.username}
                      onChange={(e) => setSelectedStudent({...selectedStudent, username: e.target.value})}
                      className="w-full p-2 bg-black bg-opacity-30 text-white rounded"
                    />
                  ) : (
                    <div className="text-white p-2">{selectedStudent.username}</div>
                  )}
                </div>

                <div>
                  <label className="text-gray-400 text-sm">Contact</label>
                  {editMode ? (
                    <input 
                      type="text" 
                      value={selectedStudent.contact}
                      onChange={(e) => setSelectedStudent({...selectedStudent, contact: e.target.value})}
                      className="w-full p-2 bg-black bg-opacity-30 text-white rounded"
                    />
                  ) : (
                    <div className="text-white p-2">{selectedStudent.contact}</div>
                  )}
                </div>

                <div>
                  <label className="text-gray-400 text-sm">Age</label>
                  {editMode ? (
                    <input 
                      type="number" 
                      value={selectedStudent.age}
                      onChange={(e) => setSelectedStudent({...selectedStudent, age: e.target.value})}
                      className="w-full p-2 bg-black bg-opacity-30 text-white rounded"
                    />
                  ) : (
                    <div className="text-white p-2">{selectedStudent.age}</div>
                  )}
                </div>

                <div>
                  <label className="text-gray-400 text-sm">Password</label>
                  {editMode ? (
                    <input 
                      type="text" 
                      value={selectedStudent.password}
                      onChange={(e) => setSelectedStudent({...selectedStudent, password: e.target.value})}
                      className="w-full p-2 bg-black bg-opacity-30 text-white rounded"
                    />
                  ) : (
                    <div className="text-white p-2">{selectedStudent.password}</div>
                  )}
                </div>

                <div>
                  <label className="text-gray-400 text-sm">Created At</label>
                  <div className="text-white p-2">
                    {new Date(selectedStudent.createdAt).toLocaleString()}
                  </div>
                </div>

                {editMode && (
                  <div className="flex space-x-2 pt-2">
                    <button 
                      onClick={() => {
                        setEditMode(false);
                        setShowDetailModal(false);
                      }}
                      className="bg-gray-600 text-white py-2 px-4 rounded-lg flex-1"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleUpdateStudent}
                      className="bg-amber-600 text-white py-2 px-4 rounded-lg flex-1"
                    >
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${styles.panelSection} p-6 max-w-md w-full`} ref={modalRef}>
              <h3 className="text-white text-heading mb-4">Confirm Delete</h3>
              <p className="text-white mb-6">Are you sure you want to delete {selectedStudent?.name}?</p>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-gray-600 text-white py-2 px-4 rounded-lg flex-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteStudent}
                  className="bg-red-600 text-white py-2 px-4 rounded-lg flex-1"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentManagement;