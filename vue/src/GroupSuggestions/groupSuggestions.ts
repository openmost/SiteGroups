/*!
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

import { Matomo } from 'CoreHome';
import SiteGroupsStore from '../SiteGroupsStore/SiteGroupsStore';

// Suggests the existing groups in the website "Group" field, so a group is picked rather than
// typed again with a different spelling. The field points to this datalist (MeasurableSettings).

const DATALIST_ID = 'sitegroups-suggestions';

function fillDatalist() {
  SiteGroupsStore.load().then(() => {
    let datalist = document.getElementById(DATALIST_ID) as HTMLDataListElement | null;
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = DATALIST_ID;
      document.body.append(datalist);
    }

    datalist.replaceChildren(...SiteGroupsStore.groupNames.map((group) => {
      const option = document.createElement('option');
      option.value = Matomo.helper.htmlDecode(group);
      return option;
    }));
  });
}

document.addEventListener('focusin', (event) => {
  const target = event.target as HTMLElement | null;
  if (target instanceof HTMLInputElement && target.getAttribute('list') === DATALIST_ID) {
    fillDatalist();
  }
});
