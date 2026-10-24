import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useStore';
import styles from './EventForm.module.css';

const EventForm = ({ selectedDate, onEventCreated, onCancel }) => {
  const { createEvent, user, isLoading, error } = useAuthStore();
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: selectedDate || '',
    event_time: '12:00'
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        event_date: selectedDate
      }));
    }
  }, [selectedDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formError) setFormError('');
  };

  const back = () =>{
    navigate(-1);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setFormError('Название события обязательно');
      return;
    }
    
    if (!formData.description.trim()) {
      setFormError('Описание события обязательно');
      return;
    }
    
    if (!formData.event_date) {
      setFormError('Дата события обязательна');
      return;
    }

    try {
      const [hours, minutes] = formData.event_time.split(':');
      const eventTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
      
      const result = await createEvent({
        title: formData.title.trim(),
        description: formData.description.trim(),
        event_date: formData.event_date,
        event_time: eventTime
      });

      if (result.success) {
        setFormData({
          title: '',
          description: '',
          event_date: selectedDate || '',
          event_time: '12:00'
        });

        if (onEventCreated) {
          onEventCreated(result.data.eventItem || result.data);
        }
        
        setFormError('');
      } else {
        setFormError(result.error);
      }
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (!user) {
    return (
      <div className={styles.eventFormContainer}>
        <div className={styles.alertWarning}>
          Для создания событий необходимо войти в систему
        </div>
      </div>
    );
  }

  return (
    <div className={styles.eventFormContainer}>
      <div>
          <button className={styles.btn_back} onClick={back}>Назад</button>
      </div>
      <h3 className={styles.title}>Добавить событие</h3>
      
      {(error || formError) && (
        <div className={styles.alertError}>
          {formError || error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.eventForm}>
        <div className={styles.formSidebar}>
          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              Название события
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Введите название события"
              maxLength={100}
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="event_date" className={styles.label}>
                Дата события
              </label>
              <input
                type="date"
                id="event_date"
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="event_time" className={styles.label}>
                Время события
              </label>
              <input
                type="time"
                id="event_time"
                name="event_time"
                value={formData.event_time}
                onChange={handleChange}
                className={styles.input}
                required
              />
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button 
              type="submit" 
              disabled={isLoading}
              className={styles.btnPrimary}
            >
              {isLoading ? 'Создание...' : 'Создать событие'}
            </button>
            
            {onCancel && (
              <button 
                type="button"
                onClick={onCancel}
                className={styles.btnSecondary}
              >
                Отмена
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.formContent}>
          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Описание события
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={12}
              maxLength={500}
              className={styles.textarea}
              required
            />
            {/* <div className={styles.charCount}>
              {formData.description.length}/500 символов
            </div> */}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EventForm;