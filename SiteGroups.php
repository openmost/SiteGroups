<?php
/**
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

namespace Piwik\Plugins\SiteGroups;

use Piwik\Measurable\Measurable;
use Piwik\Plugins\SitesManager\API;
use Piwik\Plugins\SitesManager\API as SiteManager;
use Piwik\Plugins\SitesManager\Model;

class SiteGroups extends \Piwik\Plugin
{
    public function registerEvents()
    {
        return [
            'MeasurableSettings.updated' => 'updateSiteGroup',
        ];
    }

    public function updateSiteGroup(&$args, $idSite)
    {
        if ($args->getPluginName() === 'SiteGroups') {
            $settings = new \Piwik\Plugins\SiteGroups\MeasurableSettings($idSite);
            $group = $settings->group->getValue();

            $model = new Model();
            $model->updateSite(array('group' => $group), $idSite);
        }

        return true;
    }
}
