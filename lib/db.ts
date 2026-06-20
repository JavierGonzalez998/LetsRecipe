import { PrismaClient } from '@prisma/client'

function getDatabaseUrl(): string {
  if (process.env.MYSQL_URL) return process.env.MYSQL_URL
  const {
    MYSQLUSER = 'root',
    MYSQLPASSWORD = '',
    MYSQLHOST = 'localhost',
    MYSQLPORT = '3306',
    MYSQL_DATABASE = 'letsrecipe',
  } = process.env
  return `mysql://${MYSQLUSER}:${encodeURIComponent(MYSQLPASSWORD)}@${MYSQLHOST}:${MYSQLPORT}/${MYSQL_DATABASE}`
}

const g = globalThis as typeof globalThis & { prisma?: PrismaClient }
if (!g.prisma) {
  g.prisma = new PrismaClient({ datasources: { db: { url: getDatabaseUrl() } } })
}

export const prisma = g.prisma
