/*!
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

import {
  beforeEach, describe, expect, it, vi,
} from 'vitest';

const fetchMock = vi.hoisted(() => vi.fn());

vi.mock('CoreHome', () => ({
  translate: (key: string, ...values: string[]) => [key, ...values].join(' '),
  Matomo: { idSite: 1, helper: { htmlDecode: (value: string) => value } },
  AjaxHelper: { fetch: fetchMock },
}));

const flush = () => new Promise((resolve) => { setTimeout(resolve, 10); });

interface SiteRow {
  idsite: number;
  name: string;
  group?: string;
}

// markup rendered by the core SiteSelector, names prefixed with their group by SitesStore
function siteRowHtml({ idsite, name, group }: SiteRow) {
  const label = group ? `[${group}] ${name}` : name;
  return '<li class="mtm-dropdownPanel__menuItem">'
    + `<a class="mtm-dropdownPanel__menuLink" href="?module=CoreHome&idSite=${idsite}#?idSite=${idsite}" title="${label}">`
    + `<span class="mtm-dropdownPanel__menuLabel">${label}</span></a></li>`;
}

function render(sites: SiteRow[]) {
  document.body.innerHTML = '<div class="siteSelector piwikSelector expanded">'
    + '<div class="mtm-dropdownPanel"><div class="mtm-dropdownPanel__search"><input></div>'
    + `<ul class="mtm-dropdownPanel__menu">${sites.map(siteRowHtml).join('')}`
    + '<li class="mtm-dropdownPanel__menuItem"><a class="mtm-dropdownPanel__menuLink" href="?module=MultiSites&idSite=1">'
    + '<span class="mtm-dropdownPanel__menuLabel">All websites</span></a></li>'
    + '</ul></div></div>';

  fetchMock.mockResolvedValue(sites.map(({ idsite, group }) => ({ idsite, group: group || '' })));
}

function visualList() {
  const ul = document.querySelector('.mtm-dropdownPanel__menu')!;
  return Array.from(ul.children)
    .map((li) => li as HTMLElement)
    .sort((a, b) => Number(a.style.order) - Number(b.style.order))
    .map((li) => {
      const prefix = li.classList.contains('sitegroups-header') ? '#' : '';
      const hidden = li.hasAttribute('data-sitegroups-collapsed') ? ' (collapsed)' : '';
      const text = li.classList.contains('sitegroups-header')
        ? li.querySelector('.sitegroups-header__label')!.textContent
        : li.textContent;
      return `${prefix}${text}${hidden}`;
    });
}

describe('siteSelectorGroups', () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    window.localStorage.clear();
    // a new <body>: the observers of the modules imported by previous tests watch the old one
    document.documentElement.replaceChild(document.createElement('body'), document.body);
  });

  it('lists the websites by group, ungrouped ones and "All websites" last', async () => {
    render([
      { idsite: 1, name: 'Zeta' },
      { idsite: 2, name: 'Lazuli', group: 'Agences' },
      { idsite: 3, name: 'Beta', group: 'Brands' },
      { idsite: 4, name: 'Alpha', group: 'Agences' },
    ]);

    await import('./siteSelectorGroups');
    await flush();

    expect(visualList()).toEqual([
      '#Agences', 'Alpha', 'Lazuli', '#Brands', 'Beta', '#SiteGroups_Ungrouped', 'Zeta', 'All websites',
    ]);
    expect(document.querySelector('a[title="Lazuli"]')).not.toBeNull();
    expect(document.querySelector('.sitegroups-header__count')!.textContent).toBe('2');
  });

  it('does not add headers when no website has a group', async () => {
    render([{ idsite: 1, name: 'Zeta' }, { idsite: 2, name: 'Alpha' }]);

    await import('./siteSelectorGroups');
    await flush();

    expect(document.querySelectorAll('.sitegroups-header')).toHaveLength(0);
    expect(visualList()).toEqual(['Alpha', 'Zeta', 'All websites']);
  });

  it('collapses the groups of large lists except the current website group, and remembers toggles', async () => {
    const sites: SiteRow[] = [{ idsite: 1, name: 'Current', group: 'Mine' }];
    for (let idsite = 2; idsite <= 11; idsite += 1) {
      sites.push({ idsite, name: `Site ${idsite}`, group: 'Others' });
    }
    render(sites);

    await import('./siteSelectorGroups');
    await flush();

    expect(visualList()[0]).toBe('#Mine');
    expect(visualList()[1]).toBe('Current');
    expect(visualList()[3]).toBe('Site 10 (collapsed)');

    const othersToggle = document.querySelector<HTMLElement>('[data-sitegroups-key="others"] button')!;
    expect(othersToggle.getAttribute('aria-expanded')).toBe('false');

    othersToggle.click();
    await flush();

    expect(othersToggle.getAttribute('aria-expanded')).toBe('true');
    expect(visualList()[3]).toBe('Site 10');
    expect(JSON.parse(window.localStorage.getItem('SiteGroups.expandedGroups')!)).toEqual({ others: true });
  });

  it('decorates again when Vue patches a label, keeping the search highlight', async () => {
    render([{ idsite: 2, name: 'Lazuli', group: 'Agences' }]);

    await import('./siteSelectorGroups');
    await flush();

    const label = document.querySelector<HTMLElement>('.mtm-dropdownPanel__menuLabel')!;
    label.innerHTML = '[Agences] <span class="mtm-dropdownPanel__searchMatch">Laz</span>uli';
    await flush();

    expect(label.textContent).toBe('Lazuli');
    expect(label.querySelector('.mtm-dropdownPanel__searchMatch')!.textContent).toBe('Laz');
  });

  it('removes the group prefix when the search highlight changed its casing', async () => {
    render([{ idsite: 9, name: 'Blog Voyages', group: 'Médias' }]);

    await import('./siteSelectorGroups');
    await flush();

    // the core shows the matched part with the casing typed in the search
    const label = document.querySelector<HTMLElement>('.mtm-dropdownPanel__menuLabel')!;
    label.innerHTML = '[<span class="mtm-dropdownPanel__searchMatch">mé</span>dias] Blog Voyages';
    await flush();

    expect(label.textContent).toBe('Blog Voyages');
  });
});
