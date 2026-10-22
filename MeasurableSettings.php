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
use Piwik\Container\StaticContainer;
use Piwik\Db;
use Piwik\Piwik;
use Piwik\Plugins\SiteGroups\Settings\SiteGroupBackend;
use Piwik\Settings\FieldConfig;
use Piwik\Settings\Setting;
use Piwik\Settings\Storage\Factory as StorageFactory;

/**
 * The website "Group" field, stored in the core `site.group` column (see SiteGroupBackend).
 *
 * Like any measurable setting it can be changed by the users having admin access on the website,
 * while the core only lets a super user change the group through SitesManager.
 */
class MeasurableSettings extends \Piwik\Settings\Measurable\MeasurableSettings
{
    public const MAX_GROUP_LENGTH = 250;

    /** @var Setting */
    public $siteGroup;

    protected function init()
    {
        $this->siteGroup = $this->makeSiteGroupSetting();
    }

    private function makeSiteGroupSetting(): Setting
    {
        $setting = $this->makeSetting(SiteGroupBackend::SETTING_NAME, '', FieldConfig::TYPE_STRING, function (FieldConfig $field) {
            $field->title = Piwik::translate('SiteGroups_Group');
            $field->description = Piwik::translate('SiteGroups_GroupDescription');
            $field->uiControl = FieldConfig::UI_CONTROL_TEXT;
            // suggestions filled by the SiteGroups Vue library
            $field->uiControlAttributes = [
                'list' => 'sitegroups-suggestions',
                'maxlength' => self::MAX_GROUP_LENGTH,
                'autocomplete' => 'off',
            ];
            $field->validate = function ($value) {
                if (mb_strlen(trim((string) $value)) > self::MAX_GROUP_LENGTH) {
                    throw new \Exception(Piwik::translate('SiteGroups_GroupTooLong', self::MAX_GROUP_LENGTH));
                }
            };
            $field->transform = function ($value) {
                return $this->getExistingSpelling(trim((string) $value));
            };
        });

        // a website being created has no row yet, it keeps the non persistent storage until saved
        if (!empty($this->idSite)) {
            $storageFactory = StaticContainer::get(StorageFactory::class);
            $setting->setStorage($storageFactory->makeStorage(new SiteGroupBackend($this->idSite)));
        }

        return $setting;
    }

    /**
     * Reuses the spelling of an existing group differing only by case ("clients" joins "Clients"),
     * as the All Websites dashboard groups websites by exact name.
     */
    private function getExistingSpelling(string $group): string
    {
        if ($group === '') {
            return '';
        }

        $idSites = array_diff(
            array_map('intval', Access::getInstance()->getSitesIdWithAtLeastViewAccess()),
            [(int) $this->idSite]
        );
        if (empty($idSites)) {
            return $group;
        }

        $table = Common::prefixTable('site');
        $existingGroups = Db::fetchAll(
            "SELECT DISTINCT `group` FROM `$table`
             WHERE idsite IN (" . implode(',', $idSites) . ") AND LOWER(`group`) = LOWER(?)
             ORDER BY `group`",
            [$group]
        );

        foreach ($existingGroups as $row) {
            if (mb_strtolower((string) $row['group']) === mb_strtolower($group)) {
                return (string) $row['group'];
            }
        }

        return $group;
    }
}
