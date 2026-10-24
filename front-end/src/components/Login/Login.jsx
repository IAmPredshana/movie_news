import { useNavigate } from "react-router-dom"
import { useState } from "react";

import useAuthStore from "../../store/useStore"

export default function Login()
{

    const navigate = useNavigate();

    const { login } = useAuthStore();

    const [userData, setUserData] = useState({
        email: '',
        password: ''
    });

    const handleChange = function(e){
        const {name, value} = e.target;
        setUserData((prev) => ({...prev, [name]: value}));
        console.log(userData);
    };

    const handleSubmit = async function(e){
        e.preventDefault();

        if (userData.password.length < 6)
        {
            alert("Пароль не может быть меньше 6 символов!");
            return;
        };

        const response = await login(userData.email, userData.password);

        if (response.success)
        {
            let text = "Вход выполнен! ";
            text += response.user;
            text += response.token;
            alert(text);
            navigate("/account");
        } else {
            let text = "Ошибка при воходе! ";
            text += response.error;
            alert(text);
        };
    };

    return(
        <>
            <div>
                <div>
                    <label htmlFor="email">Email: </label>
                    <input
                    type="email"
                    id="email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    />
                </div>
                <div>
                    <label htmlFor="password">Пароль: </label>
                    <input
                    type="password"
                    id="password"
                    name="password"
                    value={userData.password}
                    onChange={handleChange}
                    />
                </div>
                <div>
                    <button
                    type="submit"
                    onClick={handleSubmit}
                    >Войти</button>
                </div>
            </div>
        </>
    )
}