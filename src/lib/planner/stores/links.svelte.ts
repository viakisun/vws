import type { ExternalLink } from '../types'

export function createLinksStore(updateLinksFn: (links: ExternalLink[]) => Promise<void>) {
  let links = $state<ExternalLink[]>([])
  let showAddForm = $state(false)
  let adding = $state(false)

  function setLinks(newLinks: ExternalLink[]) {
    links = newLinks
  }

  async function addLink(link: ExternalLink) {
    try {
      adding = true
      const updatedLinks = [...links, link]
      await updateLinksFn(updatedLinks)
      links = updatedLinks
      showAddForm = false
    } catch (e) {
      console.error('Error adding link:', e)
      throw e
    } finally {
      adding = false
    }
  }

  async function removeLink(index: number) {
    try {
      const updatedLinks = links.filter((_, i) => i !== index)
      await updateLinksFn(updatedLinks)
      links = updatedLinks
    } catch (e) {
      console.error('Error removing link:', e)
      throw e
    }
  }

  function toggleAddForm() {
    showAddForm = !showAddForm
  }

  function closeAddForm() {
    showAddForm = false
  }

  return {
    get links() {
      return links
    },
    get showAddForm() {
      return showAddForm
    },
    get adding() {
      return adding
    },
    setLinks,
    addLink,
    removeLink,
    toggleAddForm,
    closeAddForm,
  }
}
