import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/useStore';
import styles from './DayInCalendar.module.css';

const DayInCalendar = () => {
  const { date } = useParams();
  const navigate = useNavigate();
  const { getEvents, user, isLoading } = useAuthStore();
  const [events, setEvents] = useState([]);

  const parsedDate = date ? new Date(date) : new Date();
  
  useEffect(() => {
    const loadEvents = async () => {
      if (!date) return;

      try {
        const result = await getEvents(date);
        if (result.success) {
          setEvents(result.data || []);
        }
      } catch (error) {
        console.error('Ошибка загрузки событий:', error);
        setEvents([]);
      }
    };

    loadEvents();
  }, [date, getEvents]);

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };

  const isToday = () => {
    const today = new Date();
    return parsedDate.toDateString() === today.toDateString();
  };

  if (!date) {
    return <div>Дата не указана</div>;
  }

  return (
    <div className={styles.dayPage}>
      <div className={styles.navigation}>
        <Link to="/calendar" className={styles.backButton}>
          ← Назад к календарю
        </Link>
        
        <h1 className={styles.dayTitle}>
          {parsedDate.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
          {isToday() && <span className={styles.todayBadge}>Сегодня</span>}
        </h1>
      </div>

      <div className={styles.eventsSection}>
        {isLoading ? (
          <div className={styles.loading}>Загрузка событий...</div>
        ) : events.length === 0 ? (
          <div className={styles.noEvents}>
            <h3>На этот день событий нет</h3>
          </div>
        ) : (
          <div className={styles.eventsList}>
            <h3>События дня</h3>
            {events.map(event => (
              <div key={event.id} className={styles.eventCard}>
                <div className={styles.eventHeader}>
                  <h4 className={styles.eventName}>{event.title}</h4>
                  <span className={styles.eventTime}>
                    Время: {formatTime(event.event_time)}
                  </span>
                </div>
                
                <p className={styles.eventDescription}>
                  {event.description}
                </p>
                
                <div className={styles.eventFooter}>
                  <span className={styles.eventAuthor}>
                    Автор: {event.user?.name}
                  </span>
                  <span className={styles.eventDate}>
                    Добавлено: {new Date(event.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DayInCalendar;