// const getCacheFile = (cacheKey: string) => {
//   return `@data/${dayjs().format('YYYY-MM-DD')}_${cacheKey}.json`
// }

import dayjs from 'dayjs'
import { SingleVideo } from './define/single-video'
import { PlaylistItem } from './protocol'
import { iinaFileRead, removeUrlQuery, sha256 } from './utils'

const today = () => dayjs().format('YYYY-MM-DD')

const singleVideoFile = (loadUrl: string) =>
  `@data/${today()}__video__${sha256(
    JSON.stringify({
      loadUrlBare: removeUrlQuery(loadUrl),
    })
  )}.json`

export function pruneCache() {
  console.log('-------prune cache---------')
  const names = iina.file.list('@data/', { includeSubDir: false }) as unknown as IINA.FileItem[]
  const keepPrefix = today() + '__'
  names.forEach((item) => {
    if (item.filename.startsWith(keepPrefix)) return
    iina.file.delete('@data/' + item.filename)
    console.log('removing %s', item.filename)
  })
}

export const SingleVideoCache = {
  get(loadUrl: string): SingleVideo | undefined {
    const file = singleVideoFile(loadUrl)
    if (!iina.file.exists(file)) return
    const content = iinaFileRead(file)
    if (!content) return
    return JSON.parse(content)
  },
  set(loadUrl: string, video: SingleVideo) {
    iina.file.write(singleVideoFile(loadUrl), JSON.stringify(video))
    pruneCache()
  },
}

const playlistCacheFile = (loadUrl: string) =>
  `@data/${today()}__playlist__${sha256(
    JSON.stringify({
      loadUrlBare: removeUrlQuery(loadUrl),
    })
  )}.json`
export const PlaylistCache = {
  get(loadUrl: string): PlaylistItem[] | undefined {
    const file = playlistCacheFile(loadUrl)
    if (!iina.file.exists(file)) return
    const content = iinaFileRead(file)
    if (!content) return
    const items = JSON.parse(content)
    if (!items?.length) return
    return items
  },
  set(loadUrl: string, playlistItems: PlaylistItem[]) {
    iina.file.write(playlistCacheFile(loadUrl), JSON.stringify(playlistItems))
    pruneCache()
  },
}
