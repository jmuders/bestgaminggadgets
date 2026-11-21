const menu = document.querySelector('.menu-toggle')
const navigation = document.querySelector('#main-nav')
menu.hidden = false
menu.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', String(menu.getAttribute('aria-expanded') === 'false'))
})
navigation.addEventListener('click', (event) => {
  if (event.target.closest('a') && getComputedStyle(menu).display !== 'none') {
    menu.setAttribute('aria-expanded', 'false')
    menu.focus()
  }
})
navigation.parentElement.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false')
    menu.focus()
  }
})

const filter = document.querySelector('.filter')
const filterButtons = [...filter.querySelectorAll('button')]
const productCards = [...document.querySelectorAll('[data-gpu]')]
const filterStatus = document.querySelector('#filter-status')
filter.hidden = false
filter.addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]')
  if (!button) return

  for (const option of filterButtons) {
    option.setAttribute('aria-pressed', String(option === button))
  }
  for (const card of productCards) {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.gpu !== button.dataset.filter
  }
  const count = productCards.filter((card) => !card.hidden).length
  filterStatus.textContent = count === 1 ? 'Showing 1 mini PC' : `Showing ${count} mini PCs`
})

const compareControls = document.querySelector('.compare-controls')
const checkboxes = [...compareControls.querySelectorAll('input')]
const modelCells = [...document.querySelectorAll('[data-model]')]
const updateTable = () => {
  const selected = new Set(checkboxes.filter((input) => input.checked).map((input) => input.value))
  for (const input of checkboxes) {
    input.disabled = input.checked && selected.size === 1
  }
  for (const cell of modelCells) {
    cell.hidden = !selected.has(cell.dataset.model)
  }
}
compareControls.hidden = false
compareControls.addEventListener('change', updateTable)
updateTable()

const tag = window.amazonAssociatesTag?.trim()
if (tag && /^[a-z0-9][a-z0-9-]*-20$/i.test(tag)) {
  for (const link of document.querySelectorAll('[data-amazon]')) {
    const url = new URL(link.href)
    url.searchParams.set('tag', tag)
    link.href = url
  }
  document.querySelector('[data-disclosure]').textContent = 'As an Amazon Associate I earn from qualifying purchases.'
  document.querySelector('[data-table-disclosure]').hidden = false
}
