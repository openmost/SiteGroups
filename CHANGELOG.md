## Changelog

## v6.0.1

- Plugin translated into 12 languages (Arabic, Chinese simplified and traditional, Dutch, English, French, German, Italian, Japanese, Polish, Portuguese, Spanish).
- Shorter Marketplace description that fits the plugin cards, and campaign parameters on the Openmost links of the README.

## v6.0.0

### Matomo 6

- Compatibility with Matomo 6.x (`>=6.0.0-b1,<7.0.0-b1`), requires PHP 8.1+ and MySQL 8.0+ (or MariaDB 10.6+).

### Improvements

- Groups are now stored in the Matomo website group (`site.group`), so the **All Websites dashboard** lists your websites by group, with totals per group, and the website selector search also finds websites by group name.
- Existing groups are migrated automatically when updating from 5.x.
- The website selector follows the Matomo 6 design: collapsible group headers with the number of websites, website id before each name, light and dark modes.
- The group of the current website is open by default, and the groups you open or close are remembered.
- The "Group" field suggests the existing groups, and a group typed with a different case joins the existing one ("clients" joins "Clients").
- The group is shown on the Websites > Manage cards and updated right after saving a website.
- Group headers are keyboard accessible buttons.
- English and French translations.

### Fixes

- The website selector was no longer grouped with the Matomo 6 selector.
- The "All websites" entry is no longer listed inside a group.

### Technical

- The JavaScript is replaced by a TypeScript library built with the Matomo Vite build (`vue/`).
- New API method `SiteGroups.getSiteGroups`, a light request replacing the full websites list the selector used to load on every page. Groups are only requested when the website selector is used.
- The `site_group` property is no longer added to the SitesManager API responses, use the core `group` property.
- PHP integration tests (storage, permissions, migration, API) and Vitest specs (website selector, website cards).

## v5.1.0

- Collapsible groups in the website selector, website id badges and group shown on the Websites > Manage cards

## v5.0.5

- update: marketplace cover

## v5.0.4

- update: marketplace category and cover

## v5.0.1

- Publishing plugin

## v5.0.0

- Plugin setup
