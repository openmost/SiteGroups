<?php

/**
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

declare(strict_types=1);

namespace Piwik\Plugins\SiteGroups\Settings;

use Piwik\Plugins\SitesManager\Model as SitesModel;
use Piwik\Settings\Storage\Backend\BackendInterface;
use Piwik\Site;

/**
 * Stores the group setting in the core `site.group` column.
 *
 * The core SitesTable backend refuses to write `group`, and SitesManager only lets a super user
 * change it, so the plugin writes it itself. Who may change it is decided by the setting (admin
 * access on the website), this backend only persists the value.
 */
class SiteGroupBackend implements BackendInterface
{
    public const SETTING_NAME = 'siteGroup';

    private int $idSite;

    public function __construct(int $idSite)
    {
        $this->idSite = $idSite;
    }

    public function getStorageId()
    {
        return 'SiteGroups_SiteGroup_' . $this->idSite;
    }

    public function load()
    {
        $site = (new SitesModel())->getSiteFromId($this->idSite);

        return [self::SETTING_NAME => trim((string) ($site['group'] ?? ''))];
    }

    public function save($values)
    {
        if (!array_key_exists(self::SETTING_NAME, $values)) {
            return;
        }

        (new SitesModel())->updateSite(['group' => trim((string) $values[self::SETTING_NAME])], $this->idSite);
        Site::clearCacheForSite($this->idSite);
    }

    public function delete()
    {
        // the group belongs to the website, it is not removed with the plugin
    }
}
