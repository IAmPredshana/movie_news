import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Calendar.module.css';

const Calendar = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const generateCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const calendar = [];
    
    for (let i = 0; i < startingDay; i++) {
      calendar.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(new Date(year, month, day));
    }
    
    return calendar;
  };

  const handleDayClick = (date) => {
    if (!date) return;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    navigate(`/calendar/${dateString}`);
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const calendarDays = generateCalendar();
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  return (
    <div className={styles.calendarPage}>
      <h1>Календарь событий</h1>
      
      <div className={styles.calendarContainer}>
        <div className={styles.calendarHeader}>
          <button 
            onClick={goToPreviousMonth}
            className={styles.navButton}
          >
            ‹
          </button>
          
          <h2 className={styles.monthTitle}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button 
            onClick={goToNextMonth}
            className={styles.navButton}
          >
            ›
          </button>
        </div>

        <div className={styles.weekDays}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
            <div key={day} className={styles.weekDay}>
              {day}
            </div>
          ))}
        </div>

        <div className={styles.calendarGrid}>
          {calendarDays.map((date, index) => (
            <div
              key={index}
              className={`${styles.calendarDay} ${
                !date ? styles.emptyDay : ''
              } ${isToday(date) ? styles.today : ''}`}
              onClick={() => handleDayClick(date)}
            >
              {date && (
                <span className={styles.dayNumber}>
                  {date.getDate()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.hint}>
        Нажмите на любой день, чтобы посмотреть события
      </div>
    </div>
  );
};

export default Calendar;