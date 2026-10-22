<?php

/**
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

namespace Piwik\Plugins\SiteGroups;

use Piwik\Updater;
use Piwik\Updates as PiwikUpdates;

/**
 * 5.2.0: groups move from the plugin measurable settings to the core `site.group` column.
 */
class Updates_5_2_0 extends PiwikUpdates
{
    public function doUpdate(Updater $updater)
    {
        LegacySettingsMigration::run();
    }
}
