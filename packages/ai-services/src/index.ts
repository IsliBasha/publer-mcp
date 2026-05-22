import Anthropic from '@anthropic-ai/sdk'
import { CaptionService } from './caption.service.js'
import { HashtagService } from './hashtag.service.js'
import { ContentCalendarService } from './content-calendar.service.js'

export type { GenerateCaptionInput, GeneratedCaption, GenerateHashtagsInput, GeneratedHashtags, ContentCalendarEntry, GenerateCalendarInput, CaptionTone } from './types.js'
export { CaptionService } from './caption.service.js'
export { HashtagService } from './hashtag.service.js'
export { ContentCalendarService } from './content-calendar.service.js'

export interface AiServices {
  captions: CaptionService
  hashtags: HashtagService
  calendar: ContentCalendarService
}

export function createAiServices(apiKey: string): AiServices {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required for AI services')
  const client = new Anthropic({ apiKey })
  return {
    captions: new CaptionService(client),
    hashtags: new HashtagService(client),
    calendar: new ContentCalendarService(client),
  }
}
