'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { WeeklyReport, DailyEntry } from '@/types'

export function useReports() {
  const [reports, setReports] = useState<WeeklyReport[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { user } = useAuth()

  const loadReports = useCallback(async () => {
    if (!user) {
      setReports([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Load reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('profile_id', user.id)
        .order('year', { ascending: false })
        .order('calendar_week', { ascending: false })

      if (reportsError) throw reportsError

      // Load all related daily entries for the user's reports
      // We can query daily_entries that have report_id in the loaded reports
      const reportIds = (reportsData || []).map(r => r.id)
      
      let allEntries: Record<string, unknown>[] = []
      if (reportIds.length > 0) {
        const { data: entriesData, error: entriesError } = await supabase
          .from('daily_entries')
          .select('*')
          .in('report_id', reportIds)

        if (entriesError) throw entriesError
        allEntries = entriesData || []
      }

      // Map everything back to local WeeklyReport type
      const mappedReports: WeeklyReport[] = (reportsData || []).map(r => {
        const rEntries = allEntries.filter(e => e.report_id === r.id)
        return {
          id: r.id,
          calendarWeek: r.calendar_week,
          year: r.year,
          weekStart: r.week_start,
          weekEnd: r.week_end,
          trainingYear: r.training_year,
          status: r.status,
          totalHours: Number(r.total_hours),
          isPdfReport: r.is_pdf_report,
          pdfData: r.pdf_data,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          exportedAt: r.exported_at,
          entries: rEntries.map(e => ({
            id: e.id,
            reportId: e.report_id,
            date: e.date,
            category: e.category,
            activities: e.activities,
            schoolContent: e.school_content,
            hours: Number(e.hours),
            notes: e.notes || undefined,
          })) as DailyEntry[]
        }
      })

      setReports(mappedReports)
    } catch (error) {
      console.error('Error loading reports:', error)
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    loadReports()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]) // Re-run when user changes

  const saveReport = useCallback(async (report: WeeklyReport) => {
    if (!user) throw new Error("Nicht angemeldet")

    // Update optimistic UI
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

    // Prepare Supabase report object
    const dbReport = {
      id: report.id,
      profile_id: user.id,
      calendar_week: report.calendarWeek,
      year: report.year,
      week_start: report.weekStart,
      week_end: report.weekEnd,
      training_year: report.trainingYear,
      status: report.status,
      total_hours: report.totalHours,
      is_pdf_report: report.isPdfReport ?? false,
      pdf_data: report.pdfData || null,
      updated_at: new Date().toISOString(),
      exported_at: report.exportedAt || null,
    }

    // Prepare Supabase entries object
    const dbEntries = report.entries.map(e => ({
      id: e.id,
      report_id: report.id,
      date: e.date,
      category: e.category,
      activities: e.activities,
      school_content: e.schoolContent || null,
      hours: e.hours,
      notes: e.notes || null,
    }))

    try {
      // Upsert report first
      const { error: reportError } = await supabase
        .from('weekly_reports')
        .upsert(dbReport)
      if (reportError) throw reportError

      // Only upsert entries if it's NOT a PDF report, OR if it has entries.
      // Usually PDF reports have no meaningful daily entries anyway, but we can save them.
      if (dbEntries.length > 0) {
        const { error: entriesError } = await supabase
          .from('daily_entries')
          .upsert(dbEntries)
        if (entriesError) throw entriesError
      }
    } catch (error) {
      console.error('Error saving report to DB:', error)
      throw error // Ensure the caller knows it failed
    }

  }, [user, supabase])

  const deleteReport = useCallback(async (id: string) => {
    if (!user) return
    
    // Optimistic delete
    setReports(prev => prev.filter(r => r.id !== id))
    
    try {
      const { error } = await supabase
        .from('weekly_reports')
        .delete()
        .eq('id', id)
        
      if (error) throw error
    } catch (error) {
      console.error('Error deleting report:', error)
      // Rollback might be needed here ideally, but for simplicity we assume it works or just log
    }
  }, [user, supabase])

  return { reports, saveReport, deleteReport, loading, reload: loadReports }
}
