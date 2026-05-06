<?php
/**
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

namespace Piwik\Plugins\SiteGroups;

use Piwik\Common;
use Piwik\Db;

class SiteGroups extends \Piwik\Plugin
{
    public function registerEvents()
    {
        return [
            'Site.setSites'                   => 'injectSiteGroup',
            'AssetManager.getJavaScriptFiles' => 'getJsFiles',
            'AssetManager.getStylesheetFiles' => 'getStylesheetFiles',
        ];
    }

    /**
     * Bulk-load the SiteGroups.siteGroup setting for every site in the array
     * and expose it on each site object as `site_group`. Runs once per
     * SitesManager API call, regardless of how many sites are returned.
     */
    public function injectSiteGroup(&$sites)
    {
        if (empty($sites) || !is_array($sites)) {
            return;
        }

        $idSites = [];
        foreach ($sites as $site) {
            if (isset($site['idsite'])) {
                $idSites[] = (int) $site['idsite'];
            }
        }

        if (empty($idSites)) {
            return;
        }

        $placeholders = implode(',', array_fill(0, count($idSites), '?'));
        $table        = Common::prefixTable('site_setting');
        $sql          = "SELECT idsite, setting_name, setting_value FROM `$table`
                         WHERE plugin_name = ? AND setting_name IN (?, ?)
                         AND idsite IN ($placeholders)";
        $bind         = array_merge(['SiteGroups', 'siteGroup', 'group'], $idSites);

        try {
            $rows = Db::fetchAll($sql, $bind);
        } catch (\Exception $e) {
            $rows = [];
        }

        // Prefer the new 'siteGroup' setting, otherwise fall back to the legacy
        // 'group' setting that older plugin versions wrote into the same table.
        $groupByIdSite = [];
        foreach ($rows as $row) {
            $idSite = (int) $row['idsite'];
            $name   = $row['setting_name'];
            $value  = (string) $row['setting_value'];
            if ($name === 'siteGroup' && $value !== '') {
                $groupByIdSite[$idSite] = $value;
            } elseif ($name === 'group' && $value !== '' && !isset($groupByIdSite[$idSite])) {
                $groupByIdSite[$idSite] = $value;
            }
        }

        foreach ($sites as &$site) {
            $idSite = isset($site['idsite']) ? (int) $site['idsite'] : 0;
            if (!empty($groupByIdSite[$idSite])) {
                $site['site_group'] = $groupByIdSite[$idSite];
            } elseif (!empty($site['group'])) {
                // Last-resort fallback: pre-existing data in the core site.group column.
                $site['site_group'] = (string) $site['group'];
            } else {
                $site['site_group'] = '';
            }
        }
    }

    public function getJsFiles(&$jsFiles)
    {
        $jsFiles[] = 'plugins/SiteGroups/javascripts/sitegroups.js';
    }

    public function getStylesheetFiles(&$stylesheets)
    {
        $stylesheets[] = 'plugins/SiteGroups/stylesheets/sitegroups.less';
    }
}
