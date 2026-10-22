## Changelog

### v5.2.0

- Fix: the `group` parameter of `SitesManager.addSite` and `SitesManager.updateSite` is now taken into account ([#1](https://github.com/openmost/SiteGroups/issues/1)).
- Groups are now stored in the Matomo website group (`site.group`), like SiteGroups 6.x, so the **All Websites dashboard** lists your websites by group, with totals per group, and the website selector search also finds websites by group name.
- Existing groups are migrated automatically during the update.
- The "Group" field suggests the existing groups, and a group typed with a different case joins the existing one ("clients" joins "Clients").
- Any user with admin access on a website can change its group, groups longer than 250 characters are rejected.
- The group is updated on the *Websites > Manage* card right after saving a website.
- New API method `SiteGroups.getSiteGroups`, a light request replacing the full websites list the selector used to load.
- The `site_group` property of the SitesManager API responses is deprecated, use the core `group` property.
- Translated group labels in the website selector and on the website cards.
- PHP integration tests (storage, permissions, migration, API).
- Requires Matomo 5.0.0 or later (`>=5.0.0,<6.0.0-b1`).

### v5.1.2

- Fix: the site groups styles no longer remove the padding of the period selector and the other Matomo dropdowns, they only apply to the site selector.

### v5.1.1

- Request parameters are read with `Piwik\Request` instead of the deprecated `Common::getRequestVar`, ready for the next Matomo versions.

### v5.1.0

- Collapsible groups in the website selector: websites sorted by group then by name, "Ungrouped" listed last, groups start collapsed with 10 websites or more, all groups open while searching.
- Website id shown before each website name in the selector, group shown on the *Websites > Manage* cards.
- Groups typed with a different case are listed together.
- Plugin translated into 12 languages (Arabic, Chinese simplified and traditional, Dutch, English, French, German, Italian, Japanese, Polish, Portuguese, Spanish).
- Plugin homepage moved to https://openmost.com/matomo/extensions/site-groups.
- Shorter Marketplace description that fits the plugin cards, and campaign parameters on the Openmost links of the README.
- Requires Matomo 5.0.0 or later (`>=5.0.0,<6.0.0-b1`).
- README: the plugin description now shows in the Description tab of the Matomo Marketplace.

### v5.0.5

update: marketplace cover

### v5.0.4

update: marketplace category and cover

### v5.0.1

Publishing plugin

### v5.0.0

Plugin setup
