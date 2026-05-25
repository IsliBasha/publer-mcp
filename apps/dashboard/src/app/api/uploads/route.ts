import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_FILES = 10
const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/quicktime', 'video/webm',
])

export async function POST(req: NextRequest) {
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 })
  }

  const files = formData.getAll('files') as File[]

  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 })
  }

  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} files per upload` }, { status: 400 })
  }

  // Validate all files before writing any
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File type "${file.type}" is not supported. Use JPG, PNG, GIF, WebP, MP4, or MOV.` },
        { status: 400 }
      )
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `"${file.name}" exceeds the 10 MB limit` },
        { status: 400 }
      )
    }
  }

  const uploadDir = join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const urls: string[] = []

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    const filename = `${randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(uploadDir, filename), buffer)
    urls.push(`/uploads/${filename}`)
  }

  return NextResponse.json({ urls }, { status: 201 })
}
