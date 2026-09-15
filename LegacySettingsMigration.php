<?php

/**
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

declare(strict_types=1);

namespace Piwik\Plugins\SiteGroups;

use Piwik\Common;
use Piwik\Db;
use Piwik\Site;

/**
 * Moves the groups saved by SiteGroups 5.x into the core `site.group` column.
 *
 * 5.x stored them as measurable settings (`siteGroup`, or `group` for the first releases). A group
 * already set in the core column wins, so a website grouped through the SitesManager API keeps it.
 * Safe to run several times: the legacy rows are deleted once migrated.
 */
class LegacySettingsMigration
{
    private const MAX_GROUP_LENGTH = 250;

    public static function run(): void
    {
        $settingTable = Common::prefixTable('site_setting');
        $siteTable = Common::prefixTable('site');

        $rows = Db::fetchAll(
            "SELECT idsite, setting_name, setting_value FROM `$settingTable`
             WHERE plugin_name = ? AND setting_name IN (?, ?)",
            ['SiteGroups', 'siteGroup', 'group']
        );

        if (empty($rows)) {
            return;
        }

        $groupByIdSite = [];
        foreach ($rows as $row) {
            $idSite = (int) $row['idsite'];
            $group = mb_substr(trim((string) $row['setting_value']), 0, self::MAX_GROUP_LENGTH);

            // the `siteGroup` setting replaced `group`, prefer it when both were saved
            if ($group !== '' && ($row['setting_name'] === 'siteGroup' || !isset($groupByIdSite[$idSite]))) {
                $groupByIdSite[$idSite] = $group;
            }
        }

        foreach ($groupByIdSite as $idSite => $group) {
            Db::query("UPDATE `$siteTable` SET `group` = ? WHERE idsite = ? AND `group` = ''", [$group, $idSite]);
        }

        Db::query(
            "DELETE FROM `$settingTable` WHERE plugin_name = ? AND setting_name IN (?, ?)",
            ['SiteGroups', 'siteGroup', 'group']
        );

        Site::clearCache();
    }
}
