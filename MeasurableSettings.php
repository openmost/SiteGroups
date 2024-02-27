<?php
/**
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

namespace Piwik\Plugins\SiteGroups;

use Piwik\Plugins\MobileAppMeasurable\Type as MobileAppType;
use Piwik\Plugins\SitesManager\API;
use Piwik\Settings\Setting;
use Piwik\Settings\FieldConfig;

/**
 * Defines Settings for SiteGroups.
 *
 * Usage like this:
 * // require Piwik\Plugin\SettingsProvider via Dependency Injection eg in constructor of your class
 * $settings = $settingsProvider->getMeasurableSettings('SiteGroups', $idSite);
 * $settings->appId->getValue();
 * $settings->contactEmails->getValue();
 */
class MeasurableSettings extends \Piwik\Settings\Measurable\MeasurableSettings
{
    /** @var Setting|null */
    public $group;


    protected function init()
    {
        $this->group = $this->makeGroupSetting();
    }

    /**
     * @throws \Exception
     */
    private function makeGroupSetting()
    {
        $type = FieldConfig::TYPE_STRING;

        return $this->makeSetting('group', '', $type, function (FieldConfig $field) {
            $field->title = 'Group';
            $field->uiControl = FieldConfig::UI_CONTROL_TEXT;
            $field->description = 'Will be displayed in the measurable selector';
        });
    }
}
