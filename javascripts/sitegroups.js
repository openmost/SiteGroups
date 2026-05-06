/**
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 *
 * Reorganizes the site selector dropdown so sites are grouped under
 * collapsible headers, sorted alphabetically by group then by name.
 *
 * IMPORTANT: Vue's <li v-for :key="index"> patches by element identity,
 * not DOM position. Anything that REORDERS Vue's <li> nodes inside the
 * <ul> creates a window where the rendered list looks wrong (search
 * doesn't seem to filter, clearing the search doesn't bring the list
 * back). To stay out of Vue's way:
 *
 *   - We never move Vue's <li> nodes in the DOM.
 *   - We never insert <li>s between Vue's <li>s — that would shift their
 *     positions and force Vue to fight us with insertBefore.
 *   - The <ul> is set to `display: flex; flex-direction: column` and we
 *     control visual order via the `order` CSS property on each <li>.
 *   - Group headers are real <li>s we append to the <ul>; Vue ignores
 *     them because they are not in its vnode tree.
 *   - When Vue patches the list (search, clear, refresh), its mutations
 *     trigger our MutationObserver and we re-run decorate() to reassign
 *     orders and refresh the header set. No DOM reshuffle, no flash.
 */
(function () {
    'use strict';

    var UNGROUPED_KEY    = '__sitegroups_ungrouped__';
    var UNGROUPED_LABEL  = 'Ungrouped';
    var HEADER_CLASS     = 'sitegroup-header';
    // Above this threshold, groups start collapsed by default. Counted
    // against total accessible sites (groupCache), not what Vue currently
    // shows — Vue caps initial loads at autocomplete page size.
    var COLLAPSE_DEFAULT_THRESHOLD = 10;

    var groupCache       = null;
    var groupPromise     = null;
    var refreshAttempted = {};

    function buildMap(sites) {
        var map = {};
        if (Array.isArray(sites)) {
            for (var i = 0; i < sites.length; i++) {
                var site = sites[i];
                if (site && typeof site.idsite !== 'undefined') {
                    map[String(site.idsite)] = (site.site_group || '').toString();
                }
            }
        }
        return map;
    }

    function callApi() {
        var coreHome = window.CoreHome;
        if (coreHome && coreHome.AjaxHelper && typeof coreHome.AjaxHelper.fetch === 'function') {
            return coreHome.AjaxHelper.fetch({
                method:     'SitesManager.getSitesWithMinimumAccess',
                permission: 'view',
                limit:      10000
            });
        }
        return fetch(
            '?module=API&method=SitesManager.getSitesWithMinimumAccess'
            + '&permission=view&limit=10000&format=JSON',
            { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } }
        ).then(function (r) { return r.json(); });
    }

    function fetchGroupMap() {
        if (groupCache) {
            return Promise.resolve(groupCache);
        }
        if (groupPromise) {
            return groupPromise;
        }
        groupPromise = callApi().then(function (sites) {
            groupCache = buildMap(sites);
            return groupCache;
        }, function () {
            groupCache = {};
            return groupCache;
        });
        return groupPromise;
    }

    function refreshGroupMap() {
        groupCache   = null;
        groupPromise = null;
        return fetchGroupMap();
    }

    function totalAccessibleSites() {
        return groupCache ? Object.keys(groupCache).length : 0;
    }

    function extractIdSiteFromHref(href) {
        if (!href) { return null; }
        var match = href.match(/[?&#]idSite=(\d+)/i);
        return match ? match[1] : null;
    }

    function compareStrings(a, b) {
        a = (a || '').toLowerCase();
        b = (b || '').toLowerCase();
        if (a < b) { return -1; }
        if (a > b) { return  1; }
        return 0;
    }

    function isHeader(el) {
        return el && el.getAttribute && el.getAttribute('data-sitegroup-header') === '1';
    }

    function getDropdown(ul) {
        return ul && ul.closest ? ul.closest('.dropdown') : null;
    }

    function getSearchInput(ul) {
        var dd = getDropdown(ul);
        return dd ? dd.querySelector('.custom_select_search input') : null;
    }

    function isSearchActive(ul) {
        var input = getSearchInput(ul);
        return !!(input && input.value && input.value.trim());
    }

    function buildHeader(label, groupKey) {
        var li = document.createElement('li');
        li.className = HEADER_CLASS;
        li.setAttribute('data-sitegroup-header', '1');
        li.setAttribute('data-sitegroup-key', groupKey);
        li.setAttribute('role', 'button');
        li.setAttribute('tabindex', '4');

        var caret = document.createElement('span');
        caret.className = 'sitegroup-header-caret';
        caret.setAttribute('aria-hidden', 'true');

        var labelSpan = document.createElement('span');
        labelSpan.className = 'sitegroup-header-label';
        labelSpan.textContent = label;

        var countSpan = document.createElement('span');
        countSpan.className = 'sitegroup-header-count';

        li.appendChild(caret);
        li.appendChild(labelSpan);
        li.appendChild(countSpan);

        var onActivate = function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (typeof event.stopImmediatePropagation === 'function') {
                event.stopImmediatePropagation();
            }
            var parentUl = li.parentElement;
            if (!parentUl) { return; }
            if (!parentUl.__userPrefs) {
                parentUl.__userPrefs = {};
            }
            var currentlyCollapsed = li.hasAttribute('data-collapsed');
            // Store true=expanded, false=collapsed.
            parentUl.__userPrefs[groupKey] = currentlyCollapsed;
            if (typeof parentUl.__sitegroupsApply === 'function') {
                parentUl.__sitegroupsApply();
            }
        };
        li.addEventListener('click', onActivate);
        li.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                onActivate(event);
            }
        });

        return li;
    }

    /**
     * Decorate the <ul> in place, without ever moving Vue's <li> nodes:
     *   - Stamp each Vue <li> with data-sitegroup-id, data-sitegroup-key.
     *   - Assign style.order so that visually <li>s are sorted by group
     *     then by name (flexbox column).
     *   - Maintain one header <li> per visible group, also positioned by
     *     style.order. Headers are extra DOM siblings that Vue's vnode
     *     tree ignores.
     *   - Apply collapse attributes; CSS hides collapsed rows.
     *
     * Re-runs idempotently every time Vue mutates the list — no DOM
     * reshuffle of Vue-owned elements, so search filtering and clearing
     * stay perfectly in sync with Vue's reactive updates.
     */
    function decorate(ul, groupMap) {
        ul.classList.add('sitegroup-flex-host');

        var children = Array.prototype.slice.call(ul.children);
        var items    = [];
        var existingHeaders = {};

        for (var i = 0; i < children.length; i++) {
            var li = children[i];
            if (isHeader(li)) {
                var hKey = li.getAttribute('data-sitegroup-key');
                if (hKey && !(hKey in existingHeaders)) {
                    existingHeaders[hKey] = li;
                } else {
                    // Duplicate or keyless header — drop it.
                    ul.removeChild(li);
                }
                continue;
            }

            var anchor = li.querySelector ? li.querySelector('a[href]') : null;
            var idSite = anchor ? extractIdSiteFromHref(anchor.getAttribute('href')) : null;
            if (idSite === null) {
                // Not a site row (e.g. "no result"). Leave it alone with
                // no order so it falls back to default flow.
                li.style.order = '';
                continue;
            }

            var group      = groupMap[idSite] || '';
            var groupKey   = group ? group.toLowerCase() : UNGROUPED_KEY;
            var groupLabel = group || UNGROUPED_LABEL;

            li.setAttribute('data-sitegroup-id', idSite);
            li.setAttribute('data-sitegroup-key', groupKey);

            items.push({
                li:         li,
                groupKey:   groupKey,
                groupLabel: groupLabel,
                name:       (anchor.textContent || '').trim()
            });
        }

        // Sort items: group asc (Ungrouped pinned last), then name asc.
        items.sort(function (a, b) {
            var byGroup = compareStrings(
                a.groupKey === UNGROUPED_KEY ? '￿' : a.groupKey,
                b.groupKey === UNGROUPED_KEY ? '￿' : b.groupKey
            );
            if (byGroup !== 0) { return byGroup; }
            return compareStrings(a.name, b.name);
        });

        // Bucket by group, preserving sort order.
        var groups   = [];
        var groupIdx = {};
        for (var k = 0; k < items.length; k++) {
            var key = items[k].groupKey;
            if (!(key in groupIdx)) {
                groupIdx[key] = groups.length;
                groups.push({
                    key:    key,
                    label:  items[k].groupLabel,
                    items:  []
                });
            }
            groups[groupIdx[key]].items.push(items[k]);
        }

        var searchActive     = isSearchActive(ul);
        var totalSites       = totalAccessibleSites();
        var defaultCollapsed = !searchActive && totalSites >= COLLAPSE_DEFAULT_THRESHOLD;
        if (!ul.__userPrefs) { ul.__userPrefs = {}; }

        // Walk groups in display order, assigning a contiguous order range
        // so each header sits just above its rows.
        var orderCounter = 1;
        var seenKeys     = {};

        for (var g = 0; g < groups.length; g++) {
            var grp  = groups[g];
            seenKeys[grp.key] = true;

            var pref = ul.__userPrefs[grp.key];
            var collapsed;
            if (searchActive) {
                collapsed = false;
            } else if (typeof pref !== 'undefined') {
                collapsed = !pref;
            } else {
                collapsed = defaultCollapsed;
            }

            var header = existingHeaders[grp.key];
            if (!header) {
                header = buildHeader(grp.label, grp.key);
                ul.appendChild(header);
            } else {
                // Refresh label in case the canonical casing changed.
                var labelEl = header.querySelector('.sitegroup-header-label');
                if (labelEl && labelEl.textContent !== grp.label) {
                    labelEl.textContent = grp.label;
                }
            }
            var countEl = header.querySelector('.sitegroup-header-count');
            if (countEl) {
                countEl.textContent = String(grp.items.length);
            }
            if (collapsed) {
                header.setAttribute('data-collapsed', '1');
            } else {
                header.removeAttribute('data-collapsed');
            }
            header.style.order = String(orderCounter++);
            delete existingHeaders[grp.key]; // mark as kept

            for (var m = 0; m < grp.items.length; m++) {
                var node = grp.items[m].li;
                node.style.order = String(orderCounter++);
                if (collapsed) {
                    node.setAttribute('data-sitegroup-hidden', '1');
                } else {
                    node.removeAttribute('data-sitegroup-hidden');
                }
            }
        }

        // Drop headers for groups that no longer have any rows.
        for (var leftover in existingHeaders) {
            if (Object.prototype.hasOwnProperty.call(existingHeaders, leftover)) {
                var stale = existingHeaders[leftover];
                if (stale.parentNode === ul) {
                    ul.removeChild(stale);
                }
            }
        }

        return true;
    }

    function enhance(ul) {
        if (!ul || ul.__sitegroupsObserved) { return; }
        ul.__sitegroupsObserved = true;

        var isUpdating = false;

        var apply = function () {
            if (isUpdating) { return; }
            fetchGroupMap().then(function (map) {
                isUpdating = true;
                try {
                    decorate(ul, map);
                } finally {
                    setTimeout(function () { isUpdating = false; }, 0);
                }
            });
        };
        ul.__sitegroupsApply = apply;

        var observer = new MutationObserver(function () {
            if (isUpdating) { return; }
            apply();
        });
        // childList: Vue inserts/removes <li>s on search/clear.
        // attributes(href, style): Vue patches the <a> href and toggles
        // <li> v-show via inline style. Either signals a re-decoration.
        observer.observe(ul, {
            childList:       true,
            subtree:         true,
            attributes:      true,
            attributeFilter: ['href', 'style']
        });

        apply();
    }

    function scanSelectors(root) {
        var lists = (root || document).querySelectorAll('.siteSelector .custom_select_ul_list');
        for (var i = 0; i < lists.length; i++) {
            enhance(lists[i]);
        }
    }

    function decorateCard(card, groupMap) {
        if (!card || card.__sitegroupsDecorated) {
            return false;
        }
        var idSite = card.getAttribute('idsite');
        if (!idSite) {
            return false;
        }
        var key = String(idSite);

        if (!Object.prototype.hasOwnProperty.call(groupMap, key)) {
            return 'unknown';
        }

        var group = groupMap[key];
        if (!group) {
            card.__sitegroupsDecorated = true;
            return false;
        }

        var firstUl = card.querySelector('.card-content .row .col ul');
        if (!firstUl) {
            return false;
        }
        if (firstUl.querySelector('.sitegroup-card-info')) {
            card.__sitegroupsDecorated = true;
            return true;
        }

        var li = document.createElement('li');
        li.className = 'sitegroup-card-info';

        var label = document.createElement('span');
        label.className = 'title';
        label.textContent = 'Group:';

        li.appendChild(label);
        li.appendChild(document.createTextNode(' ' + group));

        firstUl.appendChild(li);
        card.__sitegroupsDecorated = true;
        return true;
    }

    function collectCards(root) {
        var matched = [];
        if (!root || !root.querySelectorAll) {
            return matched;
        }
        var direct = root.querySelectorAll('.site.card[idsite]');
        for (var i = 0; i < direct.length; i++) {
            matched.push(direct[i]);
        }
        if (root.matches && root.matches('.site.card[idsite]')) {
            matched.push(root);
        }
        return matched;
    }

    function scanCards(root) {
        var cards = collectCards(root || document);
        if (!cards.length) {
            return;
        }
        fetchGroupMap().then(function (map) {
            var needsRefresh = false;
            for (var i = 0; i < cards.length; i++) {
                var result = decorateCard(cards[i], map);
                if (result === 'unknown') {
                    var id = cards[i].getAttribute('idsite');
                    if (id && !refreshAttempted[id]) {
                        refreshAttempted[id] = true;
                        needsRefresh = true;
                    }
                }
            }
            if (!needsRefresh) {
                return;
            }
            refreshGroupMap().then(function (freshMap) {
                for (var k = 0; k < cards.length; k++) {
                    decorateCard(cards[k], freshMap);
                }
            });
        });
    }

    function init() {
        if (!window.MutationObserver) {
            return;
        }

        scanSelectors(document);
        scanCards(document);

        var topObserver = new MutationObserver(function (mutations) {
            for (var i = 0; i < mutations.length; i++) {
                var added = mutations[i].addedNodes;
                for (var j = 0; j < added.length; j++) {
                    var n = added[j];
                    if (n.nodeType !== 1) { continue; }
                    if (n.matches && n.matches('.custom_select_ul_list')) {
                        enhance(n);
                    } else if (n.querySelectorAll) {
                        var nested = n.querySelectorAll('.siteSelector .custom_select_ul_list');
                        for (var k = 0; k < nested.length; k++) {
                            enhance(nested[k]);
                        }
                    }
                    if (collectCards(n).length) {
                        scanCards(n);
                    }
                }
            }
        });
        topObserver.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
