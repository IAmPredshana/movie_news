import { useState } from "react"
import useAuthStore from "../../store/useStore"
import { useNavigate } from "react-router-dom";

export default function Register() {
    const {register, isLoading, error, clearError} = useAuthStore();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'User',
    });

    const handleChange = function(e){
        const {name, value} = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));

        if (error) clearError();
    };
     
    const handleSybmit = async function(e){
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert("Пароли не совпадают!");
            return;
        };

        if (formData.password.length < 6) {
            alert("Пароли не могут быть менее 6 символов!");
            return;
        };

        const userData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role
        };

        console.log('Регистрация с данными:', userData);

        const result = await register(userData);

        if (result.success) {
            alert("Регистрация прошла успешно!");
            navigate("/");
        } else {
            let textError = "Ошибка при регистрации: ";
            textError += result.error;
            alert(textError);
        }
    }

    return(
        <>
            <div>
                <div>
                    <h2>Регистрация</h2>
                </div>
                <div>
                    {error && (<><div>{error}</div></>)}
                </div>
                <form onSubmit={handleSybmit}>
                    <div>
                        <label htmlFor="email">Email:</label>
                        <input 
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required />
                    </div>
                    <div>
                        <label htmlFor="password">Пароль</label>
                        <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        minLength="6"
                        required />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword">Подтвердите пароль</label>
                        <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        minLength="6"
                        required />
                    </div>
                    <div>
                        <label htmlFor="name">
                            {formData.role === 'CinemaCompany' ? 'Название компании:' : 'Имя пользователя:'}
                        </label>
                        <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required />
                    </div>
                    <div>
                        <label htmlFor="role">Тип аккаунта: </label>
                        <select
                        name="role"
                        id="role"
                        value={formData.role}
                        onChange={handleChange}
                        >
                            <option value="User">Пользователь</option>
                            <option value="CinemaCompany">Кино-компания</option>
                        </select>
                    </div>
                    <div>
                        <button type="submit" disabled={isLoading}>
                            {!isLoading ? "Зарегистрироваться" : "Регистрация..."}
                        </button>
                    </div>
                </form>
            </div>
        </>
    )
}