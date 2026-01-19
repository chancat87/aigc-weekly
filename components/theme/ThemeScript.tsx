import { createElement } from 'react'
import { themeScript } from './theme-script'

export function ThemeScript() {
  return createElement('script', {
    dangerouslySetInnerHTML: {
      __html: themeScript,
    },
  })
}
