import { useState } from 'react'
import axios from 'axios'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import './App.css'

const COLORS = ['#00f5ff', '#ff006e', '#8338ec', '#fb5607', '#ffbe0b', '#06d6a0']

function getPersonality(langs, stars, followers) {
  const top = langs[0]?.name
  if (followers > 10000) return { title: '🌟 Open Source Legend', desc: 'The entire dev community knows your name.' }
  if (top === 'Python') return { title: '🧠 AI Whisperer', desc: 'You speak Python fluently. Models fear you.' }
  if (top === 'JavaScript' || top === 'TypeScript') return { title: '⚡ Web Sorcerer', desc: 'You bend the DOM to your will.' }
  if (top === 'C' || top === 'C++') return { title: '⚙️ Systems Beast', desc: 'You live close to the metal.' }
  if (top === 'Java' || top === 'Kotlin') return { title: '☕ Enterprise Warrior', desc: 'You write code that scales to millions.' }
  if (top === 'Rust') return { title: '🦀 Memory Safe Ninja', desc: 'Zero segfaults. Zero compromises.' }
  if (stars > 100) return { title: '🚀 Rising Star', desc: 'People are watching. Keep shipping.' }
  return { title: '🛠️ Code Explorer', desc: 'Always building, always learning.' }
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

export default function App() {
  const [username, setUsername] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async () => {
    if (!username.trim()) return
    setLoading(true)
    setError('')
    setData(null)
    try {
      const [userRes, reposRes] = await Promise.all([
        axios.get(`https://api.github.com/users/${username}`),
        axios.get(`https://api.github.com/users/${username}/repos?per_page=100&sort=stars`)
      ])

      const repos = reposRes.data
      const langMap = {}
      repos.forEach(r => { if (r.language) langMap[r.language] = (langMap[r.language] || 0) + 1 })
      const languages = Object.entries(langMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
      const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0)
      const totalForks = repos.reduce((acc, r) => acc + r.forks_count, 0)
      const top5 = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 5)
      const personality = getPersonality(languages, totalStars, userRes.data.followers)

      setData({ user: userRes.data, languages, totalStars, totalForks, top5, personality })
    } catch (e) {
      setError('User not found. Check the username and try again.')
    }
    setLoading(false)
  }

  return (
    <div className="app">
      <div className="hero">
        <h1 className="logo-text">Git<span>Wrapped</span></h1>
        <p className="tagline">Your GitHub. Wrapped.</p>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Enter GitHub username..."
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData()}
          />
          <button onClick={fetchData}>Analyze</button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>

      {loading && <div className="loader"><div className="spinner" /></div>}

      {data && (
        <div className="dashboard">

          {/* PROFILE */}
          <div className="profile-card card">
            <img src={data.user.avatar_url} alt="avatar" className="avatar" />
            <div className="profile-info">
              <div className="profile-top">
                <div>
                  <h2>{data.user.name || data.user.login}</h2>
                  <p className="handle">@{data.user.login}</p>
                  <p className="bio">{data.user.bio || 'No bio yet.'}</p>
                </div>
                <a href={`https://github.com/${data.user.login}`} target="_blank" rel="noreferrer" className="gh-btn">
                  View on GitHub →
                </a>
              </div>
              <div className="stats-row">
                <div className="stat"><span>{data.user.public_repos}</span>Repos</div>
                <div className="stat"><span>{data.user.followers.toLocaleString()}</span>Followers</div>
                <div className="stat"><span>{data.totalStars.toLocaleString()}</span>Stars</div>
                <div className="stat"><span>{data.totalForks.toLocaleString()}</span>Forks</div>
                <div className="stat"><span>{formatDate(data.user.created_at)}</span>Joined</div>
              </div>
            </div>
          </div>

          {/* PERSONALITY */}
          <div className="personality-card card">
            <p className="card-label">Coding Personality</p>
            <p className="p-title">{data.personality.title}</p>
            <p className="p-desc">{data.personality.desc}</p>
          </div>

          {/* LANGUAGES PIE */}
          <div className="card">
            <p className="card-label">Languages</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={data.languages} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                  {data.languages.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#111118', border: '1px solid #222', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* TOP REPOS BAR CHART */}
          <div className="card full-width">
            <p className="card-label">Top Repos by Stars ⭐</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.top5} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 11 }} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: '#111118', border: '1px solid #222', borderRadius: '8px' }}
                  formatter={(val) => [val, 'Stars']}
                />
                <Bar dataKey="stargazers_count" fill="#00f5ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* TOP REPOS LIST */}
          <div className="card full-width">
            <p className="card-label">Top Repos 🏆</p>
            <div className="repos-grid">
              {data.top5.map(repo => (
                <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" className="repo-item">
                  <div>
                    <p className="repo-name">{repo.name}</p>
                    <p className="repo-desc">{repo.description || 'No description'}</p>
                  </div>
                  <div className="repo-meta">
                    <span className="repo-stars">⭐ {repo.stargazers_count}</span>
                    {repo.language && <span className="repo-lang">{repo.language}</span>}
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}