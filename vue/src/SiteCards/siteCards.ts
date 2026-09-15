/*!
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

import { Matomo, translate } from 'CoreHome';
import SiteGroupsStore, { SiteGroupsMap } from '../SiteGroupsStore/SiteGroupsStore';

// Shows the group of each website on the Websites > Manage cards (SitesManager).

const CARD = '.site.card[idsite]';
const INFO_CLASS = 'sitegroups-card-info';

const reloadedForSite = new Set<string>();

function renderGroup(card: HTMLElement, groupsBySite: SiteGroupsMap) {
  const list = card.querySelector<HTMLElement>('.card-content > .row .col ul');
  if (!list) {
    return; // edit mode
  }

  const idSite = card.getAttribute('idsite') || '';
  const group = groupsBySite.get(idSite) || '';
  let info = list.querySelector<HTMLElement>(`.${INFO_CLASS}`);

  if (!group) {
    info?.remove();
    return;
  }

  const label = `${translate('SiteGroups_Group')}: ${Matomo.helper.htmlDecode(group)}`;
  // writing only on changes, the observer below would otherwise render the card again and again
  if (info && info.textContent === label) {
    return;
  }

  if (!info) {
    info = document.createElement('li');
    info.className = INFO_CLASS;
    list.append(info);
  }

  const title = document.createElement('span');
  title.className = 'title';
  title.textContent = `${translate('SiteGroups_Group')}:`;
  info.replaceChildren(title, document.createTextNode(` ${Matomo.helper.htmlDecode(group)}`));
}

function renderCards(cards: HTMLElement[], reload = false) {
  if (!cards.length) {
    return;
  }

  const load = reload ? SiteGroupsStore.reload() : SiteGroupsStore.load();
  load.then((groupsBySite) => {
    // a website created after the groups were loaded: reload them once
    const unknown = cards
      .map((card) => card.getAttribute('idsite') || '')
      .filter((idSite) => idSite && !groupsBySite.has(idSite) && !reloadedForSite.has(idSite));

    if (unknown.length) {
      unknown.forEach((idSite) => reloadedForSite.add(idSite));
      SiteGroupsStore.reload().then((groups) => cards.forEach((card) => renderGroup(card, groups)));
      return;
    }

    cards.forEach((card) => renderGroup(card, groupsBySite));
  });
}

function findCards(node: HTMLElement): HTMLElement[] {
  const cards = Array.from(node.querySelectorAll<HTMLElement>(CARD));
  const card = node.closest<HTMLElement>(CARD);
  if (card && !cards.includes(card)) {
    cards.push(card);
  }
  return cards;
}

function init() {
  if (new URLSearchParams(window.location.search).get('module') !== 'SitesManager') {
    return;
  }

  renderCards(Array.from(document.querySelectorAll<HTMLElement>(CARD)));

  new MutationObserver((mutations) => {
    const added = new Set<HTMLElement>();
    let leftEditMode = false;

    mutations.forEach((mutation) => {
      const target = mutation.target as HTMLElement;

      // a card leaving edit mode may have a new group
      if (
        mutation.type === 'attributes'
        && target.matches(CARD)
        && (mutation.oldValue || '').includes('editingSite')
        && !target.classList.contains('editingSite')
      ) {
        leftEditMode = true;
        added.add(target);
      }

      if (target.closest?.(`.${INFO_CLASS}`)) {
        return;
      }

      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement && !node.classList.contains(INFO_CLASS)) {
          findCards(node).forEach((card) => added.add(card));
        }
      });
    });

    renderCards([...added], leftEditMode);
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
    attributeOldValue: true,
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
