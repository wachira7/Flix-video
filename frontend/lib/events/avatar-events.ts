//lib/events/avatar-events.ts
type AvatarUpdateCallback = (avatarUrl: string | null) => void

class AvatarEventEmitter {
  private listeners: AvatarUpdateCallback[] = []

  subscribe(callback: AvatarUpdateCallback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  publish(avatarUrl: string | null) {
    this.listeners.forEach(callback => callback(avatarUrl))
  }
}

export const avatarEvents = new AvatarEventEmitter()