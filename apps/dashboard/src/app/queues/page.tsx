import { Sidebar } from '@/components/dashboard/Sidebar'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

const MOCK_JOBS = [
  { id: 'job-001', post: 'LinkedIn product launch', time: '10:00 AM', status: 'completed', attempts: 1 },
  { id: 'job-002', post: 'Instagram brand story', time: '2:00 PM', status: 'active', attempts: 1 },
  { id: 'job-003', post: 'Twitter AI thread', time: '4:30 PM', status: 'delayed', attempts: 0 },
  { id: 'job-004', post: 'Facebook campaign post', time: '9:00 AM', status: 'failed', attempts: 3 },
  { id: 'job-005', post: 'LinkedIn insight article', time: 'Tomorrow 8 AM', status: 'waiting', attempts: 0 },
]

const STATUS = {
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 text-green-700', label: 'Completed' },
  active: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-50 text-blue-700', label: 'Publishing' },
  delayed: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50 text-yellow-700', label: 'Delayed' },
  failed: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 text-red-700', label: 'Failed' },
  waiting: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100 text-gray-600', label: 'Waiting' },
} as const

export default function QueuesPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Queue Monitor</h1>
          <p className="text-gray-500 mb-8">BullMQ post publishing jobs — Redis-backed with retry handling</p>

          <div className="grid grid-cols-5 gap-4 mb-8">
            {(['waiting', 'active', 'delayed', 'completed', 'failed'] as const).map((s) => {
              const cfg = STATUS[s]
              const count = MOCK_JOBS.filter((j) => j.status === s).length
              return (
                <div key={s} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <p className="text-xs font-medium text-gray-500">{cfg.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${cfg.color}`}>{count}</p>
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  {['Job ID', 'Post', 'Scheduled', 'Status', 'Attempts'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {MOCK_JOBS.map((job) => {
                  const cfg = STATUS[job.status as keyof typeof STATUS]
                  const Icon = cfg.icon
                  return (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">{job.id}</td>
                      <td className="px-6 py-4 text-gray-900">{job.post}</td>
                      <td className="px-6 py-4 text-gray-500">{job.time}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg}`}>
                          <Icon className={`h-3 w-3 ${job.status === 'active' ? 'animate-spin' : ''}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{job.attempts}/3</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
