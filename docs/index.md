## Documentation

SiteGroups organizes your websites into groups, and lists them by group in the website selector and in the All Websites dashboard.

### Set the group of a website

1. Go to *Administration > Websites > Manage*.
2. Edit a website and fill in the **Group** field.
3. Save. Leave the field empty to remove the website from its group.

Existing groups are suggested while typing, and a group typed with a different case joins the existing one, for example "clients" joins "Clients". The group is also shown on the website card of the *Websites > Manage* page.

Groups are stored as native Matomo website groups (the `group` of the website), so the `group` parameter of `SitesManager.addSite` and `SitesManager.updateSite` also sets them:

```
curl -X POST "https://matomo.example.com/index.php" \n  -d "module=API&method=SitesManager.addSite&format=json" \n  -d "siteName=My website&group=Clients&token_auth=YOUR_TOKEN"
```

`SiteGroups.getSiteGroups` returns the group of every website the current user can view.

### Website selector

As soon as one website has a group, the website selector lists your websites under group headers:

- groups are sorted by name, websites without a group are listed last under "Ungrouped",
- click a header (or press Enter or Space) to open or close the group,
- the website id is displayed before each website name,
- with 10 websites or more, groups start collapsed,
- while searching, all groups are open and the search also matches group names.

### Updating to Matomo 6

SiteGroups 6.x stores the groups the same way, nothing changes for your groups. Coming from SiteGroups 5.1 or older? Your groups are moved automatically during the update.
