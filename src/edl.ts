/**
 * https://github.com/mpv-player/mpv/blob/master/DOCS/edl-mpv.rst
 */

type IOptions = {
  windowTitle?: string
  videoTitle: string
  videoUrl: string
  audioUrl: string
  subtitleUrl: string
}

export function generateEDLUrl({ windowTitle, videoTitle, videoUrl, audioUrl }: IOptions) {
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
