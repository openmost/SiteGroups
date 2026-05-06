<?php
/**
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

namespace Piwik\Plugins\SiteGroups;

use Piwik\Settings\Setting;
use Piwik\Settings\FieldConfig;

/**
 * Defines Settings for SiteGroups.
 *
 * The value is persisted automatically by Matomo in the `site_setting` table
 * under plugin_name='SiteGroups', setting_name='siteGroup'. We deliberately
 * use a name different from `group` so we never touch the core `site.group`
 * column and avoid collision with core measurable handling.
 */
class MeasurableSettings extends \Piwik\Settings\Measurable\MeasurableSettings
{
    /** @var Setting|null */
    public $siteGroup;

    protected function init()
    {
        $this->siteGroup = $this->makeSiteGroupSetting();
    }

    /**
     * @throws \Exception
     */
    private function makeSiteGroupSetting()
    {
        return $this->makeSetting('siteGroup', '', FieldConfig::TYPE_STRING, function (FieldConfig $field) {
            $field->title = 'Group';
            $field->uiControl = FieldConfig::UI_CONTROL_TEXT;
            $field->description = 'Will be used to group this site under an optgroup in the site selector';
        });
    }
}
