export default function SearchBox({ large = false }: { large?: boolean }) {
  return (
    <form action="/search" className={`search-box ${large ? "large" : ""}`}>
      <span>⌕</span>
      <input name="q" placeholder='Try: "that scholarship around ₹50,000"' />
      <button type="submit">Search</button>
    </form>
  );
}
