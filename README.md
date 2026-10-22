# SiteGroups

## Description

Organize your websites into groups, and browse them by group in the website selector and in the All Websites dashboard.

### Features

- **Group field on every website**: set the group in *Administration > Websites > Manage*. Existing groups are suggested while typing, and a group typed with a different case joins the existing one ("clients" joins "Clients").
- **Grouped website selector**: websites are listed under collapsible group headers, sorted by group then by name, with the website id before each name. Websites without a group are listed last under "Ungrouped".
- **Smart defaults**: with 10 websites or more, groups start collapsed. While searching, all groups are open and the search also matches group names.
- **All Websites dashboard by group**: groups are stored as native Matomo website groups, so the All Websites dashboard lists your websites by group, with totals per group.
- **SitesManager API**: the `group` parameter of `SitesManager.addSite` and `SitesManager.updateSite` sets the group shown by the plugin.
- **Website cards**: the group is shown on the *Websites > Manage* cards.
- **Permissions**: any user with admin access on a website can change its group.
- **API**: `SiteGroups.getSiteGroups` returns the group of every website the current user can view.
- Keyboard accessible group headers.

### Requirements

- Matomo 5.0.0 or later (`>=5.0.0,<6.0.0-b1`)

### Installation / Configuration

1. Install and activate the plugin from *Administration > Platform > Marketplace*.
2. Edit a website in *Administration > Websites > Manage* and fill in the **Group** field. Leave it empty to remove the website from its group.

Groups saved with SiteGroups 5.1 and older are moved automatically to the Matomo website groups during the update to 5.2. Groups are kept if the plugin is uninstalled, and when you update to Matomo 6 and SiteGroups 6.x. See [docs/index.md](docs/index.md).

### Need help with Matomo?

Openmost is an official Matomo Implementation Partner. For instances with many websites, we build [custom Matomo dashboards and KPI reports](https://openmost.com/matomo/services/dashboard-build?utm_source=matomo_marketplace&utm_medium=referral&utm_campaign=services&utm_content=sitegroups) that give each team the view it needs, including aggregated reporting across sites.

## Support

- Homepage: https://openmost.com/matomo/extensions/site-groups
- Issues: https://github.com/openmost/SiteGroups/issues
- Email: ronan@openmost.com

## Screenshots

See the `screenshots/` folder, or the plugin page on the Matomo Marketplace.
