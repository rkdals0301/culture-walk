import styles from './SearchBar.module.scss';

const SearchBar = () => (
  <div className={styles['search-bar-wrapper']}>
    <label htmlFor='search'></label>
    <input type='text' id='search' placeholder='검색어를 입력하세요' className={styles['search-bar']} />
  </div>
);

export default SearchBar;
