<?php

/**
 * Matomo - free/libre analytics platform
 *
 * @link https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

declare(strict_types=1);

namespace Piwik\Plugins\SiteGroups\tests\Integration;

use Piwik\Common;
use Piwik\Db;
use Piwik\Plugin\Manager;
use Piwik\Plugins\SiteGroups\API;
use Piwik\Plugins\SiteGroups\LegacySettingsMigration;
use Piwik\Plugins\SiteGroups\MeasurableSettings;
use Piwik\Plugins\SitesManager\API as SitesManagerAPI;
use Piwik\Site;
use Piwik\Tests\Framework\Fixture;
use Piwik\Tests\Framework\Mock\FakeAccess;
use Piwik\Tests\Framework\TestCase\IntegrationTestCase;

/**
 * @group SiteGroups
 * @group Plugins
 */
class SiteGroupsTest extends IntegrationTestCase
{
    public function setUp(): void
    {
        parent::setUp();

        Manager::getInstance()->loadPluginTranslations();

        // the setters reset the super user flag, set it last
        FakeAccess::setIdSitesView([]);
        FakeAccess::setIdSitesAdmin([]);
        FakeAccess::$superUser = true;
        Fixture::createWebsite('2024-01-01 00:00:00', 0, 'Site 1');
        Fixture::createWebsite('2024-01-01 00:00:00', 0, 'Site 2');
        Fixture::createWebsite('2024-01-01 00:00:00', 0, 'Site 3');
    }

    public function testGroupIsStoredInTheCoreSiteGroupColumn(): void
    {
        $this->saveGroup(1, 'Clients');

        $this->assertSame('Clients', Site::getGroupFor(1));
        $this->assertSame('Clients', (new MeasurableSettings(1))->siteGroup->getValue());
        $this->assertSame([], $this->getLegacyRows());
    }

    public function testSiteAdminCanChangeTheGroupThroughSitesManager(): void
    {
        FakeAccess::$superUser = false;
        FakeAccess::setIdSitesAdmin([2]);

        SitesManagerAPI::getInstance()->updateSite(2, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, [
            'SiteGroups' => [['name' => 'siteGroup', 'value' => '  Brands  ']],
        ]);

        $this->assertSame('Brands', Site::getGroupFor(2));
    }

    public function testUserWithViewAccessCannotChangeTheGroup(): void
    {
        FakeAccess::$superUser = false;
        FakeAccess::setIdSitesView([1]);

        try {
            $this->saveGroup(1, 'Clients');
            $this->fail('A user with view access must not change the group');
        } catch (\Exception $e) {
            $this->assertStringNotContainsString('must not change', $e->getMessage());
        }

        $this->assertSame('', Site::getGroupFor(1));
    }

    public function testGroupDifferingOnlyByCaseReusesTheExistingSpelling(): void
    {
        $this->saveGroup(1, 'Clients');
        $this->saveGroup(2, 'clients');

        $this->assertSame('Clients', Site::getGroupFor(2));
    }

    public function testEmptyGroupRemovesTheWebsiteFromItsGroup(): void
    {
        $this->saveGroup(1, 'Clients');
        $this->saveGroup(1, '');

        $this->assertSame('', Site::getGroupFor(1));
    }

    public function testTooLongGroupIsRejected(): void
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('250');

        $this->saveGroup(1, str_repeat('a', 251));
    }

    public function testGetSiteGroupsOnlyReturnsViewableWebsites(): void
    {
        $this->saveGroup(1, 'Clients');
        $this->saveGroup(3, 'Brands');

        FakeAccess::$superUser = false;
        FakeAccess::setIdSitesView([1, 2]);
        FakeAccess::setIdSitesAdmin([]);

        $this->assertSame([
            ['idsite' => 1, 'group' => 'Clients'],
            ['idsite' => 2, 'group' => ''],
        ], API::getInstance()->getSiteGroups());
    }

    public function testLegacySettingsAreMigratedWithoutOverwritingCoreGroups(): void
    {
        SitesManagerAPI::getInstance()->updateSite(3, null, null, null, null, null, null, null, null, null, null, 'Core group');

        $table = Common::prefixTable('site_setting');
        foreach ([[1, 'group', 'Old'], [1, 'siteGroup', 'New'], [2, 'group', 'Legacy'], [3, 'siteGroup', 'Ignored']] as [$idSite, $name, $value]) {
            Db::query(
                "INSERT INTO `$table` (idsite, plugin_name, setting_name, setting_value, json_encoded) VALUES (?, 'SiteGroups', ?, ?, 0)",
                [$idSite, $name, $value]
            );
        }

        LegacySettingsMigration::run();
        LegacySettingsMigration::run();

        $this->assertSame('New', Site::getGroupFor(1));
        $this->assertSame('Legacy', Site::getGroupFor(2));
        $this->assertSame('Core group', Site::getGroupFor(3));
        $this->assertSame([], $this->getLegacyRows());
    }

    public function provideContainerConfig()
    {
        return [
            'Piwik\Access' => new FakeAccess(),
        ];
    }

    private function saveGroup(int $idSite, string $group): void
    {
        $settings = new MeasurableSettings($idSite);
        $settings->siteGroup->setValue($group);
        $settings->save();
    }

    private function getLegacyRows(): array
    {
        return Db::fetchAll(
            'SELECT * FROM `' . Common::prefixTable('site_setting') . "` WHERE plugin_name = 'SiteGroups'"
        );
    }
}
