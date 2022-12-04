// Generated by https://quicktype.io
//
// To change quicktype's target language, run command:
//
//   "Set quicktype target language"

export interface SingleVideo {
  url: string
  site: string
  title: string
  type: string
  streams: { [key: string]: Stream }
  caption: Caption
  err: null
}

export interface Caption {
  danmaku: Danmaku
  subtitle: null
}

export interface Danmaku {
  url: string
  size: number
  ext: string
}

export interface Stream {
  id: string
  quality: string
  parts: Danmaku[]
  size: number
  ext: string
  NeedMux: boolean
}
