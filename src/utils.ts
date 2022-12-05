import { URI, sha, dayjs } from './vendor'

export async function zsh(cmd: string): ReturnType<typeof iina.utils.exec> {
  console.log('zsh exec cmd = %s', cmd)
  const res = await iina.utils.exec('/bin/zsh', ['-c', cmd])
  console.log(
    'zsh exec result, status = %s\nstdout =>\n%s\nstderr =>\n%s',
    res.status,
    res.stdout,
    res.stderr
  )
  return res
}

export function sha256(str: string | object) {
  if (typeof str !== 'string') str = JSON.stringify(str)
  return sha('sha256').update(str).digest('hex')
}

export function iinaFileRead(path: string) {
  return iina.file.read(path, {}) || ''
}

export function removeQueryForUrl(url: string) {
  return URI(url).query('').href()
}

export const today = () => dayjs().format('YYYY-MM-DD')
