import { Link } from 'react-router-dom'

import styles from './NavigationMenu.module.css'

export default function NavigationMenu()
{
    return(
        <>
            <nav className={styles.main_container_nav_menu}>
                <ul className={styles.container_fir_li}>
                    <li
                    className={styles.elem_li}
                    ><Link
                    className={styles.elem_link}
                    to="/">Новости</Link></li>
                    <li
                    className={styles.elem_li}
                    ><Link 
                    className={styles.elem_link}
                    to="/news">Поиск</Link></li>
                    <li
                    className={styles.elem_li}
                    ><Link 
                    className={styles.elem_link}
                    to="/calendar">Календарь</Link></li>
                </ul>
            </nav>
        </>
    )
}