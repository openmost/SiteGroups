/*!
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

import { Matomo, translate } from 'CoreHome';
import SiteGroupsStore, { SiteGroupsMap } from '../SiteGroupsStore/SiteGroupsStore';

// Groups the websites listed by the core SiteSelector under collapsible headers.
//
// The list is rendered by Vue (keyed v-for), so Vue's <li> nodes are never moved: the <ul> becomes
// a flex column and each row gets a CSS `order`. Headers are extra <li> appended to the <ul>, Vue
// ignores them as they are not in its vnode tree. Whenever Vue patches the list (search, clear,
// reload), the MutationObserver decorates it again.

const SELECTOR = '.siteSelector';
const LIST = '.mtm-dropdownPanel__menu';
const SEARCH_INPUT = '.mtm-dropdownPanel__search input';
const HEADER_CLASS = 'sitegroups-header';
const HOST_CLASS = 'sitegroups-list';
const UNGROUPED_KEY = '';

// above this number of websites, groups are collapsed until opened
const COLLAPSE_THRESHOLD = 10;
// rows that are not websites keep their place: before the websites (order -1) or after them
const ORDER_AFTER_SITES = 1000000;

const EXPANDED_STORAGE_KEY = 'SiteGroups.expandedGroups';

interface Row {
  li: HTMLElement;
  idSite: string;
  groupKey: string;
  groupLabel: string;
  name: string;
  isVisible: boolean;
}

interface Group {
  key: string;
  label: string;
  rows: Row[];
}

const observedLists = new WeakMap<HTMLElement, MutationObserver>();
const strippedLabels = new WeakMap<HTMLElement, string>();

function readExpandedGroups(): Record<string, boolean> {
  try {
    const value = JSON.parse(window.localStorage.getItem(EXPANDED_STORAGE_KEY) || '{}');
    return value && typeof value === 'object' ? value : {};
  } catch (e) {
    return {};
  }
}

function writeExpandedGroups(groups: Record<string, boolean>) {
  try {
    window.localStorage.setItem(EXPANDED_STORAGE_KEY, JSON.stringify(groups));
  } catch (e) {
    // private browsing or storage disabled: the choice lasts until the next page load
  }
}

const expandedGroups = readExpandedGroups();

// the website row links end with a hash (#?...&idSite=), the "All websites" link has none
function getSiteId(li: HTMLElement): string | null {
  const link = li.querySelector<HTMLAnchorElement>('a.mtm-dropdownPanel__menuLink');
  const href = link?.getAttribute('href') || '';
  if (href.indexOf('#') === -1) {
    return null;
  }

  const match = href.match(/[?&#]idSite=(\d+)/);
  return match ? match[1] : null;
}

function decodeGroup(group: string): string {
  return Matomo.helper.htmlDecode(group);
}

// The core store prefixes names with "[group] " when a website has a group. The headers already
// show it, so the prefix is removed from the label text, keeping the search highlight markup.
function stripGroupPrefix(label: HTMLElement, group: string) {
  if (!group || strippedLabels.get(label) === label.innerHTML) {
    return;
  }

  // case insensitive: the search highlight shows the matched part with the casing typed
  const prefix = `[${group}] `;
  let prefixLength = prefix.length;
  const text = label.textContent || '';
  if (text.substring(0, prefixLength).toLocaleLowerCase() !== prefix.toLocaleLowerCase()) {
    return;
  }

  const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
  while (prefixLength > 0 && walker.nextNode()) {
    const node = walker.currentNode as Text;
    const removed = Math.min(prefixLength, node.data.length);
    node.deleteData(0, removed);
    prefixLength -= removed;
  }

  strippedLabels.set(label, label.innerHTML);
}

function getSiteName(li: HTMLElement, group: string): string {
  const label = li.querySelector<HTMLElement>('.mtm-dropdownPanel__menuLabel');
  if (!label) {
    return '';
  }

  stripGroupPrefix(label, group);

  const link = li.querySelector<HTMLAnchorElement>('a.mtm-dropdownPanel__menuLink');
  const title = link?.getAttribute('title');
  if (link && group && title && title.startsWith(`[${group}] `)) {
    link.setAttribute('title', title.substring(`[${group}] `.length));
  }

  return (label.textContent || '').trim();
}

function isCollapsed(
  ul: HTMLElement,
  key: string,
  siteCount: number,
  activeGroupKey: string | null,
) {
  const selector = ul.closest(SELECTOR);
  const search = selector?.querySelector<HTMLInputElement>(SEARCH_INPUT);
  if (search && search.value.trim()) {
    return false;
  }

  if (typeof expandedGroups[key] === 'boolean') {
    return !expandedGroups[key];
  }

  return siteCount >= COLLAPSE_THRESHOLD && key !== activeGroupKey;
}

function buildHeader(key: string, onToggle: () => void): HTMLLIElement {
  const li = document.createElement('li');
  li.className = HEADER_CLASS;
  li.dataset.sitegroupsKey = key;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = `${HEADER_CLASS}__toggle`;
  button.tabIndex = 4;

  const caret = document.createElement('span');
  caret.className = `${HEADER_CLASS}__caret icon-chevron-down`;
  caret.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = `${HEADER_CLASS}__label`;

  const count = document.createElement('span');
  count.className = `${HEADER_CLASS}__count`;

  button.append(caret, label, count);
  li.append(button);

  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();

    expandedGroups[key] = button.getAttribute('aria-expanded') !== 'true';
    writeExpandedGroups(expandedGroups);
    onToggle();
  });

  return li;
}

function decorate(ul: HTMLElement, groupsBySite: SiteGroupsMap) {
  const observer = observedLists.get(ul);
  const headers = new Map<string, HTMLLIElement>();
  const rows: Row[] = [];
  const others: { li: HTMLElement, afterSites: boolean }[] = [];

  Array.from(ul.children).forEach((child) => {
    const li = child as HTMLElement;

    if (li.classList.contains(HEADER_CLASS)) {
      const key = li.dataset.sitegroupsKey;
      if (typeof key === 'string' && !headers.has(key)) {
        headers.set(key, li as HTMLLIElement);
      } else {
        li.remove();
      }
      return;
    }

    const idSite = getSiteId(li);
    if (idSite === null) {
      others.push({ li, afterSites: rows.length > 0 });
      return;
    }

    const group = groupsBySite.get(idSite) || '';
    li.dataset.sitegroupsId = idSite;
    // read by the stylesheet to show the website id before its name
    li.querySelector('a.mtm-dropdownPanel__menuLink')?.setAttribute('data-sitegroups-id', idSite);

    rows.push({
      li,
      idSite,
      groupKey: group ? decodeGroup(group).toLocaleLowerCase() : UNGROUPED_KEY,
      groupLabel: group ? decodeGroup(group) : translate('SiteGroups_Ungrouped'),
      name: getSiteName(li, group),
      // v-show hides the current website in the top selector
      isVisible: li.style.display !== 'none',
    });
  });

  rows.sort((a, b) => {
    if (a.groupKey !== b.groupKey) {
      if (a.groupKey === UNGROUPED_KEY) {
        return 1;
      }
      if (b.groupKey === UNGROUPED_KEY) {
        return -1;
      }
      return a.groupKey.localeCompare(b.groupKey);
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  const groups: Group[] = [];
  rows.forEach((row) => {
    let group = groups[groups.length - 1];
    if (!group || group.key !== row.groupKey) {
      group = { key: row.groupKey, label: row.groupLabel, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  });

  // headers are only worth it when at least one website has a group
  const showHeaders = groups.some((group) => group.key !== UNGROUPED_KEY);
  const activeGroup = groupsBySite.get(`${Matomo.idSite}`);
  const activeGroupKey = activeGroup ? decodeGroup(activeGroup).toLocaleLowerCase() : UNGROUPED_KEY;

  ul.classList.add(HOST_CLASS);

  let order = 1;
  groups.forEach((group) => {
    const visibleRows = group.rows.filter((row) => row.isVisible).length;
    const collapsed = showHeaders
      && isCollapsed(ul, group.key, SiteGroupsStore.siteCount, activeGroupKey);

    if (showHeaders) {
      const header = headers.get(group.key) || buildHeader(
        group.key,
        () => SiteGroupsStore.load().then((groupsMap) => decorate(ul, groupsMap)),
      );
      headers.delete(group.key);

      if (!header.parentNode) {
        ul.append(header);
      }

      const button = header.querySelector('button')!;
      button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      button.setAttribute('aria-label', translate('SiteGroups_ToggleGroup', group.label));
      header.querySelector(`.${HEADER_CLASS}__label`)!.textContent = group.label;
      header.querySelector(`.${HEADER_CLASS}__count`)!.textContent = `${visibleRows}`;
      header.hidden = visibleRows === 0;
      header.style.order = `${order}`;
      order += 1;
    }

    group.rows.forEach((row) => {
      row.li.style.order = `${order}`;
      order += 1;
      row.li.toggleAttribute('data-sitegroups-collapsed', collapsed);
    });
  });

  // headers of groups without any listed website anymore
  headers.forEach((header) => header.remove());

  others.forEach(({ li, afterSites }) => {
    li.style.order = afterSites ? `${ORDER_AFTER_SITES}` : '-1';
  });

  // our own changes must not trigger another decoration
  observer?.takeRecords();
}

function observeList(ul: HTMLElement) {
  if (observedLists.has(ul)) {
    return;
  }

  const observer = new MutationObserver(() => {
    SiteGroupsStore.load().then((groups) => decorate(ul, groups));
  });

  // childList: rows added or removed by a search, attributes: v-show and link updates
  observer.observe(ul, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['href', 'style'],
  });
  observedLists.set(ul, observer);

  SiteGroupsStore.load().then((groups) => decorate(ul, groups));
}

function enhanceSelector(selector: HTMLElement) {
  if (selector.dataset.sitegroupsEnhanced) {
    return;
  }
  selector.dataset.sitegroupsEnhanced = '1';

  // groups are fetched on the first interaction, not on every page load
  const start = () => {
    selector.removeEventListener('pointerenter', start);
    selector.removeEventListener('focusin', start);

    const ul = selector.querySelector<HTMLElement>(LIST);
    if (ul) {
      observeList(ul);
    }
  };

  selector.addEventListener('pointerenter', start);
  selector.addEventListener('focusin', start);

  if (selector.classList.contains('expanded')) {
    start();
  }
}

function scan(root: ParentNode) {
  if (root instanceof HTMLElement && root.matches(SELECTOR)) {
    enhanceSelector(root);
  }
  root.querySelectorAll<HTMLElement>(SELECTOR).forEach(enhanceSelector);
}

function init() {
  scan(document);

  new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          scan(node);
        }
      });
    });
  }).observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
