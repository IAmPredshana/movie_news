import NavigationMenu from "../NavigationMenu/NavigationMenu"
import { Link } from 'react-router-dom'

import useAuthStore from "../../store/useStore"
import logo from "../../images/logo.png"

import styles from "./Header.module.css"

import LogOrReg from "../LogOrReg/LogOrReg"
import AccountInHeader from '../AccountInHeader/AccountInHeader'

export default function Header()
{
    const { user, isAuthenticated, logout } = useAuthStore();

    return(
        <>
            <div className={styles.main_container_header}>
                <div>
                    <img src={logo} alt="" width={"90px"}/>
                </div>
                <NavigationMenu />
                <div>
                    {!isAuthenticated ? (<LogOrReg />) : (<AccountInHeader />) }
                </div>
            </div>
        </>
    )
}