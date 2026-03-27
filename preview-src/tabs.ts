/*---------------------------------------------------------------------------------------------
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Make [tabs] blocks interactive in the preview.
 * Supports: (1) ARIA tablist/tabpanel from @asciidoctor/tabs, (2) dl-based fallback when extension renders as dlist.
 */
export function initTabs() {
  // 1) Standard tablist + tabpanel (from @asciidoctor/tabs or similar)
  const tablists = document.querySelectorAll(
    '[role="tablist"], ul.tablist, .tabs ul:first-child, .tabset ul:first-child',
  )
  tablists.forEach((tablistEl) => {
    const container =
      tablistEl.closest('.tabset, .tabs') || tablistEl.parentElement
    if (!container) return

    const tabs = Array.from(tablistEl.querySelectorAll('li, [role="tab"]'))
    let panels = Array.from(
      container.querySelectorAll(
        '[role="tabpanel"], .tabpanel, .tabs-content > div, .tabset > .content > div',
      ),
    ).filter((el) => el !== tablistEl && !tablistEl.contains(el))
    if (panels.length === 0) {
      panels = Array.from(container.children).filter(
        (el) => el !== tablistEl && !tablistEl.contains(el) && el.tagName !== 'STYLE',
      )
    }

    if (tabs.length === 0 || panels.length === 0) {
      tryDlistTabs(container)
      return
    }

    const tabCount = Math.min(tabs.length, panels.length)
    for (let i = 0; i < tabCount; i++) {
      const tab = tabs[i]
      const panel = panels[i]
      tab.setAttribute('role', 'tab')
      tab.setAttribute('aria-selected', i === 0 ? 'true' : 'false')
      panel.setAttribute('role', 'tabpanel')
      panel.setAttribute('aria-hidden', i === 0 ? 'false' : 'true')
      if (i > 0) (panel as HTMLElement).style.display = 'none'

      tab.addEventListener('click', () => {
        tabs.forEach((t, j) => {
          t.setAttribute('aria-selected', j === i ? 'true' : 'false')
          ;(t as HTMLElement).classList.toggle('is-active', j === i)
        })
        panels.forEach((p, j) => {
          const hidden = j !== i
          p.setAttribute('aria-hidden', String(hidden))
          ;(p as HTMLElement).style.display = hidden ? 'none' : ''
        })
      })
    }
    if (tabCount > 0) {
      (tabs[0] as HTMLElement).classList.add('is-active')
    }
  })

  // 2) Fallback: dl/dt/dd as tabs (e.g. [tabs] without extension or different backend)
  document.querySelectorAll('.exampleblock.tabs, .tabset').forEach((block) => {
    if (block.querySelector('[role="tablist"]')) return // already handled
    tryDlistTabs(block)
  })
}

function tryDlistTabs(container: Element) {
  const dl = container.querySelector('dl')
  if (!dl || dl.querySelector('.tablist')) return

  const items: { dt: Element; dd: Element }[] = []
  const dts = Array.from(dl.querySelectorAll('dt'))
  const dds = Array.from(dl.querySelectorAll('dd'))
  if (dts.length === 0 || dts.length !== dds.length) return

  for (let i = 0; i < dts.length; i++) {
    items.push({ dt: dts[i], dd: dds[i] })
  }

  const ul = document.createElement('ul')
  ul.setAttribute('role', 'tablist')
  ul.className = 'tablist'

  items.forEach(({ dt, dd }, i) => {
    const li = document.createElement('li')
    li.setAttribute('role', 'tab')
    li.setAttribute('aria-selected', i === 0 ? 'true' : 'false')
    li.classList.toggle('is-active', i === 0)
    li.textContent = dt.textContent || `Tab ${i + 1}`
    li.addEventListener('click', () => {
      items.forEach((_, j) => {
        const isActive = j === i
        ;(ul.children[j] as HTMLElement).setAttribute(
          'aria-selected',
          String(isActive),
        )
        ;(ul.children[j] as HTMLElement).classList.toggle('is-active', isActive)
        ;(items[j].dd as HTMLElement).style.display = isActive ? '' : 'none'
      })
    })
    ul.appendChild(li)
    ;(dd as HTMLElement).style.display = i === 0 ? '' : 'none'
  })

  dl.insertBefore(ul, dl.firstChild)
}
