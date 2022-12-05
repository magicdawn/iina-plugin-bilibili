import './dts/console'

import { URI } from './vendor'
import { type SingleVideo } from './define/single-video'
import { generateEDLUrl, generatePlaylistUrl, PlaylistItem } from './protocol'
import { removeQueryForUrl, zsh } from './utils'
import { pruneCache, PlaylistCache, SingleVideoCache } from './cache'

// 非常 weird 的写法, 但是 mpv 要求这样
iina.mpv.addHook('on_load', 10, async (next) => {
  await onLoadHook()
  next()
})

pruneCache()

// https://github.com/mpv-player/mpv/blob/master/player/lua/ytdl_hook.lua
async function onLoadHook() {
  const loadUrl = iina.mpv.getString('stream-open-filename')
  const processHere =
    loadUrl.startsWith('https://www.bilibili.com/video/') ||
    loadUrl.startsWith('https://www.bilibili.com/bangumi')
  console.log('loadUrl = %s, process by current plugin ? %s', loadUrl, processHere)
  if (!processHere) return

  const open = (type: 'single' | 'playlist', url: string) => {
    console.log('opening type=%s url=%s', type, url)
    iina.mpv.set('stream-open-filename', url)
    setBilibiliHeaders()
  }

  const usePlaylist = toResolvePlaylist(loadUrl)
  if (!usePlaylist) {
    const video = await getSingleVideo(loadUrl)
    if (!video) return
    const edlUrl = videoToEDLUrl(video)
    open('single', edlUrl)
    return
  }

  // playlist
  else {
    const playlistItems = await getPlaylistItems(loadUrl)
    if (!playlistItems?.length) return

    playlistItems.forEach((item, index) => {
      item.url = URI(item.url).setQuery({ __index__: index }).href()
    })

    const playlistUrl = generatePlaylistUrl(playlistItems)
    open('playlist', playlistUrl)

    const loadUrlBare = removeQueryForUrl(loadUrl)
    const playIndex = playlistItems.findIndex((item) => removeQueryForUrl(item.url) === loadUrlBare)
    console.log('find playlist-start', loadUrlBare, playlistItems, playIndex)
    if (playIndex > -1) {
      console.log('playlist index %s', playIndex)
      iina.mpv.set('playlist-start', playIndex.toString()) // 否则 iina 会 setDouble, 到 mpv 就失败了
    }
  }
}

async function getSingleVideo(loadUrl: string): Promise<SingleVideo | undefined> {
  {
    const video = SingleVideoCache.get(loadUrl)
    if (video) return video
  }

  {
    const videosArr = await execLux(loadUrl, false)
    const video = videosArr?.[0]
    if (!video) return

    SingleVideoCache.set(loadUrl, video)
    return video
  }
}

async function getPlaylistItems(loadUrl: string): Promise<PlaylistItem[] | undefined> {
  {
    const playlistItems = PlaylistCache.get(loadUrl)
    if (playlistItems) return playlistItems
  }

  const videosArr = await execLux(loadUrl, true)
  if (!videosArr?.length) return

  // single video cache
  videosArr.forEach((video) => {
    SingleVideoCache.set(video.url, video)
  })

  const playlistItems = videosArr.map((v) => {
    const urlAsPlaylistItem = URI(v.url).query('').addQuery('playlist-item').href()
    return {
      title: v.title,
      url: urlAsPlaylistItem,
    }
  })

  // playlist cache
  videosArr.forEach((video) => {
    PlaylistCache.set(video.url, playlistItems)
  })

  return playlistItems
}

function getBestId(video: SingleVideo, useHevc = true) {
  let ids = Object.keys(video.streams)

  // 移除所有的 hevc 再排序
  if (!useHevc) {
    ids = ids.filter((id) => !video.streams[id].quality.includes('hev'))
  }

  const bestId = ids.sort(qualityDescendantsSorter)[0]
  return bestId
}

/**
 * lux 返回的 quality 排序, 大数在前, 比如 80-16 > 80-7 > 32-7
 */
function qualityDescendantsSorter(a: string, b: string) {
  const aArr = a.split('-').map(Number)
  const bArr = b.split('-').map(Number)
  const maxLen = Math.max(aArr.length, bArr.length)

  for (let i = 0; i < maxLen; i++) {
    const aCur = aArr[i] ?? -1
    const bCur = bArr[i] ?? -1

    if (aCur > bCur) return -1 // 大数在前
    if (aCur < bCur) return 1
    if (aCur === bCur) continue
  }

  return 0
}

function getCookieOptions() {
  const cookieFile = '~/bilibili.cookie.txt'
  if (!iina.file.exists(cookieFile)) return ''

  let content = iina.file.read(cookieFile, {})
  if (content && /^\/\//m.test(content)) {
    // 原始的 -c 不支持注释
    // 去除注释
    content = content
      .split('\n')
      .filter((line) => !line.startsWith('//'))
      .filter(Boolean)
      .join(',')
    iina.file.write(cookieFile, content)
  }

  if (content) {
    return `-c ${cookieFile}`
  }

  return ''
}

function videoToEDLUrl(video: SingleVideo) {
  // TODO: 设置是否选择 hevc
  const bestId = getBestId(video, false)
  const stream = video.streams[bestId]
  console.log(
    'using best quality stream for video %s: stream id = %s, quality = %s',
    video.title,
    bestId,
    stream.quality
  )

  const VIDEO_EXTS = ['mp4', 'flv']
  const AUDIO_EXTS = ['m4a']
  const videoUrl = stream.parts.find((item) => VIDEO_EXTS.includes(item.ext))?.url ?? ''
  const audioUrl = stream.parts.find((item) => AUDIO_EXTS.includes(item.ext))?.url ?? ''
  const videoTitle = video.title
  const windowTitle = `${video.site} - ${video.title} (${stream.quality})` // 窗口会显示

  const edlUrl = generateEDLUrl({
    windowTitle,
    videoTitle,
    videoUrl,
    audioUrl,
    subtitleUrl: video.caption.danmaku.url,
  })

  return edlUrl
}

function setBilibiliHeaders() {
  // set http fields
  const headers = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Charset': 'UTF-8,*;q=0.5',
    'Accept-Encoding': 'gzip,deflate,sdch',
    'Accept-Language': 'en-US,en;q=0.8',
    'Referer': 'https://www.bilibili.com',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.81 Safari/537.36',
  }
  const headersAsList = Object.entries(headers).reduce((arr, [field, value]) => {
    return [...arr, `${field}: ${value}`]
  }, [])
  iina.mpv.set('file-local-options/http-header-fields', headersAsList)
}

function toResolvePlaylist(loadUrl: string) {
  const uri = new URI(loadUrl)

  // 显示标记 playlist-item
  if (uri.hasQuery('playlist-item')) {
    return false
  }

  // 显示标记 要整个列表
  if (uri.hasQuery('all')) {
    return true
  }

  // 单个番剧, 而且不在播放列表中
  const isBangumi = loadUrl.startsWith('https://www.bilibili.com/bangumi')
  // console.log('toResolvePlaylist', iina.playlist.count())
  if (isBangumi && iina.playlist.count() === 0) {
    return true
  }

  return false
}

async function execLux(loadUrl: string, usePlaylist: boolean) {
  const _c = getCookieOptions()
  const _p = usePlaylist ? '-p' : ''
  const loadUrlBare = removeQueryForUrl(loadUrl) // 分P ???
  const cmd = `lux -j ${_c} ${_p} '${loadUrlBare}'`

  // exec
  const { stdout, stderr } = await zsh(cmd)
  if (stderr.trim()) return
  const videosArr = JSON.parse(stdout.trim()) as SingleVideo[]
  return videosArr
}
