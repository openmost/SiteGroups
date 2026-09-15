/*!
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

import { AjaxHelper } from 'CoreHome';

export interface SiteGroup {
  idsite: number;
  group: string;
}

// Group of each website the user can view, keyed by idsite. Values are kept as stored (HTML
// encoded by the API input sanitizing), which is what the core site selector prefixes names with.
export type SiteGroupsMap = ReadonlyMap<string, string>;

class SiteGroupsStore {
  private groups: Map<string, string> | null = null;

  private request: Promise<SiteGroupsMap> | null = null;

  load(): Promise<SiteGroupsMap> {
    if (this.groups) {
      return Promise.resolve(this.groups);
    }

    if (!this.request) {
      this.request = AjaxHelper.fetch<SiteGroup[]>({
        method: 'SiteGroups.getSiteGroups',
        filter_limit: '-1',
      }).then((response) => {
        const groups = new Map<string, string>();
        (Array.isArray(response) ? response : []).forEach((site) => {
          groups.set(`${site.idsite}`, site.group || '');
        });
        this.groups = groups;
        return groups;
      }).catch(() => {
        // the selector keeps working ungrouped, retry on the next load
        this.request = null;
        return new Map<string, string>();
      });
    }

    return this.request;
  }

  reload(): Promise<SiteGroupsMap> {
    this.groups = null;
    this.request = null;
    return this.load();
  }

  get isLoaded(): boolean {
    return this.groups !== null;
  }

  get siteCount(): number {
    return this.groups ? this.groups.size : 0;
  }

  // distinct group names, the first spelling found wins for names differing only by case
  get groupNames(): string[] {
    const names = new Map<string, string>();
    (this.groups || new Map<string, string>()).forEach((group) => {
      const key = group.toLocaleLowerCase();
      if (group && !names.has(key)) {
        names.set(key, group);
      }
    });

    return [...names.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }
}

export default new SiteGroupsStore();
