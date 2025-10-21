import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import Header from '../../components/Header/Header';
import styles from './StudentLogin.module.css';

const StudentLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Comment out auto-login for testing multiple students
  // useEffect(() => {
  //   const savedStudent = localStorage.getItem('currentStudent');
  //   if (savedStudent) {
  //     navigate('/student-panel');
  //   }
  // }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Query students collection for matching credentials
      const studentsQuery = query(
        collection(db, 'students'),
        where('username', '==', username),
        where('password', '==', password)
      );

      const querySnapshot = await getDocs(studentsQuery);
      
      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        const studentData = {
          id: studentDoc.id,
          ...studentDoc.data()
        };

        // Save student data to localStorage and context
        localStorage.setItem('currentStudent', JSON.stringify(studentData));
        navigate('/student-panel');
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="pt-[55px] flex-grow">
        <section className={styles.heroSection}>
          <div className={`${styles.heroContent} container mx-auto px-4 py-16`}>
            <h1 className="mb-6 text-heading">
              Student Login
            </h1>
            
            <form onSubmit={handleLogin} className="max-w-md mx-auto">
              <div className="mb-4">
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-3 rounded bg-black bg-opacity-50 text-white border border-gray-600"
                  placeholder="Username"
                  required
                />
              </div>
              
              <div className="mb-6">
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 rounded bg-black bg-opacity-50 text-white border border-gray-600"
                  placeholder="Password"
                  required
                />
              </div>

              {error && (
                <div className="mb-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            
            <p className="text-white text-opacity-70 mt-6 text-note">
              Contact your teacher if you forgot your credentials.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default StudentLogin;