import type { Episode, Podcast } from '../types'

export interface ParsedFeed {
  podcast: Pick<Podcast, 'feedUrl' | 'title' | 'author' | 'artworkUrl' | 'description'>
  episodes: Episode[]
}

function text(parent: Element | Document, tagName: string): string | undefined {
  const el = parent.getElementsByTagName(tagName)[0]
  const value = el?.textContent?.trim()
  return value ? value : undefined
}

function attr(parent: Element | Document, tagName: string, attrName: string): string | undefined {
  const el = parent.getElementsByTagName(tagName)[0]
  const value = el?.getAttribute(attrName)?.trim()
  return value ? value : undefined
}

function parsePubDate(value: string | undefined): number {
  if (!value) return Date.now()
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? Date.now() : parsed
}

// itunes:duration is either plain seconds ("1800") or HH:MM:SS / MM:SS.
function parseDuration(value: string | undefined): number | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (/^\d+$/.test(trimmed)) return Number(trimmed)

  const parts = trimmed.split(':').map(Number)
  if (parts.some(Number.isNaN)) return undefined

  return parts.reduce((total, part) => total * 60 + part, 0)
}

function channelArtwork(channel: Element): string | undefined {
  return attr(channel, 'itunes:image', 'href') ?? text(channel, 'image')
}

function itemArtwork(item: Element): string | undefined {
  return attr(item, 'itunes:image', 'href')
}

export function parseFeed(xmlText: string, feedUrl: string): ParsedFeed {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml')

  const parserError = doc.getElementsByTagName('parsererror')[0]
  if (parserError) {
    throw new Error(`Failed to parse feed XML: ${parserError.textContent?.trim() ?? 'unknown error'}`)
  }

  const channel = doc.getElementsByTagName('channel')[0]
  if (!channel) {
    throw new Error('Feed is missing a <channel> element')
  }

  const podcast: ParsedFeed['podcast'] = {
    feedUrl,
    title: text(channel, 'title') ?? feedUrl,
    author: text(channel, 'itunes:author'),
    artworkUrl: channelArtwork(channel),
    description: text(channel, 'description'),
  }

  const items = Array.from(channel.getElementsByTagName('item'))
  const episodes: Episode[] = items
    .map((item): Episode | null => {
      const enclosure = item.getElementsByTagName('enclosure')[0]
      const audioUrl = enclosure?.getAttribute('url')?.trim()
      if (!audioUrl) return null // not a playable episode (e.g. a bonus text post)

      const guid = text(item, 'guid') ?? audioUrl
      const title = text(item, 'title') ?? 'Untitled episode'

      return {
        id: `${feedUrl}::${guid}`,
        feedUrl,
        guid,
        title,
        description: text(item, 'description'),
        audioUrl,
        audioType: enclosure.getAttribute('type')?.trim() || undefined,
        durationSec: parseDuration(text(item, 'itunes:duration')),
        pubDate: parsePubDate(text(item, 'pubDate')),
        artworkUrl: itemArtwork(item) ?? podcast.artworkUrl,
      }
    })
    .filter((episode): episode is Episode => episode !== null)

  return { podcast, episodes }
}
