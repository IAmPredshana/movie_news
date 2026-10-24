import useAuthStore from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import styles from "./InfoAboutAccount.module.css";

export default function InfoAboutAccount() {
    const { logout, user, getCurrentUser, getArticles, deleteArticle } = useAuthStore();
    const navigate = useNavigate();
    const [userArticles, setUserArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            await getCurrentUser();
        };
        fetchUserData();
    }, []);

    const loadUserArticles = async () => {
        if (!user?.name) return;
        
        setIsLoading(true);
        try {
            const result = await getArticles({ username: user.name, page: 1, pageSize: 50 });
            
            if (result.success) {
                const articles = result.data?.articles?.result || [];
                
                const myArticles = articles.filter(article => 
                    article.author?.id === user.id || 
                    article.author?.userName === user.name
                );
                
                setUserArticles(myArticles);
            } else {
                setUserArticles([]);
            }
        } catch (error) {
            console.error('Ошибка загрузки статей:', error);
            setUserArticles([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUserArticles();
    }, [user]);

    const handleExit = function(){
        logout();
        alert("Пока!");
        navigate("/");
    }

    const handleAddNews = () => {
        navigate('/add_news')
    }

    const handleAddDay = () => {
        navigate('/event_form')
    }

    const handleDeleteArticle = async (articleId) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту статью?')) {
            return;
        }

        try {
            const result = await deleteArticle(articleId);
            if (result.success) {
                alert('Статья удалена!');
                loadUserArticles();
            } else {
                alert('Ошибка при удалении: ' + result.error);
            }
        } catch (error) {
            alert('Ошибка при удалении: ' + error.message);
        }
    };

    const handleEditArticle = (articleId) => {
        navigate(`/edit_news/${articleId}`);
    };

    const getRoleDisplay = () => {
        if (user?.role === undefined || user?.role === null) {
            return 'Не указан';
        }
        
        switch(user.role) {
            case 0:
                return 'Пользователь';
            case 1:
                return 'Кино-компания';
            default:
                return `Роль #${user.role}`;
        }
    }

    const isCinemaCompany = () => {
        return user?.role === 1;
    }

    const truncateText = (text, maxLength = 150) => {
        if (!text) return 'Нет содержания';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <div className={styles.main_container}>
            <div className={styles.leftColumn}>
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Возможности аккаунта</h2>
                    </div>
                    <div className={styles.features}>
                        <button className={styles.featureBtn} onClick={handleAddNews}>
                            Добавить статью
                        </button>
                        
                        {isCinemaCompany() && (
                            <button className={styles.featureBtn} onClick={handleAddDay}>
                                Добавить событие в календарь
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Мои статьи ({userArticles.length})</h2>
                    </div>

                    <div className={styles.content}>
                        {isLoading ? (
                            <div className={styles.loading}>
                                Загрузка статей...
                            </div>
                        ) : userArticles.length === 0 ? (
                            <div className={styles.emptyState}>
                                <h3>У вас еще нет статей</h3>
                                <p>Создайте свою первую статью и поделитесь ею с сообществом</p>
                                <button className={styles.primaryBtn} onClick={handleAddNews}>
                                    Написать первую статью
                                </button>
                            </div>
                        ) : (
                            <div className={styles.articlesList}>
                                {userArticles.map(article => (
                                    <div key={article.id} className={styles.articleCard}>
                                        <div className={styles.articleInfo}>
                                            <h3 className={styles.articleTitle}>{article.title}</h3>
                                            <p className={styles.articleDescription}>
                                                {truncateText(article.content)}
                                            </p>
                                            <div className={styles.articleMeta}>
                                                <span>Просмотры: {article.viewCount || 0}</span>
                                                <span>Лайки: {article.likesCount || 0}</span>
                                                <span>Комментарии: {article.commentsCount || 0}</span>
                                            </div>
                                            <div className={styles.articleDate}>
                                                Создано: {new Date(article.createdAt).toLocaleDateString('ru-RU')}
                                            </div>
                                            {article.tags && article.tags.length > 0 && (
                                                <div className={styles.articleTags}>
                                                    Теги: {article.tags.join(', ')}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.articleActions}>
                                            <button 
                                                className={styles.editBtn}
                                                onClick={() => handleEditArticle(article.id)}
                                            >
                                                Редактировать
                                            </button>
                                            <button 
                                                className={styles.deleteBtn}
                                                onClick={() => handleDeleteArticle(article.id)}
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles.rightColumn}>
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2>Информация об аккаунте</h2>
                    </div>
                    <div className={styles.accountInfo}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Имя пользователя:</span>
                            <span className={styles.infoValue}>{user?.name || 'Не указано'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Почта:</span>
                            <span className={styles.infoValue}>{user?.email || 'Не указана'}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Тип аккаунта:</span>
                            <span className={styles.infoValue}>{getRoleDisplay()}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>Дата регистрации:</span>
                            <span className={styles.infoValue}>
                                {user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Не указана'}
                            </span>
                        </div>
                    </div>
                    <div className={styles.logoutSection}>
                        <button className={styles.logoutBtn} onClick={handleExit}>
                            Выйти из аккаунта
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}