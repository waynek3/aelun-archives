import { useEffect, useState } from 'react'
import { useUIStore } from '@/stores/uiStore'

export function NotificationToast() {
  const notifications = useUIStore((s) => s.notifications)
  const clearNotifications = useUIStore((s) => s.clearNotifications)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (notifications.length > 0) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(() => {
          clearNotifications()
        }, 300) // Wait for fade out animation
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [notifications, clearNotifications])

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <div
          key={index}
          className={`transform transition-all duration-300 ${
            visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}
        >
          <div className="panel p-3 text-sm text-cyan-400 bg-black/80 border border-cyan-400/50">
            {notification}
          </div>
        </div>
      ))}
    </div>
  )
}