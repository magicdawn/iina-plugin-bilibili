import { SingleVideo } from './define/single-video'
import { PlaylistItem } from './protocol'
import { iinaFileRead, today } from './utils'
import { dayjs, LowSync, SyncAdapter } from './vendor'

export class IinaSyncAdapter<T> implements SyncAdapter<T> {
  dbfile: string
  constructor(filename: string) {
    this.dbfile = `@data/${filename}.json`
  }
  read() {
    if (!iina.file.exists(this.dbfile)) return null
    const content = iinaFileRead(this.dbfile)
    if (!content) return null
    return JSON.parse(content) as T
  }
  write(obj: T) {
    iina.file.write(this.dbfile, JSON.stringify(obj))
  }
}

type DayData = {
  videos: Record<string, SingleVideo>
  playlist: Record<string, PlaylistItem[]>
}
export type DBData = Record<string, DayData>

const adapter = new IinaSyncAdapter<DBData>('db')
export const db = new LowSync(adapter)

// assign default data
db.data ||= {}
db.data[today()] ||= {
  videos: {},
  playlist: {},
}

export const dataOfToday = () => {
  // assign default data
  db.data ||= {}
  db.data[today()] ||= {
    videos: {},
    playlist: {},
  }
  return db.data[today()]
}
