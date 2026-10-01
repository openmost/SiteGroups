# SiteGroups

Organize your websites into groups, and browse them by group in the website selector.

## Features

- **Group field on every website**: set the group in *Administration > Websites > Manage*. Groups typed with a different case are listed together.
- **Grouped website selector**: websites are listed under collapsible group headers, sorted by group then by name, with the website id before each name. Websites without a group are listed last under "Ungrouped".
- **Smart defaults**: with 10 websites or more, groups start collapsed. While searching, all groups are open.
- **Website cards**: the group is shown on the *Websites > Manage* cards.
- Keyboard accessible group headers.

## Requirements

- Matomo 5.10.0 or later (`>=5.10.0,<6.0.0-b1`)

## Installation / Configuration

1. Install and activate the plugin from *Administration > Platform > Marketplace*.
2. Edit a website in *Administration > Websites > Manage* and fill in the **Group** field. Leave it empty to remove the website from its group.

When you update to Matomo 6 and SiteGroups 6.x, the groups are moved automatically to the native Matomo website groups, and the All Websites dashboard lists your websites by group. See [docs/index.md](docs/index.md).

## Need help with Matomo?

Openmost is an official Matomo Implementation Partner. For instances with many websites, we build [custom Matomo dashboards and KPI reports](https://openmost.com/matomo/services/dashboard-build?utm_source=matomo_marketplace&utm_medium=referral&utm_campaign=services&utm_content=sitegroups) that give each team the view it needs, including aggregated reporting across sites.

## Support

- Homepage: https://openmost.com/matomo/extensions/site-groups
- Issues: https://github.com/openmost/SiteGroups/issues
- Email: ronan@openmost.com

## Screenshots

See the `screenshots/` folder, or the plugin page on the Matomo Marketplace.
