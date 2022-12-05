import { dataOfToday, db } from './db'
import { SingleVideo } from './define/single-video'
import { PlaylistItem } from './protocol'
import { removeQueryForUrl, today } from './utils'

export function pruneCache(persist = true) {
  console.log('-------prune cache---------')
  Object.keys(db.data!).forEach((key) => {
    if (key !== today()) {
      delete db.data![key]
    }
  })

  if (persist) {
    db.write()
  }
}

export const SingleVideoCache = {
  get(loadUrl: string): SingleVideo | undefined {
    return dataOfToday().videos[removeQueryForUrl(loadUrl)] || undefined
  },
  set(loadUrl: string, video: SingleVideo) {
    dataOfToday().videos[removeQueryForUrl(loadUrl)] = video
    pruneCache(false)
    db.write()
  },
}

export const PlaylistCache = {
  get(loadUrl: string): PlaylistItem[] | undefined {
    return dataOfToday().playlist[removeQueryForUrl(loadUrl)]
  },
  set(loadUrl: string, playlistItems: PlaylistItem[]) {
    dataOfToday().playlist[removeQueryForUrl(loadUrl)] = playlistItems
    pruneCache(false)
    db.write()
  },
}
