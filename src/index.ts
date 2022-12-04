import './dts/console'

import { type SingleVideo } from './define/single-video'
import { generateEDLUrl } from './edl'
import { zsh } from './utils'

// https://www.bilibili.com/video/BV1jt4y1M7XH/

console.log('before addHook = %s', Date.now())

iina.mpv.addHook('on_load', 10, async (next) => {
  await onLoadHook()
  next()
})

// https://github.com/mpv-player/mpv/blob/master/player/lua/ytdl_hook.lua
async function onLoadHook() {
  const loadUrl = iina.mpv.getString('stream-open-filename')
  const processHere =
    loadUrl.startsWith('https://www.bilibili.com/video/') ||
    loadUrl.startsWith('https://www.bilibili.com/bangumi')
  console.log('loadUrl = %s, processHere', loadUrl, processHere)
  if (!processHere) return

  // 原始的 -c 不支持注释
  const cookieFile = '~/bilibili.cookie.txt'
  let cookieOptions = ''
  if (iina.file.exists(cookieFile)) {
    const content = iina.file.read(cookieFile, {})
    let cookie = content
      .split('\n')
      .filter((line) => !line.startsWith('//'))
      .filter(Boolean)
      .join(',')

    // cookie 中可能包含单引号, 需要 escape
    cookie = cookie.replace(/'/g, "\\'")
    cookieOptions = `-c $'${cookie}'`
  }

  const { stdout, stderr } = await zsh(`lux -j ${cookieOptions} '${loadUrl}'`)
  if (stderr.trim()) return

  const json = JSON.parse(stdout.trim()) as SingleVideo[]
  const video = json[0]

  const bestId = Object.keys(video.streams).sort(qualityDescendantsSorter)[0]
  const stream = video.streams[bestId]
  console.log('using best quality stream, id = %s, quality = %j', bestId, stream.quality)

  // const urls = stream.parts.map((x) => x.url)
  // console.log(urls)

  const VIDEO_EXTS = ['mp4', 'flv']
  const AUDIO_EXTS = ['m4a']
  const videoUrl = stream.parts.find((item) => VIDEO_EXTS.includes(item.ext))?.url
  const audioUrl = stream.parts.find((item) => AUDIO_EXTS.includes(item.ext))?.url
  const videoTitle = video.title
  const windowTitle = `${video.site} - ${video.title} (${stream.quality})` // 窗口会显示

  const edlUrl = generateEDLUrl({
    windowTitle,
    videoTitle,
    videoUrl,
    audioUrl,
    subtitleUrl: video.caption.danmaku.url,
  })

  // console.log('opening %s', urls[0])
  // iina.mpv.set('stream-open-filename', urls[0])

  console.log('opening %s', edlUrl)
  iina.mpv.set('stream-open-filename', edlUrl)

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
