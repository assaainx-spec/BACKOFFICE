import { useNavigate } from 'react-router-dom'
export default function DashboardPage() {
  const navigate = useNavigate()
  return (
    <div className="p-4 flex justify-between items-center">
      <span className="text-text">Dashboard</span>
      <button onClick={() => navigate('/settings')} className="text-2xl">⚙️</button>
    </div>
  )
}
