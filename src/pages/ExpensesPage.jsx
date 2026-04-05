import { useState } from 'react'
import ExpenseList from '../components/expense/ExpenseList'
import ExpenseForm from '../components/expense/ExpenseForm'

export default function ExpensesPage() {
  const [adding, setAdding] = useState(false)

  if (adding) return <ExpenseForm onSave={() => setAdding(false)} onCancel={() => setAdding(false)} />
  return <ExpenseList onAdd={() => setAdding(true)} />
}
