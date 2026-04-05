import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', icon: '🏠', label: 'Dashboard', exact: true },
  { to: '/invoices', icon: '📄', label: 'Invoices' },
  { to: '/expenses', icon: '💸', label: 'Expenses' },
  { to: '/reports', icon: '📊', label: 'Reports' },
]

export default function BottomNav({ onNew }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-mantle border-t border-overlay flex items-center justify-around px-2 pb-4">
      {tabs.slice(0, 2).map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.exact}
          className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 text-xs ${isActive ? 'text-blue' : 'text-muted'}`
          }
        >
          <span className="text-xl">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}

      {/* Centre + button */}
      <button
        onClick={onNew}
        className="flex flex-col items-center -mt-5"
      >
        <span className="w-12 h-12 rounded-full bg-gradient-to-br from-blue to-purple flex items-center justify-center text-2xl text-crust shadow-lg">+</span>
      </button>

      {tabs.slice(2).map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex flex-col items-center py-2 px-4 text-xs ${isActive ? 'text-blue' : 'text-muted'}`
          }
        >
          <span className="text-xl">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
