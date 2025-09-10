import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

const Header = ({ showBackButton = false, backUrl = '/' }) => {
  return (
    <header className={`${styles.header} fixed w-full top-0 z-50`}>
      <div className="container mx-auto px-4 w-full flex items-center justify-center">
        {showBackButton && (
          <Link to={backUrl} className="text-white absolute left-4">
            <i className="ri-arrow-left-line text-xl"></i>
          </Link>
        )}
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
          <span className="text-white arabic text-3xl" style={{fontFamily: "'Reem Kufi', sans-serif"}}>
            مدرسہ العائشہ
          </span>
         {/*<span className="text-white opacity-30 text-xs  md:border-l md:border-white md:border-opacity-30 md:pl-4" style={{fontFamily: "'Playfair Display', sans-serif"}}>
           Ancient Wisdom for the Modern Student
         </span>*/}
        </div>
        {showBackButton && <div className="w-6"></div>}
      </div>
    </header>
  );
};

export default Header;