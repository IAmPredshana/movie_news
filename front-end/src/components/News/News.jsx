import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useStore';
import styles from './News.module.css';

export default function News() {
    const { getArticles, getTags, isLoading } = useAuthStore();
    
    const [allArticles, setAllArticles] = useState([]);
    const [allTags, setAllTags] = useState([]);

    const navigate = useNavigate()
    
    const [filters, setFilters] = useState({
        title: '',
        tag: ''
    });
    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await getArticles({}); 
                console.log('Сырой ответ от сервера:', result);

                if (result.success) {
                    let articlesArray = [];

                    if (Array.isArray(result.data)) {
                        articlesArray = result.data;
                    } else if (result.data?.articles && Array.isArray(result.data.articles)) {
                        articlesArray = result.data.articles;
                    } else if (result.data?.articles?.result && Array.isArray(result.data.articles.result)) {
                        articlesArray = result.data.articles.result;
                    } else if (result.data?.result && Array.isArray(result.data.result)) {
                        articlesArray = result.data.result;
                    } else {
                        console.warn('Не удалось найти массив статей в ответе!', result.data);
                    }
                    
                    console.log('Успешно извлечен массив длиной:', articlesArray.length);
                    setAllArticles(articlesArray);
                }
            } catch (error) {
                console.error('Ошибка загрузки статей:', error);
                setAllArticles([]); 
            }

            try {
                const resultTags = await getTags();
                if (resultTags.success) {
                    setAllTags(resultTags.data || []);
                }
            } catch (error) {
                console.error('Ошибка загрузки тегов:', error);
            }
        };

        loadData();
    }, []);

    const safeArticles = Array.isArray(allArticles) ? allArticles : [];
    
    const filteredArticles = safeArticles.filter(article => {
        if (!article) return false;
        const matchesTitle = filters.title 
            ? article.title?.toLowerCase().includes(filters.title.toLowerCase())
            : true;
        
        const matchesTag = filters.tag 
            ? (article.tags && article.tags.includes(filters.tag))
            : true;
        
        return matchesTitle && matchesTag;
    });

    const handleTitleChange = (e) => {
        setFilters(prev => ({ ...prev, title: e.target.value }));
    };

    const handleDetailsClick = (articleId) => {
        navigate(`/news/${articleId}`);
    };

    const handleTagChange = (e) => {
        setFilters(prev => ({ ...prev, tag: e.target.value }));
    };

    const clearFilters = () => {
        setFilters({
            title: '',
            tag: ''
        });
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('ru-RU');
    };

    const truncateText = (text, maxLength = 150) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const hasActiveFilters = filters.title || filters.tag;

    return (
        <div className={styles.main_container}>
            <div className={styles.header}>
                <h1>Все статьи</h1>
                <p>Найдено статей: {filteredArticles.length}</p>
                <button
                    className={styles.detailsButton}
                    onClick={clearFilters} 
                    // className={styles.refresh_btn}
                    disabled={!hasActiveFilters}
                >
                    Сбросить фильтры
                </button>
            </div>

            <div className={styles.content}>
                <div className={styles.articles_column}>
                    {isLoading ? (
                        <div className={styles.loading}>Загрузка статей...</div>
                    ) : filteredArticles.length === 0 ? (
                        <div className={styles.no_articles}>
                            <h3>Статьи не найдены</h3>
                            <p>Попробуйте изменить параметры поиска</p>
                            <button onClick={clearFilters}>Сбросить всё</button>
                        </div>
                    ) : (
                        <div className={styles.articles_list}>
                            {filteredArticles.map(article => (
                                <div key={article.id} className={styles.article_card}>
                                    <div className={styles.article_header}>
                                        <h3 className={styles.article_title}>{article.title}</h3>
                                        <div className={styles.article_meta}>
                                            <span className={styles.views}>👁️ {article.viewCount || 0}</span>
                                            <span className={styles.likes}>❤️ {article.likesCount || 0}</span>
                                            <span className={styles.comments}>💬 {article.commentsCount || 0}</span>
                                        </div>
                                    </div>
                                    
                                    <p className={styles.article_description}>
                                        {truncateText(article.content)}
                                    </p>
                                    
                                    <div className={styles.article_footer}>
                                        <div className={styles.article_info}>
                                            <span className={styles.author}>
                                                Автор: {article.author?.userName || 'Неизвестный автор'}
                                            </span>
                                            <span className={styles.date}>
                                                Дата: {formatDate(article.createdAt)}
                                            </span>
                                            {article.tags && article.tags.length > 0 && (
                                                <span className={styles.tags}>
                                                    Тег: {article.tags.join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        className={styles.detailsButton}
                                        onClick={() => handleDetailsClick(article.id)}
                                    >
                                            Подробнее
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.filters_column}>
                    <div className={styles.filters_section}>
                        <h3>Фильтры поиска</h3>
                        
                        <div className={styles.filter_group}>
                            <label htmlFor="title">Название статьи:</label>
                            <input
                                type="text"
                                id="title"
                                value={filters.title}
                                onChange={handleTitleChange}
                                placeholder="Введите название..."
                                className={styles.search_input}
                                autoComplete="off"
                            />
                        </div>

                        <div className={styles.filter_group}>
                            <label htmlFor="tag">Тег:</label>
                            <select
                                id="tag"
                                value={filters.tag}
                                onChange={handleTagChange}
                                className={styles.select_input}
                            >
                                <option value="">Все теги</option>
                                {allTags.map(tag => (
                                    <option key={tag.id} value={tag.title}>
                                        {tag.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {hasActiveFilters && (
                            <div className={styles.active_filters}>
                                <h4>Активные фильтры:</h4>
                                <div className={styles.active_filters_list}>
                                    {filters.title && (
                                        <span className={styles.active_filter}>
                                            Название: "{filters.title}"
                                            <button onClick={() => handleTitleChange({target: {value: ''}})}>×</button>
                                        </span>
                                    )}
                                    {filters.tag && (
                                        <span className={styles.active_filter}>
                                            Тег: {filters.tag}
                                            <button onClick={() => handleTagChange({target: {value: ''}})}>×</button>
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
