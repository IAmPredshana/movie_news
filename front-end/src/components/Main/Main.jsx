import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useStore';
import styles from './Main.module.css';

export default function Main() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const navigate = useNavigate();
    const { getArticles } = useAuthStore();

    const fetchNews = async (pageNum = 1, append = false) => {
        if (pageNum === 1) {
            setLoading(true);
        }
        
        setError('');
        
        try {
            const result = await getArticles({
                page: pageNum,
                pageSize: 10
            });
            
            if (!result.success) {
                throw new Error(result.error || 'Ошибка при загрузке статей');
            }
            
            console.log('Полный ответ от сервера:', result.data);
            
            let articles = [];
            
            if (result.data?.articles?.result && Array.isArray(result.data.articles.result)) {
                articles = result.data.articles.result;
            } else if (result.data?.articles && Array.isArray(result.data.articles)) {
                articles = result.data.articles;
            } else if (Array.isArray(result.data)) {
                articles = result.data;
            } else {
                articles = [];
            }
            
            if (append) {
                setNews(prev => [...prev, ...articles]);
            } else {

                setNews(articles);
            }
            
            const pagination = result.data?.pagination;
            if (pagination) {
                setHasMore(pagination.hasMore || false);
            } else {
                setHasMore(articles.length === 10);
            }
            
        } catch (err) {
            setError(err.message);
            console.error('Ошибка при загрузке статей:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchNews(nextPage, true);
    };

    useEffect(() => {
        fetchNews(1, false);
    }, []);

    const handleDetailsClick = (articleId) => {
        navigate(`/news/${articleId}`);
    };

    if (loading && news.length === 0) return <div className={styles.loading}>Загрузка статей...</div>;
    if (error) return <div className={styles.error}>Ошибка: {error}</div>;

    return(
        <div className={styles.container}>
            <h1 className={styles.title}>Главная страница</h1>
            
            {news.length === 0 && !loading ? (
                <div className={styles.noArticles}>
                    Статьи не найдены. Будьте первым, кто напишет статью!
                </div>
            ) : (
                <>
                    <div className={styles.articlesList}>
                        {news.map(article => (
                            <div key={article.id} className={styles.articleCard}>
                                {article.image && (
                                    <div className={styles.articleImage}>
                                        <img
                                            src={article.image} 
                                            alt={article.title}
                                            className={styles.articleImage}
                                        />
                                    </div>
                                )}
                                
                                <h3 className={styles.articleTitle}>{article.title}</h3>
                                
                                <div className={styles.articleMeta}>
                                    <span className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Автор:</span>
                                        <span className={styles.author}>
                                            {article.author?.userName || 'Неизвестно'}
                                        </span>
                                    </span>
                                    
                                    <span className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Просмотры:</span>
                                        <span className={styles.views}>{article.viewCount || 0}</span>
                                    </span>
                                    
                                    <span className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Лайки:</span>
                                        <span className={styles.likes}>{article.likesCount || 0}</span>
                                    </span>
                                    
                                    <span className={styles.metaItem}>
                                        <span className={styles.metaLabel}>Комментарии:</span>
                                        <span className={styles.comments}>{article.commentsCount || 0}</span>
                                    </span>
                                </div>

                                <div className={styles.articleContent}>
                                    {article.content ? 
                                        (article.content.length > 150 
                                            ? article.content.substring(0, 150) + '...' 
                                            : article.content)
                                        : 'Содержание отсутствует'
                                    }
                                </div>

                                {article.tags && article.tags.length > 0 && (
                                    <div className={styles.tags}>
                                        <span className={styles.metaLabel}>Теги:</span>
                                        {article.tags.map((tag, index) => (
                                            <span key={index} className={styles.tag}>#{tag}</span>
                                        ))}
                                    </div>
                                )}

                                <div className={styles.articleFooter}>
                                    <span className={styles.date}>
                                        Дата: {article.createdAt ? new Date(article.createdAt).toLocaleDateString('ru-RU') : ''}
                                    </span>
                                    
                                    <button 
                                        className={styles.detailsButton}
                                        onClick={() => handleDetailsClick(article.id)}
                                    >
                                        Подробнее
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasMore && (
                        <div className={styles.loadMoreSection}>
                            <button 
                                onClick={loadMore}
                                disabled={loading}
                                className={styles.loadMoreButton}
                            >
                                {loading ? 'Загрузка...' : 'Загрузить еще'}
                            </button>
                        </div>
                    )}

                    {!hasMore && news.length > 0 && (
                        <div className={styles.noMoreArticles}>
                            Все статьи загружены
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
