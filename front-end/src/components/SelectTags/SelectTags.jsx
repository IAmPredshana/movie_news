import styles from './SelectTags.module.css'

export default function SelectTags({ name, isSelected = false, onclick, ...props })
{
    return(
        <div className={`${styles.container_element_tag} ${isSelected ? styles.selected : ''}`}>
            <h4>{name}</h4>
            <button 
                onClick={onclick}
                className={`${styles.btn} ${isSelected ? styles.remove_btn : styles.add_btn}`}
            >

                {isSelected ? '−' : '+'}
            </button>
        </div>
    )
}