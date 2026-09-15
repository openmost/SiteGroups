## Documentation

SiteGroups organizes your websites into groups, and lists them by group in the website selector and in the All Websites dashboard.

### Set the group of a website

1. Go to *Administration > Websites > Manage*.
2. Edit a website and fill in the **Group** field. Existing groups are suggested while typing, pick one or type a new group name.
3. Save. Leave the field empty to remove the website from its group.

Any user with admin access on a website can change its group. A group typed with a different case joins the existing group, for example "clients" is saved as "Clients" when this group already exists.

The group is also shown on the website card of the *Websites > Manage* page.

### Website selector

As soon as one website has a group, the website selector lists your websites under group headers:

- groups are sorted by name, websites without a group are listed last under "Ungrouped",
- each header shows the number of websites of the group, click it (or press Enter) to open or close the group,
- the website id is displayed before each website name,
- with 10 websites or more, groups start collapsed except the group of the current website. The groups you open or close are remembered in your browser,
- while searching, all groups are open. The search also matches group names.

### All Websites dashboard

The groups are the Matomo website groups, so the All Websites dashboard lists your websites by group, with the totals of each group.

### API

`SiteGroups.getSiteGroups` returns the group of every website the current user can view:

```
?module=API&method=SiteGroups.getSiteGroups&format=JSON&token_auth=...
```

```json
[{"idsite": 1, "group": "Clients"}, {"idsite": 2, "group": ""}]
```

The group is also available in the `group` property of the SitesManager API responses, for example `SitesManager.getSitesWithAtLeastViewAccess`.

### Updating from SiteGroups 5.x

The groups saved with SiteGroups 5.x are moved automatically to the Matomo website groups during the update. A website that already had a Matomo group keeps it.
