<?php

/**
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

declare(strict_types=1);

namespace Piwik\Plugins\SiteGroups;

use Piwik\Access;
use Piwik\Common;
use Piwik\Db;
use Piwik\Piwik;

/**
 * API for plugin SiteGroups.
 *
 * Groups are stored in the core `site.group` column, the same one the All Websites dashboard
 * and the website search rely on.
 *
 * @method static \Piwik\Plugins\SiteGroups\API getInstance()
 */
class API extends \Piwik\Plugin\API
{
    /**
     * Returns the group of every website the current user can view.
     *
     * Lighter than `SitesManager.getSitesWithMinimumAccess`, it only reads two columns, which is
     * what the website selector needs to group the websites it lists.
     *
     * @return list<array{idsite: int, group: string}> An empty group means the website is ungrouped.
     */
    public function getSiteGroups(): array
    {
        Piwik::checkUserHasSomeViewAccess();

        $idSites = array_map('intval', Access::getInstance()->getSitesIdWithAtLeastViewAccess());
        if (empty($idSites)) {
            return [];
        }

        $table = Common::prefixTable('site');
        $rows = Db::fetchAll(
            "SELECT idsite, `group` FROM `$table` WHERE idsite IN (" . implode(',', $idSites) . ') ORDER BY idsite'
        );

        return array_map(static fn(array $row): array => [
            'idsite' => (int) $row['idsite'],
            'group' => trim((string) $row['group']),
        ], $rows);
    }
}
