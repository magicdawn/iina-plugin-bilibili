/**
 * https://github.com/mpv-player/mpv/blob/master/DOCS/edl-mpv.rst
 */

type IEDLOptions = {
  windowTitle?: string
  videoTitle: string
  videoUrl: string
  audioUrl: string
  subtitleUrl: string
}

export function generateEDLUrl({ windowTitle, videoTitle, videoUrl, audioUrl }: IEDLOptions) {
  const lines: string[] = [
    `!global_tags,title=${windowTitle || videoTitle}`,

    `!track_meta,title=${videoTitle}`,
    `%${videoUrl.length}%${videoUrl}`,

    '!new_stream',
    `!track_meta,title=默认音频`,
    `%${audioUrl.length}%${audioUrl}`,
  ].filter(Boolean)

  // '!new_stream',
  // '!track_meta,title=danmaku',
  // `%${subtitleUrl.length}%${subtitleUrl}`,

  return `edl://${lines.join(';')}`
}

type PlaylistItem = string | { url: string; title: string }
export function generatePlaylistUrl(items: PlaylistItem[]) {
  const list: string[] = [
    '#EXTM3U',
    ...items
      .map((item) => {
        if (typeof item === 'string') return item
        const { url, title } = item
        return [`#EXTINF:0,${title}`, url]
      })
      .flat(),
  ]

  return `memory://${list.join('\n')}`
}
