'use client'
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { TrainingProfile, WeeklyReport, ActivityTemplate } from '@/types'

interface AzubiDB extends DBSchema {
  profiles: { key: string; value: TrainingProfile }
  reports: { key: string; value: WeeklyReport; indexes: { 'by-year-week': [number, number] } }
  templates: { key: string; value: ActivityTemplate; indexes: { 'by-profile': string } }
}

let dbPromise: Promise<IDBPDatabase<AzubiDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AzubiDB>('azubihub', 1, {
      upgrade(db) {
        db.createObjectStore('profiles', { keyPath: 'id' })
        const reports = db.createObjectStore('reports', { keyPath: 'id' })
        reports.createIndex('by-year-week', ['year', 'calendarWeek'])
        const templates = db.createObjectStore('templates', { keyPath: 'id' })
        templates.createIndex('by-profile', 'profileId')
      },
    })
  }
  return dbPromise
}

export const db = {
  // Profile
  async getProfile(id: string): Promise<TrainingProfile | undefined> {
    return (await getDB()).get('profiles', id)
  },
  async getAllProfiles(): Promise<TrainingProfile[]> {
    return (await getDB()).getAll('profiles')
  },
  async saveProfile(profile: TrainingProfile): Promise<void> {
    await (await getDB()).put('profiles', profile)
  },
  async deleteProfile(id: string): Promise<void> {
    await (await getDB()).delete('profiles', id)
  },

  // Reports
  async getReport(id: string): Promise<WeeklyReport | undefined> {
    return (await getDB()).get('reports', id)
  },
  async getAllReports(): Promise<WeeklyReport[]> {
    return (await getDB()).getAll('reports')
  },
  async saveReport(report: WeeklyReport): Promise<void> {
    await (await getDB()).put('reports', report)
  },
  async deleteReport(id: string): Promise<void> {
    await (await getDB()).delete('reports', id)
  },

  // Templates
  async getAllTemplates(): Promise<ActivityTemplate[]> {
    return (await getDB()).getAll('templates')
  },
  async saveTemplate(template: ActivityTemplate): Promise<void> {
    await (await getDB()).put('templates', template)
  },
  async deleteTemplate(id: string): Promise<void> {
    await (await getDB()).delete('templates', id)
  },
}
