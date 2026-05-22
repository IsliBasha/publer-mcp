import { Sidebar } from '@/components/dashboard/Sidebar'
import { Plus } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const MOCK_POSTS = [
  { day: 1, color: 'bg-blue-100 text-blue-700', label: 'Product launch' },
  { day: 3, color: 'bg-pink-100 text-pink-700', label: 'Brand story' },
  { day: 5, color: 'bg-sky-100 text-sky-700', label: 'AI trends thread' },
  { day: 10, color: 'bg-pink-100 text-pink-700', label: 'Behind the scenes' },
  { day: 15, color: 'bg-blue-100 text-blue-700', label: 'Case study' },
  { day: 20, color: 'bg-pink-100 text-pink-700', label: 'Engagement post' },
]

export default function CalendarPage() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const cells = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Schedule Post
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS.map((d) => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const posts = MOCK_POSTS.filter((p) => p.day === day)
                const isToday = day === today.getDate()
                return (
                  <div
                    key={i}
                    className={`min-h-28 border-b border-r border-gray-100 p-2 ${
                      day ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-50/50'
                    }`}
                  >
                    {day && (
                      <>
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-sm ${
                            isToday ? 'bg-blue-600 text-white font-medium' : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </span>
                        <div className="mt-1 space-y-1">
                          {posts.map((post, j) => (
                            <div
                              key={j}
                              className={`truncate rounded px-1.5 py-0.5 text-xs font-medium ${post.color}`}
                            >
                              {post.label}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
