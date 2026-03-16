'use client'
import { useState, useEffect, useCallback } from 'react'
import { db } from '@/lib/db'
import type { WeeklyReport } from '@/types'

export function useReports() {
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [loading, setLoading] = useState(true)

  const loadReports = useCallback(async () => {
    try {
      setLoading(true)
      const all = await db.getAllReports()
      const sorted = all.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year
        return b.calendarWeek - a.calendarWeek
      })
      setReports(sorted)
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const saveReport = useCallback(async (report: WeeklyReport) => {
    await db.saveReport(report)
    setReports(prev => {
      const idx = prev.findIndex(r => r.id === report.id)
      let updated: WeeklyReport[]
      if (idx >= 0) {
        updated = [...prev]
        updated[idx] = report
      } else {
        updated = [report, ...prev]
      }
      return updated.sort((a, b) => {
        if (b.year !== a.year) return b.year - a.year
        return b.calendarWeek - a.calendarWeek
      })
    })
  }, [])

  const deleteReport = useCallback(async (id: string) => {
    await db.deleteReport(id)
    setReports(prev => prev.filter(r => r.id !== id))
  }, [])

  return { reports, saveReport, deleteReport, loading, reload: loadReports }
}
