const requests = new Map()

export function rateLimit(ip: string) {

    const now = Date.now()
    const windowTime = 60000
    const maxRequests = 20

    if (!requests.has(ip)) {
        requests.set(ip, [])
    }

    const timestamps = requests.get(ip).filter((t: number) => now - t < windowTime)

    timestamps.push(now)

    requests.set(ip, timestamps)

    if (timestamps.length > maxRequests) {
        return false
    }

    return true
}