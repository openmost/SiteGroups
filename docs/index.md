## Documentation

SiteGroups organizes your websites into groups, and lists them by group in the website selector.

### Set the group of a website

1. Go to *Administration > Websites > Manage*.
2. Edit a website and fill in the **Group** field.
3. Save. Leave the field empty to remove the website from its group.

Groups typed with a different case are listed together, for example "clients" and "Clients". The group is also shown on the website card of the *Websites > Manage* page.

### Website selector

As soon as one website has a group, the website selector lists your websites under group headers:

- groups are sorted by name, websites without a group are listed last under "Ungrouped",
- click a header (or press Enter or Space) to open or close the group,
- the website id is displayed before each website name,
- with 10 websites or more, groups start collapsed,
- while searching, all groups are open.

### Updating to Matomo 6

SiteGroups 6.x stores the groups as native Matomo website groups. The groups saved with SiteGroups 5.x are moved automatically during the update, and the All Websites dashboard then lists your websites by group.
