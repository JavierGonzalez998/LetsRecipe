import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.REGION!,
  endpoint: process.env.ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
})

const bucket = process.env.BUCKET!

export const profileKey = (userId: string, ext: string) =>
  `profile/${userId}/profile.${ext}`

export const recipeMediaKey = (recipeId: string, filename: string) =>
  `recipe/${recipeId}/media/${filename}`

export function getPublicUrl(key: string): string {
  const endpoint = (process.env.ENDPOINT ?? '').replace(/\/$/, '')
  return `${endpoint}/${bucket}/${key}`
}

export function keyFromUrl(url: string): string | null {
  const marker = `/${bucket}/`
  const idx = url.indexOf(marker)
  return idx !== -1 ? url.slice(idx + marker.length) : null
}

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await s3.send(
    new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }),
  )
  return getPublicUrl(key)
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
