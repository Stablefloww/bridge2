import * as Sentry from "@sentry/nextjs"

export const trackPerformance = (
  metricName: string,
  duration: number,
  tags?: Record<string, string>
) => {
  console.log(`[Performance] ${metricName}: ${duration}ms`, tags)
  
  // Store in localStorage for basic analytics
  const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '{}')
  if (!metrics[metricName]) {
    metrics[metricName] = []
  }
  
  metrics[metricName].push({
    timestamp: Date.now(),
    duration,
    tags
  })
  
  localStorage.setItem('performance_metrics', JSON.stringify(metrics))
} 