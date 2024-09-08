import styles from './SearchInput.module.scss';

const SearchInput = () => (
  <div className={styles['search-input-wrapper']}>
    <label htmlFor='search'></label>
    <input type='text' id='search' className={styles['search-input']} />
  </div>
);

export default SearchInput;
