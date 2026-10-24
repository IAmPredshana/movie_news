import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from "../../store/useStore"
import styles from './EditNews.module.css'

export default function EditNews() {
    const navigate = useNavigate()
    const { id } = useParams()
    
    const { 
        isAuthenticated, 
        user, 
        getArticle,
        updateArticle, 
        uploadArticleImage,
        deleteArticleImage,
        isLoading,
        error,
        clearError 
    } = useAuthStore()
    
    const [articleData, setArticleData] = useState({
        title: '',
        content: '',
        tag: ''
    })

    const [originalArticle, setOriginalArticle] = useState(null)
    const [imageFile, setImageFile] = useState(null)
    const [currentImage, setCurrentImage] = useState('')
    const [submitLoading, setSubmitLoading] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        if (!isAuthenticated) {
            console.log('Not authenticated, redirecting...')
            setTimeout(() => navigate('/login'), 2000)
            return
        }
    }, [isAuthenticated, navigate])

    useEffect(() => {
        const loadArticle = async () => {
            if (!id) return
            
            try {
                const result = await getArticle(id)
                if (result.success) {
                    const article = result.data
                    setOriginalArticle(article)
                    
                    const firstTag = article.tags && article.tags.length > 0 ? article.tags[0] : ''
                    
                    setArticleData({
                        title: article.title || '',
                        content: article.content || '',
                        tag: firstTag
                    })
                    setCurrentImage(article.image || '')
                } else {
                    alert('Статья не найдена')
                    navigate('/account')
                }
            } catch (error) {
                console.error('Ошибка загрузки статьи:', error)
                alert('Ошибка загрузки статьи')
                navigate('/account')
            }
        }

        loadArticle()
    }, [id, getArticle, navigate])

    useEffect(() => {
        if (!originalArticle) return
        
        const isTitleChanged = articleData.title !== originalArticle.title
        const isContentChanged = articleData.content !== originalArticle.content
        
        const originalTag = originalArticle.tags && originalArticle.tags.length > 0 ? originalArticle.tags[0] : ''
        const isTagChanged = articleData.tag !== originalTag
        
        const isImageChanged = imageFile !== null
        
        setHasChanges(isTitleChanged || isContentChanged || isTagChanged || isImageChanged)
    }, [articleData, imageFile, originalArticle])

    useEffect(() => {
        return () => clearError()
    }, [clearError])

    const handleChange = function(e){
        const {name, value} = e.target;
        setArticleData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                alert('Разрешены только файлы JPG, JPEG и PNG');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                alert('Размер файла не должен превышать 5MB');
                return;
            }
            
            setImageFile(file);
            clearError();
        }
    };

    const back = () => {
        if (hasChanges) {
            const confirmLeave = window.confirm('У вас есть несохраненные изменения. Вы уверены, что хотите выйти?')
            if (!confirmLeave) return
        }
        navigate(-1)
    }

    const handleDeleteImage = async () => {
        if (!currentImage) return
        
        const confirmDelete = window.confirm('Вы уверены, что хотите удалить изображение?')
        if (!confirmDelete) return
        
        try {
            const result = await deleteArticleImage(id)
            if (result.success) {
                setCurrentImage('')
                alert('Изображение удалено')
            } else {
                alert('Ошибка при удалении изображения: ' + result.error)
            }
        } catch (error) {
            alert('Ошибка при удалении изображения: ' + error.message)
        }
    }

    const removeNewImage = () => {
        setImageFile(null)
    }

    const handleSubmit = async () => {
        if (!articleData.title.trim()) {
            alert('Введите заголовок статьи')
            return
        }
        if (!articleData.content.trim()) {
            alert('Введите текст статьи')
            return
        }
        if (articleData.title.length < 5 || articleData.title.length > 200) {
            alert('Заголовок должен быть от 5 до 200 символов')
            return
        }
        if (articleData.content.length < 50 || articleData.content.length > 5000) {
            alert('Текст статьи должен быть от 50 до 5000 символов')
            return
        }

        setSubmitLoading(true)
        clearError()

        try {
            const requestData = {
                title: articleData.title,
                content: articleData.content,
                tags: articleData.tag.trim() ? [articleData.tag.trim()] : [] 
            }

            console.log('Обновление статьи:', requestData);

            const result = await updateArticle(id, requestData)

            if (!result.success) {
                throw new Error(result.error || 'Ошибка при обновлении статьи')
            }

            console.log('Статья обновлена, ID:', id);

            if (imageFile && id) {
                console.log('Загрузка нового изображения для статьи:', id);
                const imageResult = await uploadArticleImage(id, imageFile)
                
                if (!imageResult.success) {
                    console.warn('Не удалось загрузить изображение:', imageResult.error)
                }
            }

            alert('Статья успешно обновлена!')
            
            navigate('/account')
            
        } catch (err) {
            alert(`Ошибка: ${err.message || 'Не удалось обновить статью'}`)
            console.error('Ошибка при обновлении статьи:', err)
        } finally {
            setSubmitLoading(false)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className={styles.main_container_edit_article}>
                <div className={styles.auth_message}>
                    <h2>Требуется авторизация</h2>
                    <p>Перенаправление на страницу входа...</p>
                    <button onClick={() => navigate('/login')}>
                        Перейти к входу
                    </button>
                </div>
            </div>
        )
    }

    if (!originalArticle && isLoading) {
        return (
            <div className={styles.main_container_edit_article}>
                <div className={styles.loading_message}>
                    <h2>Загрузка статьи...</h2>
                </div>
            </div>
        )
    }

    return(
        <>
        <div className={styles.main_container_edit_article}>
            <div>
                <button className={styles.btn_back} onClick={back}>Назад</button>
            </div>
            <div>
                <h1>Редактирование статьи</h1>
            </div>

            <div className={styles.container_enter_info}>
                <div className={styles.additional_info}>
                    <div className={styles.additional_info_inputs}>
                        <div className={styles.el_input}>
                            <label htmlFor="title">Заголовок:</label>
                            <input 
                                type="text" 
                                id="title"
                                name="title"
                                className={styles.title_info}
                                value={articleData.title}
                                onChange={handleChange}
                                placeholder="Введите заголовок статьи (5-200 символов)"
                            />
                            {/* <div className={styles.char_count_small}>
                                {articleData.title.length}/200 символов
                            </div> */}
                        </div>

                        <div className={styles.el_input}>
                            <label htmlFor="tag">Тег статьи (опционально):</label>
                            <input 
                                type="text" 
                                id="tag"
                                name="tag"
                                className={styles.title_info}
                                value={articleData.tag}
                                onChange={handleChange}
                                placeholder="Введите один тег для статьи"
                                maxLength="50"
                            />
                            {/* <div className={styles.char_count_small}>
                                {articleData.tag.length}/50 символов
                            </div> */}
                        </div>


                        <div className={styles.el_input}>
                            <label htmlFor="image">Изображение статьи:</label>
                            
                            {currentImage && (
                                <div className={styles.current_image}>
                                    <span>Текущее изображение: {currentImage.split('/').pop()}</span>
                                    <button 
                                        type="button"
                                        onClick={handleDeleteImage}
                                        className={styles.remove_image_btn}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            )}
                            
                            <input 
                                type="file"
                                id="image"
                                accept=".jpg,.jpeg,.png"
                                onChange={handleImageChange}
                                className={styles.file_input}
                            />
                            {imageFile && (
                                <div className={styles.image_preview}>
                                    <span>Новое изображение: {imageFile.name}</span>
                                    <button 
                                        type="button"
                                        onClick={removeNewImage}
                                        className={styles.remove_image_btn}
                                    >
                                        Удалить
                                    </button>
                                </div>
                            )}
                            <div className={styles.file_hint}>
                                Разрешены: JPG, JPEG, PNG (до 5MB)
                            </div>
                        </div>
                    </div>
                    
                    <div className={styles.additional_info_btn}>
                        <button 
                            onClick={handleSubmit}
                            disabled={submitLoading || isLoading || !hasChanges}
                            className={submitLoading ? styles.loading : ''}
                        >
                            {submitLoading ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                    </div>

                    {!hasChanges && (
                        <div className={styles.no_changes_message}>
                            Нет изменений для сохранения
                        </div>
                    )}
                </div>
                
                <div className={styles.text_news}>
                    <label htmlFor="content" className={styles.text_label}>Текст статьи:</label>
                    <textarea 
                        name="content" 
                        id="content"
                        className={styles.main_textarea}
                        value={articleData.content}
                        onChange={handleChange}
                        rows="15"
                    ></textarea>
                    {/* <div className={styles.char_count}>
                        {articleData.content.length}/5000 символов
                    </div> */}
                </div>
            </div>
        </div>
        </>
    )
}