import { useNavigate } from 'react-router-dom';

export default function AddDay()
{

    
    const navigate = useNavigate()

    const back = () => {
        navigate(-1)
    }

    return(
        <>
            <h1>Добавление дня</h1>
            <button onClick={back}>Назад</button>
        </>
    )
}