import './App.css'

// Placeholder home screen for the Setup phase. Login, layout and the real
// design arrive in the next foundation pull requests.
export default function App() {
  return (
    <main className="welcome">
      <img className="welcome__logo" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" width={120} height={120} />
      <h1>Nest</h1>
      <p>Our home, lists and money in one cosy place.</p>
      <p className="welcome__note">Being built. Check back soon.</p>
    </main>
  )
}
