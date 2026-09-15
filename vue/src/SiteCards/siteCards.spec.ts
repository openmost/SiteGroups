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
  translate: (key: string) => key,
  Matomo: { idSite: 1, helper: { htmlDecode: (value: string) => value } },
  AjaxHelper: { fetch: fetchMock },
}));

const flush = () => new Promise((resolve) => { setTimeout(resolve, 10); });

function cardHtml(idSite: number) {
  return `<div class="site card" idsite="${idSite}"><div class="card-content"><div class="row">`
    + `<div class="col m3"><ul><li><span class="title">Id:</span> ${idSite}</li></ul></div>`
    + '</div></div></div>';
}

describe('siteCards', () => {
  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    window.history.replaceState({}, '', '/?module=SitesManager');
    // a new <body>: the observers of the modules imported by previous tests watch the old one
    document.documentElement.replaceChild(document.createElement('body'), document.body);
    document.body.innerHTML = cardHtml(1) + cardHtml(2);
  });

  it('shows the group once and leaves the DOM alone afterwards', async () => {
    fetchMock.mockResolvedValue([{ idsite: 1, group: '' }, { idsite: 2, group: 'Agences' }]);

    await import('./siteCards');
    await flush();

    const infos = document.querySelectorAll('.sitegroups-card-info');
    expect(infos).toHaveLength(1);
    expect(infos[0].closest('.card')!.getAttribute('idsite')).toBe('2');
    expect(infos[0].textContent).toBe('SiteGroups_Group: Agences');

    // rendering the group must not render it again (the page used to freeze in a loop)
    let mutations = 0;
    const observer = new MutationObserver((records) => { mutations += records.length; });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    await flush();
    observer.disconnect();

    expect(mutations).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reloads the groups when a card leaves edit mode', async () => {
    fetchMock.mockResolvedValueOnce([{ idsite: 1, group: '' }, { idsite: 2, group: 'Agences' }]);
    fetchMock.mockResolvedValueOnce([{ idsite: 1, group: 'Clients' }, { idsite: 2, group: 'Agences' }]);

    await import('./siteCards');
    await flush();

    const card = document.querySelector<HTMLElement>('.card[idsite="1"]')!;
    card.classList.add('editingSite');
    await flush();
    card.classList.remove('editingSite');
    await flush();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(card.querySelector('.sitegroups-card-info')!.textContent).toBe('SiteGroups_Group: Clients');
  });
});
