import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/useStore';
import styles from './ArticleDetail.module.css';

export default function ArticleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user, getArticle, likeArticle, unlikeArticle, addComment, isLoading } = useAuthStore();
    
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [likeLoading, setLikeLoading] = useState(false);
    const [commentLoading, setCommentLoading] = useState(false);
    
    const [newComment, setNewComment] = useState('');
    const [commentError, setCommentError] = useState('');
    const [showCommentForm, setShowCommentForm] = useState(false);

    useEffect(() => {
        console.log('Статья обновлена:', {
            id: article?.id,
            title: article?.title,
            commentsCount: article?.commentsCount,
            comments: article?.comments?.length
        });
    }, [article]);

    const fetchArticle = async () => {
        if (!id) {
            setError('ID статьи не указан');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            console.log('Загрузка статьи ID:', id);
            const result = await getArticle(id);
            
            if (!result.success) {
                throw new Error(result.error || 'Ошибка при загрузке статьи');
            }
            
            console.log('Статья загружена:', result.data);
            setArticle(result.data);
            
        } catch (err) {
            console.error('Ошибка при загрузке статьи:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLikeAction = async () => {
        if (!isAuthenticated) {
            alert('Для оценки статей необходимо авторизоваться');
            navigate('/login');
            return;
        }

        if (!article) return;

        setLikeLoading(true);
        try {
            let result;
            
            // Сохраняем текущее состояние для отката
            const previousArticleState = { ...article };
            
            // Оптимистичное обновление UI
            setArticle(prev => {
                if (!prev) return prev;
                
                const wasLiked = prev.isLiked;
                const currentLikesCount = prev.likesCount || 0;
                
                return {
                    ...prev,
                    isLiked: !wasLiked,
                    likesCount: wasLiked ? currentLikesCount - 1 : currentLikesCount + 1
                };
            });
            
            if (article.isLiked) {
                console.log('Убираем лайк с статьи:', id);
                result = await unlikeArticle(id);
            } else {
                console.log('Ставим лайк статье:', id);
                result = await likeArticle(id);
            }
            
            console.log('Результат действия:', result);
            
            if (!result.success) {
                // Если запрос не удался, откатываем изменения
                setArticle(previousArticleState);
                throw new Error(result.error || 'Ошибка при оценке статьи');
            }

            // Не вызываем fetchArticle() - используем оптимистичное обновление
            // Можно обновить только счетчики из ответа, если они есть
            if (result.data) {
                setArticle(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        likesCount: result.data.likesCount || prev.likesCount,
                        isLiked: result.data.isLiked !== undefined ? result.data.isLiked : prev.isLiked
                    };
                });
            }
            
        } catch (err) {
            console.error('Ошибка при оценке статьи:', err);
            alert('Ошибка: ' + err.message);
        } finally {
            setLikeLoading(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (!newComment.trim()) {
            setCommentError('Комментарий не может быть пустым');
            return;
        }

        setCommentLoading(true);
        setCommentError('');

        try {
            
            const tempComment = {
                id: `temp-${Date.now()}`,
                content: newComment.trim(),
                createdAt: new Date().toISOString(),
                author: {
                    id: user.id,
                    userName: user.name,
                    avatar: user.avatar_url
                },
                isTemp: true
            };

            setArticle(prev => {
                if (!prev) return prev;
                
                const updatedArticle = {
                    ...prev,
                    commentsCount: (prev.commentsCount || 0) + 1,
                    comments: [tempComment, ...(prev.comments || [])]
                };
                
                console.log('Статья с временным комментарием:', updatedArticle);
                return updatedArticle;
            });

            const result = await addComment(id, newComment);
            
            if (!result.success) {
                throw new Error(result.error || 'Ошибка при добавлении');
            }

            console.log('Комментарий добавлен, ответ:', result);

            setArticle(prev => {
                if (!prev) return prev;
                
                // Убираем временный комментарий
                const filteredComments = prev.comments.filter(comment => !comment.isTemp);
                
                const updatedArticle = {
                    ...prev,
                    comments: [result.data, ...filteredComments]
                };
                
                return updatedArticle;
            });
            
            // Очищаем форму
            setNewComment('');
            setShowCommentForm(false);
            
        } catch (err) {
            console.error('Ошибка:', err);
            setCommentError(err.message);
            
            // Откатываем изменения в случае ошибки
            setArticle(prev => {
                if (!prev) return prev;
                
                const filteredComments = prev.comments.filter(comment => !comment.isTemp);
                const updatedCommentsCount = Math.max(0, (prev.commentsCount || 0) - 1);
                
                return {
                    ...prev,
                    commentsCount: updatedCommentsCount,
                    comments: filteredComments
                };
            });
        } finally {
            setCommentLoading(false);
        }
    };

    // Отмена комментария
    const handleCancelComment = () => {
        setNewComment('');
        setCommentError('');
        setShowCommentForm(false);
    };

    // Обновление статьи при изменении ID
    useEffect(() => {
        if (id) {
            fetchArticle();
        }
    }, [id]);

    // Кнопка назад
    const goBack = () => {
        navigate(-1);
    };

    // Перезагрузка статьи
    const handleRetry = () => {
        fetchArticle();
    };

    // Состояния загрузки
    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Загрузка статьи...</p>
                </div>
            </div>
        );
    }

    // Состояние ошибки
    if (error) {
        return (
            <div className={styles.container}>
                <button className={styles.backButton} onClick={goBack}>
                    ← Назад
                </button>
                <div className={styles.error}>
                    <h3>Ошибка при загрузке статьи</h3>
                    <p>{error}</p>
                    <button className={styles.retryButton} onClick={handleRetry}>
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    // Статья не найдена
    if (!article) {
        return (
            <div className={styles.container}>
                <button className={styles.backButton} onClick={goBack}>
                    ← Назад
                </button>
                <div className={styles.error}>
                    <h3>Статья не найдена</h3>
                    <p>Запрошенная статья не существует или была удалена</p>
                    <button className={styles.retryButton} onClick={handleRetry}>
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    const comments = article.comments || [];

    return (
        <div className={styles.container}>
            {/* Кнопка назад */}
            <button className={styles.backButton} onClick={goBack}>
                ← Назад к списку статей
            </button>
            
            {/* Основной контент статьи */}
            <article className={styles.article}>
                {/* Заголовок и мета-информация */}
                <header className={styles.header}>
                    <h1 className={styles.title}>{article.title}</h1>
                    
                    <div className={styles.metaInfo}>
                        {/* Автор */}
                        <div className={styles.authorSection}>
                            {article.author?.avatar && (
                                <img 
                                    src={article.author.avatar} 
                                    alt={`Аватар ${article.author.userName}`}
                                    className={styles.avatar}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            )}
                            <div className={styles.authorInfo}>
                                <div className={styles.authorName}>
                                    {article.author?.userName || 'Неизвестный автор'}
                                </div>
                                <div className={styles.publishDate}>
                                    Опубликовано: {new Date(article.createdAt).toLocaleDateString('ru-RU', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                            </div>
                        </div>
                        
                        {/* Статистика */}
                        <div className={styles.stats}>
                            <div className={styles.statItem}>
                                <span className={styles.statIcon}>👁️</span>
                                <span className={styles.statValue}>{article.viewCount || 0}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statIcon}>❤️</span>
                                <span className={styles.statValue}>{article.likesCount || 0}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statIcon}>💬</span>
                                <span className={styles.statValue}>{article.commentsCount || 0}</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Изображение статьи */}
                {article.image && (
                    <div className={styles.articleImage}>
                        <img 
                            src={article.image} 
                            alt={article.title}
                            className={styles.image}
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                )}

                {/* Теги */}
                {article.tags && article.tags.length > 0 && (
                    <div className={styles.tags}>
                        {article.tags.map((tag, index) => (
                            <span key={index} className={styles.tag}>#{tag}</span>
                        ))}
                    </div>
                )}

                {/* Содержание статьи */}
                <div className={styles.content}>
                    {article.content.split('\n').map((paragraph, index) => (
                        paragraph.trim() ? (
                            <p key={index}>{paragraph}</p>
                        ) : (
                            <br key={index} />
                        )
                    ))}
                </div>

                {/* Футер статьи */}
                <footer className={styles.footer}>
                    {/* Блок лайка */}
                    <div className={styles.likeSection}>
                        <button 
                            className={`${styles.likeButton} ${
                                article.isLiked ? styles.liked : ''
                            } ${likeLoading ? styles.loading : ''}`}
                            onClick={handleLikeAction}
                            disabled={!isAuthenticated || likeLoading || isLoading}
                            title={article.isLiked ? "Убрать лайк" : "Поставить лайк"}
                        >
                            {likeLoading ? (
                                <span className={styles.likeLoading}></span>
                            ) : article.isLiked ? (
                                <span className={styles.likeIcon}>❤️</span>
                            ) : (
                                <span className={styles.likeIcon}>🤍</span>
                            )}
                            
                            <span className={styles.likeText}>
                                {likeLoading ? 'Загрузка...' : 
                                 article.isLiked ? 'Убрать лайк' : 'Оценить статью'}
                            </span>
                        </button>
                        
                        {!isAuthenticated && (
                            <div className={styles.authHint}>
                                <span className={styles.loginHint}>
                                    Войдите, чтобы оценить статью
                                </span>
                            </div>
                        )}
                    </div>
                </footer>

                <section className={styles.commentsSection}>
                    <div className={styles.commentsHeader}>
                        <h3 className={styles.commentsTitle}>
                            Комментарии {article.commentsCount > 0 && 
                            `(${article.commentsCount})`}
                        </h3>
                        
                        {isAuthenticated && (
                            <button 
                                className={styles.addCommentButton}
                                onClick={() => setShowCommentForm(!showCommentForm)}
                            >
                                {showCommentForm ? '✕ Отмена' : '+ Добавить комментарий'}
                            </button>
                        )}
                    </div>

    
                    {showCommentForm && isAuthenticated && (
                        <form className={styles.commentForm} onSubmit={handleAddComment}>
                            <div className={styles.commentFormHeader}>
                                <h4>Ваш комментарий</h4>
                                {user?.avatar_url && (
                                    <img 
                                        src={user.avatar_url} 
                                        alt="Ваш аватар"
                                        className={styles.currentUserAvatar}
                                    />
                                )}
                            </div>
                            
                            <textarea
                                className={styles.commentTextarea}
                                value={newComment}
                                onChange={(e) => {
                                    setNewComment(e.target.value);
                                    setCommentError('');
                                }}
                                placeholder="Напишите ваш комментарий..."
                                rows="4"
                                maxLength="1000"
                                disabled={commentLoading}
                            />
                            
                            {commentError && (
                                <div className={styles.commentError}>{commentError}</div>
                            )}
                            
                            <div className={styles.commentFormActions}>
                                <div className={styles.commentLength}>
                                    {newComment.length}/1000 символов
                                </div>
                                <div className={styles.commentButtons}>
                                    <button 
                                        type="button"
                                        className={styles.cancelButton}
                                        onClick={handleCancelComment}
                                        disabled={commentLoading}
                                    >
                                        Отмена
                                    </button>
                                    <button 
                                        type="submit"
                                        className={styles.submitButton}
                                        disabled={commentLoading || !newComment.trim()}
                                    >
                                        {commentLoading ? 'Отправка...' : 'Отправить'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    )}

                    {!isAuthenticated && (
                        <div className={styles.commentAuthPrompt}>
                            <p>Войдите в систему, чтобы оставить комментарий</p>
                            <button 
                                className={styles.loginButton}
                                onClick={() => navigate('/login')}
                            >
                                Войти
                            </button>
                        </div>
                    )}
                    
                    {/* Список комментариев */}
                    {comments.length > 0 ? (
                        <div className={styles.commentsList}>
                            {comments.map(comment => (
                                <div 
                                    key={comment.id} 
                                    className={styles.comment}
                                >
                                    <div className={styles.commentHeader}>
                                        <div className={styles.commentAuthor}>
                                            {comment.author?.avatar && (
                                                <img 
                                                    src={comment.author.avatar} 
                                                    alt={`Аватар ${comment.author.userName}`}
                                                    className={styles.commentAvatar}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                            )}
                                            <div className={styles.commentAuthorInfo}>
                                                <span className={styles.commentAuthorName}>
                                                    {comment.author?.userName || 'Аноним'}
                                                </span>
                                                <span className={styles.commentDate}>
                                                    {new Date(comment.createdAt).toLocaleDateString('ru-RU', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.commentContent}>
                                        {comment.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.noComments}>
                            <p>Пока нет комментариев</p>
                            <p className={styles.noCommentsSubtitle}>
                                {isAuthenticated 
                                    ? 'Будьте первым, кто оставит комментарий!' 
                                    : 'Войдите, чтобы оставить первый комментарий'
                                }
                            </p>
                        </div>
                    )}
                </section>
            </article>
        </div>
    );
}