import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from "../../store/useStore"
import styles from './AddNews.module.css'

export default function AddNews() {
    const navigate = useNavigate()
    
    const { 
        isAuthenticated, 
        user, 
        createArticle, 
        uploadArticleImage,
        isLoading,
        error,
        clearError 
    } = useAuthStore()
    
    const [articleData, setArticleData] = useState({
        title: '',
        content: '',
        tag: ''
    })

    const [imageFile, setImageFile] = useState(null)
    const [submitLoading, setSubmitLoading] = useState(false)

    useEffect(() => {
        if (!isAuthenticated) {
            console.log('Not authenticated, redirecting...')
            setTimeout(() => navigate('/login'), 2000)
            return
        }
    }, [isAuthenticated, navigate])

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
        navigate(-1)
    }

    const clearForm = () => {
        setArticleData({
            title: '',
            content: '',
            tag: ''
        })
        setImageFile(null)
        clearError()
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
                tags: articleData.tag.trim() ? [articleData.tag.trim()] : [] // Один тег в массиве
            }

            console.log('Создание статьи:', requestData);

            const result = await createArticle(requestData)

            if (!result.success) {
                throw new Error(result.error || 'Ошибка при создании статьи')
            }

            const articleId = result.data.articleId;
            console.log('Статья создана, ID:', articleId);

            if (imageFile && articleId) {
                console.log('Загрузка изображения для статьи:', articleId);
                const imageResult = await uploadArticleImage(articleId, imageFile)
                
                if (!imageResult.success) {
                    console.warn('Не удалось загрузить изображение:', imageResult.error)
                }
            }

            alert('Статья успешно создана!')
            
            clearForm()
                
        } catch (err) {
            alert(`Ошибка: ${err.message || 'Не удалось создать статью'}`)
            console.error('Ошибка при создании статьи:', err)
        } finally {
            setSubmitLoading(false)
        }
    }

    const removeImage = () => {
        setImageFile(null)
    }

    if (!isAuthenticated) {
        return (
            <div className={styles.main_container_add_news}>
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

    return(
        <>
        <div className={styles.main_container_add_news}>
            <div>
                <button className={styles.btn_back} onClick={back}>Назад</button>
            </div>
            <div>
                <h1>Добавление новости</h1>
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
                                placeholder="Введите заголовок статьи"
                            />
                            {/* <div className={styles.char_count_small}>
                                {articleData.title.length}/200 символов
                            </div> */}
                        </div>

                        <div className={styles.el_input}>
                            <label htmlFor="tag">Тег статьи:</label>
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
                            <input 
                                type="file"
                                id="image"
                                accept=".jpg,.jpeg,.png"
                                onChange={handleImageChange}
                                className={styles.file_input}
                            />
                            {imageFile && (
                                <div className={styles.image_preview}>
                                    <span>Выбран файл: {imageFile.name}</span>
                                    <button 
                                        type="button"
                                        onClick={removeImage}
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
                            disabled={submitLoading || isLoading}
                            className={submitLoading ? styles.loading : ''}
                        >
                            {submitLoading ? 'Создание статьи...' : 'Создать статью'}
                        </button>
                        
                        <button 
                            type="button"
                            onClick={clearForm}
                            className={styles.clear_btn}
                            disabled={submitLoading}
                        >
                            Очистить форму
                        </button>
                    </div>
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