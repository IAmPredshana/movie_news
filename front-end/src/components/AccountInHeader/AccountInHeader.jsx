import { Link } from 'react-router-dom'

import styles from './AccountInHeader.module.css'

import accountIcon from '../../images/account.png'
import useAuthStore from '../../store/useStore'

export default function AccountInHeader()
{

    const { user } = useAuthStore();

    return(
        <>
            {/* AccountInHeader */}
            {/* <Link to="/account">Аккаунт</Link> */}
            
                <Link to="/account" className={styles.main_container_info}>
                    <span className={styles.name_user}>{user.name}</span>
                    <img src={accountIcon} alt="" width={'35px'}/>
                </Link>
        </>
    )
}