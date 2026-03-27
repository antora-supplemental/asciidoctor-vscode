/*---------------------------------------------------------------------------------------------
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { getSettings } from './settings'

function clamp(min: number, max: number, value: number) {
  return Math.min(max, Math.max(min, value))
}

function clampLine(line: number) {
  return clamp(0, getSettings().lineCount - 1, line)
}

export interface CodeLineElement {
  element: HTMLElement
  line: number
}

const getCodeLineElements = (() => {
  let elements: CodeLineElement[]
  return () => {
    // Invalidate cache if DOM was replaced (e.g. preview refresh)
    if (elements?.length && !document.contains(elements[0].element)) {
      elements = undefined!
    }
    if (!elements) {
      elements = Array.prototype.map
        .call(
          document.querySelectorAll(
            'div[class^="data-line-"], div[class*=" data-line-"]',
          ),
          (element: any) => {
            const num = element.className
              .split(' ')
              .pop()
              .match(/data-line-(\d+)/)[1]
            const line = parseInt(num)
            return { element, line }
          },
        )
        .filter((x: any) => !isNaN(x.line)) as CodeLineElement[]
    }
    return elements
  }
})()

/**
 * Find the html elements that map to a specific target line in the editor.
 *
 * If an exact match, returns a single element. If the line is between elements,
 * returns the element prior to and the element after the given line.
 */
export function getElementsForSourceLine(targetLine: number): {
  previous: CodeLineElement
  next?: CodeLineElement
} {
  const lineNumber = Math.floor(targetLine + 1) // off by one line
  const lines = getCodeLineElements()
  let previous = lines[0] || null
  for (const entry of lines) {
    if (entry.line === lineNumber) {
      return { previous: entry, next: undefined }
    } else if (entry.line > lineNumber) {
      return { previous, next: entry }
    }
    previous = entry
  }
  return { previous }
}

/**
 * Find the html elements that are at a specific pixel offset on the page.
 */
export function getLineElementsAtPageOffset(offset: number): {
  previous: CodeLineElement
  next?: CodeLineElement
} {
  const lines = getCodeLineElements()
  const position = offset - window.scrollY
  let lo = -1
  let hi = lines.length - 1
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2)
    const bounds = lines[mid].element.getBoundingClientRect()
    if (bounds.top + bounds.height >= position) {
      hi = mid
    } else {
      lo = mid
    }
  }
  const hiElement = lines[hi]
  const hiBounds = hiElement.element.getBoundingClientRect()
  if (hi >= 1 && hiBounds.top > position) {
    const loElement = lines[lo]
    return { previous: loElement, next: hiElement }
  }
  return { previous: hiElement }
}

/**
 * Attempt to reveal the element for a source line in the editor.
 * @param line - 0-based editor line number (possibly fractional from getVisibleLine).
 */
export function scrollToRevealSourceLine(line: number) {
  const { previous, next } = getElementsForSourceLine(line)
  if (previous && getSettings().scrollPreviewWithEditor) {
    let scrollTo = 0
    const rect = previous.element.getBoundingClientRect()
    const previousTop = rect.top
    // previous.line / next.line are 1-based (from data-line-N); convert for interpolation
    const line1Based = line + 1
    if (next && next.line !== previous.line) {
      // Between two elements. Go to percentage offset between them.
      const betweenProgress =
        (line1Based - previous.line) / (next.line - previous.line)
      const elementOffset =
        next.element.getBoundingClientRect().top - previousTop
      scrollTo = window.scrollY + previousTop + betweenProgress * elementOffset
    } else if (line <= 0) {
      scrollTo = 0
    } else {
      scrollTo = window.scrollY + previousTop
    }
    window.scroll(0, Math.max(1, scrollTo))
  }
}

/**
 * Get the 0-based editor line number for a given scroll offset.
 * (data-line-N in the DOM is 1-based; we return 0-based for the editor.)
 */
export function getEditorLineNumberForPageOffset(offset: number) {
  const { previous, next } = getLineElementsAtPageOffset(offset)
  if (previous) {
    const previousBounds = previous.element.getBoundingClientRect()
    const offsetFromPrevious = offset - window.scrollY - previousBounds.top
    let line1Based: number
    if (next) {
      const progressBetweenElements =
        offsetFromPrevious /
        (next.element.getBoundingClientRect().top - previousBounds.top)
      line1Based =
        previous.line + progressBetweenElements * (next.line - previous.line)
    } else {
      const progressWithinElement = offsetFromPrevious / previousBounds.height
      line1Based = previous.line + progressWithinElement
    }
    return clampLine(line1Based - 1)
  }
  return null
}
