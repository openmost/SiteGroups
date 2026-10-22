<?php
/**
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

namespace Piwik\Plugins\SiteGroups;

class SiteGroups extends \Piwik\Plugin
{
    public function registerEvents()
    {
        return [
            'Template.afterEventsReport' => 'renderOpenmostCommunicationAfterEvents',
            'Widget.filterWidgets' => 'addOpenmostCommunicationWidgets',
            'Template.beforeContent' => 'renderOpenmostCommunication',
            'Site.setSites'                   => 'injectSiteGroup',
            'AssetManager.getJavaScriptFiles' => 'getJsFiles',
            'AssetManager.getStylesheetFiles' => 'getStylesheetFiles',
            'Translate.getClientSideTranslationKeys' => 'getClientSideTranslationKeys',
        ];
    }

    public function activate()
    {
        // an install reactivating the plugin may still hold the groups saved by SiteGroups 5.1 and older
        LegacySettingsMigration::run();
    }

    /**
     * Keeps the `site_group` property of the SitesManager API responses that SiteGroups 5.1 and
     * older added, now a copy of the core `group` property where the groups are stored.
     *
     * @deprecated read the core `group` property, `site_group` is no longer returned by SiteGroups 6.x
     */
    public function injectSiteGroup(&$sites)
    {
        if (empty($sites) || !is_array($sites)) {
            return;
        }

        foreach ($sites as &$site) {
            if (is_array($site)) {
                $site['site_group'] = trim((string) ($site['group'] ?? ''));
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

    public function getClientSideTranslationKeys(&$translationKeys)
    {
        $translationKeys[] = 'SiteGroups_Group';
        $translationKeys[] = 'SiteGroups_Ungrouped';
        $translationKeys[] = 'SiteGroups_ToggleGroup';
    }

    public function renderOpenmostCommunication(&$out, $layout, $module = '', $action = '')
    {
        OpenmostCommunication::beforeContent($out, (string) $layout, (string) $module, (string) $action, $this->getPluginName());
    }

    public function addOpenmostCommunicationWidgets($list)
    {
        OpenmostCommunication::filterWidgets($list, $this->getPluginName());
    }

    public function renderOpenmostCommunicationAfterEvents(&$out, $dataTable = null)
    {
        OpenmostCommunication::afterEventsReport($out, $this->getPluginName());
    }
}
