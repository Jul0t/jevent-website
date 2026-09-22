(() => {
    "use strict";

    const API_URL =
        "https://api-beta.jevent.julot.fr";

    const TIMEZONE =
        "Europe/Paris";

    const EVENT_START_DATE =
        "2026-10-26";

    const EVENT_DATES = [
        "2026-10-26",
        "2026-10-27",
        "2026-10-28",
        "2026-10-29"
    ];

    const DAY_MINUTES =
        24 * 60;

    const PIXELS_PER_MINUTE =
        0.9;

    const elements = {
        navigationToggle:
            document.querySelector(
                "#navigationToggle"
            ),

        navigation:
            document.querySelector(
                "#mainNavigation"
            ),

        statusCard:
            document.querySelector(
                "#currentProgramStatus"
            ),

        statusLabel:
            document.querySelector(
                "#programStatusLabel"
            ),

        statusTitle:
            document.querySelector(
                "#programStatusTitle"
            ),

        statusTime:
            document.querySelector(
                "#programStatusTime"
            ),

        dayFilterList:
            document.querySelector(
                "#dayFilterList"
            ),

        creatorFilterList:
            document.querySelector(
                "#creatorFilterList"
            ),

        activeFilters:
            document.querySelector(
                "#activeFilters"
            ),

        resetFiltersButton:
            document.querySelector(
                "#resetFiltersButton"
            ),

        filterResultCount:
            document.querySelector(
                "#filterResultCount"
            ),

        loading:
            document.querySelector(
                "#programLoading"
            ),

        error:
            document.querySelector(
                "#programError"
            ),

        errorMessage:
            document.querySelector(
                "#programErrorMessage"
            ),

        retryButton:
            document.querySelector(
                "#retryProgramButton"
            ),

        content:
            document.querySelector(
                "#programContent"
            ),

        selectedDayEyebrow:
            document.querySelector(
                "#selectedDayEyebrow"
            ),

        selectedDayTitle:
            document.querySelector(
                "#selectedDayTitle"
            ),

        calendarContainer:
            document.querySelector(
                "#calendarContainer"
            ),

        calendarGrid:
            document.querySelector(
                "#calendarGrid"
            ),

        mobileList:
            document.querySelector(
                "#mobileProgramList"
            ),

        empty:
            document.querySelector(
                "#programEmpty"
            ),

        emptyResetButton:
            document.querySelector(
                "#emptyResetButton"
            ),

        dialog:
            document.querySelector(
                "#activityDialog"
            ),

        dialogEyebrow:
            document.querySelector(
                "#activityDialogEyebrow"
            ),

        dialogTitle:
            document.querySelector(
                "#activityDialogTitle"
            ),

        dialogContent:
            document.querySelector(
                "#activityDialogContent"
            ),

        closeDialog:
            document.querySelector(
                "#closeActivityDialog"
            ),

        creatorLink:
            document.querySelector(
                "#activityCreatorLink"
            ),

        externalLink:
            document.querySelector(
                "#activityExternalLink"
            )
    };

    let creators = [];
    let entries = [];
    let availableDates = [];

    let selectedDate =
        EVENT_START_DATE;

    let defaultDate =
        EVENT_START_DATE;

    const selectedCreatorSlugs =
        new Set();

    const localDateFormatter =
        new Intl.DateTimeFormat(
            "fr-FR",
            {
                timeZone: TIMEZONE,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23"
            }
        );

    /*
     * API
     */

    async function apiFetch(
        path,
        options = {}
    ) {
        const controller =
            new AbortController();

        const timeout =
            window.setTimeout(
                () => controller.abort(),
                12_000
            );

        try {
            const response =
                await fetch(
                    API_URL + path,
                    {
                        credentials: "include",

                        headers: {
                            Accept: "application/json",

                            ...(options.headers ?? {})
                        },

                        signal:
                            controller.signal,

                        ...options
                    }
                );

            let data = {};

            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                throw new Error(
                    data.error ??
                    data.message ??
                    `Erreur HTTP ${response.status}`
                );
            }

            return data;
        } finally {
            window.clearTimeout(timeout);
        }
    }

    /*
     * Outils
     */

    function createElement(
        tagName,
        className = "",
        text = ""
    ) {
        const element =
            document.createElement(tagName);

        if (className) {
            element.className =
                className;
        }

        if (text !== "") {
            element.textContent =
                text;
        }

        return element;
    }

    function validDate(value) {
        const date =
            value instanceof Date
                ? value
                : new Date(value);

        return Number.isNaN(
            date.getTime()
        )
            ? null
            : date;
    }

    function localParts(value) {
        const date =
            validDate(value);

        if (!date) {
            return null;
        }

        const values = {};

        for (
            const part of
            localDateFormatter.formatToParts(
                date
            )
        ) {
            if (part.type !== "literal") {
                values[part.type] =
                    part.value;
            }
        }

        return {
            date,

            dateKey:
                `${values.year}-` +
                `${values.month}-` +
                `${values.day}`,

            minute:
                Number(values.hour) * 60 +
                Number(values.minute)
        };
    }

    function addDays(
        dateKey,
        amount
    ) {
        const date =
            new Date(
                `${dateKey}T12:00:00Z`
            );

        date.setUTCDate(
            date.getUTCDate() + amount
        );

        return date
            .toISOString()
            .slice(0, 10);
    }

    function datesBetween(
        first,
        last
    ) {
        const result = [];

        let current = first;
        let safety = 0;

        while (
            current <= last &&
            safety < 40
        ) {
            result.push(current);

            current =
                addDays(current, 1);

            safety += 1;
        }

        return result;
    }

    function dateFromKey(dateKey) {
        return new Date(
            `${dateKey}T12:00:00Z`
        );
    }

    function formatClock(minutes) {
        if (minutes >= DAY_MINUTES) {
            return "24:00";
        }

        const hour =
            Math.floor(minutes / 60);

        const minute =
            minutes % 60;

        return (
            String(hour).padStart(2, "0") +
            ":" +
            String(minute).padStart(2, "0")
        );
    }

    function formatTime(value) {
        const date =
            validDate(value);

        if (!date) {
            return "—";
        }

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23",
                timeZone: TIMEZONE
            }
        ).format(date);
    }

    function formatFullDate(value) {
        const date =
            typeof value === "string" &&
                /^\d{4}-\d{2}-\d{2}$/.test(value)
                ? dateFromKey(value)
                : validDate(value);

        if (!date) {
            return "Date inconnue";
        }

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone:
                    typeof value === "string"
                        ? "UTC"
                        : TIMEZONE
            }
        ).format(date);
    }

    function formatWeekday(
        dateKey
    ) {
        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                weekday: "long",
                timeZone: "UTC"
            }
        ).format(
            dateFromKey(dateKey)
        );
    }

    function formatDayNumber(
        dateKey
    ) {
        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                day: "2-digit",
                timeZone: "UTC"
            }
        ).format(
            dateFromKey(dateKey)
        );
    }

    function formatMonth(
        dateKey
    ) {
        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                month: "short",
                timeZone: "UTC"
            }
        )
            .format(dateFromKey(dateKey))
            .replace(".", "");
    }

    function formatMoney(
        cents,
        currency = "EUR"
    ) {
        return new Intl.NumberFormat(
            "fr-FR",
            {
                style: "currency",
                currency
            }
        ).format(
            Number(cents ?? 0) / 100
        );
    }

    function creatorName(creator) {
        return (
            creator?.twitchDisplayName ??
            creator?.displayName ??
            creator?.creatorName ??
            creator?.name ??
            creator?.twitchLogin ??
            creator?.slug ??
            "Créateur JEvent"
        );
    }

    function creatorSlug(creator) {
        return String(
            creator?.slug ??
            creator?.creatorSlug ??
            creator?.twitchLogin ??
            ""
        )
            .trim()
            .toLowerCase();
    }

    function creatorAvatar(creator) {
        return (
            creator?.twitchProfileImageUrl ??
            creator?.profileImageUrl ??
            creator?.avatarUrl ??
            "/assets/jevent_logo.png"
        );
    }

    function creatorPageUrl(creator) {
        const slug =
            creatorSlug(creator);

        return slug
            ? (
                "/createur.html?slug=" +
                encodeURIComponent(slug)
            )
            : "/createurs.html";
    }

    function getPrimaryCreator(entry) {
        return (
            entry?.primaryCreator ??
            entry?.creator ??
            entry?.participants?.find(
                participant =>
                    participant.primary ||
                    participant.isPrimary
            ) ??
            entry?.participants?.[0] ??
            null
        );
    }

    function getEntryCreators(entry) {
        const result = [];
        const knownSlugs =
            new Set();

        const candidates = [
            getPrimaryCreator(entry),
            ...(entry?.participants ?? [])
        ].filter(Boolean);

        for (const creator of candidates) {
            const slug =
                creatorSlug(creator);

            const key =
                slug ||
                `id-${creator.id ?? creator.creatorId}`;

            if (
                !key ||
                knownSlugs.has(key)
            ) {
                continue;
            }

            knownSlugs.add(key);
            result.push(creator);
        }

        return result;
    }

    function getEntryCreatorSlugs(
        entry
    ) {
        return getEntryCreators(entry)
            .map(creatorSlug)
            .filter(Boolean);
    }

    /*
     * Menu mobile
     */

    function setNavigationOpen(
        open
    ) {
        if (
            !elements.navigation ||
            !elements.navigationToggle
        ) {
            return;
        }

        elements.navigation.classList.toggle(
            "is-open",
            open
        );

        document.body.classList.toggle(
            "navigation-open",
            open
        );

        elements.navigationToggle.setAttribute(
            "aria-expanded",
            String(open)
        );

        elements.navigationToggle.setAttribute(
            "aria-label",
            open
                ? "Fermer le menu"
                : "Ouvrir le menu"
        );
    }

    elements.navigationToggle
        ?.addEventListener(
            "click",
            () => {
                const open =
                    elements.navigationToggle
                        .getAttribute(
                            "aria-expanded"
                        ) !== "true";

                setNavigationOpen(open);
            }
        );

    elements.navigation
        ?.querySelectorAll("a")
        .forEach(link => {
            link.addEventListener(
                "click",
                () => {
                    setNavigationOpen(false);
                }
            );
        });

    /*
     * Normalisation des données
     */

    function normalizeCreators(data) {
        const list =
            Array.isArray(data?.creators)
                ? data.creators
                : Array.isArray(data?.results)
                    ? data.results
                    : Array.isArray(data)
                        ? data
                        : [];

        return list
            .filter(creator =>
                !creator.archived &&
                creator.active !== false
            )
            .sort(
                (first, second) =>
                    Number(
                        first.displayOrder ?? 100
                    ) -
                    Number(
                        second.displayOrder ?? 100
                    ) ||
                    creatorName(first).localeCompare(
                        creatorName(second),
                        "fr",
                        {
                            sensitivity: "base"
                        }
                    )
            );
    }

    function conditionIsSatisfied(
        entry
    ) {
        const condition =
            String(
                entry.goalCondition ??
                entry.goal_condition ??
                "always"
            ).toLowerCase();

        if (condition === "always") {
            return true;
        }

        if (!entry.goal) {
            return false;
        }

        const reached =
            Boolean(entry.goal.reached);

        if (condition === "reached") {
            return reached;
        }

        if (
            condition === "not_reached"
        ) {
            return !reached;
        }

        return true;
    }

    function resolveProgramEntry(
        entry
    ) {
        if (
            conditionIsSatisfied(entry)
        ) {
            return entry;
        }

        const fallbackEnabled =
            Boolean(
                entry.fallbackEnabled ??
                entry.fallback_enabled
            );

        const fallback =
            entry.fallback;

        if (
            !fallbackEnabled ||
            !fallback?.title
        ) {
            return null;
        }

        return {
            ...entry,

            title:
                fallback.title,

            descriptionMarkdown:
                fallback.descriptionMarkdown ??
                "",

            category:
                fallback.category ??
                entry.category,

            externalUrl:
                fallback.externalUrl ??
                null,

            goal: null,
            goalPublicId: null,
            goalCondition: "always",
            isFallback: true
        };
    }

    function normalizeProgram(data) {
        const list =
            Array.isArray(data?.entries)
                ? data.entries
                : Array.isArray(data?.program)
                    ? data.program
                    : Array.isArray(data)
                        ? data
                        : [];

        return list
            .filter(entry => {
                const status =
                    String(
                        entry.status ?? ""
                    ).toLowerCase();

                return (
                    status !== "draft" &&
                    status !== "cancelled" &&
                    status !== "canceled"
                );
            })
            .map(resolveProgramEntry)
            .filter(Boolean)
            .filter(entry =>
                validDate(entry.startsAt) &&
                validDate(entry.endsAt)
            )
            .sort(
                (first, second) =>
                    new Date(first.startsAt) -
                    new Date(second.startsAt)
            );
    }

    function mergeCreatorsFromEntries() {
        const known =
            new Map(
                creators.map(creator => [
                    creatorSlug(creator),
                    creator
                ])
            );

        for (const entry of entries) {
            for (
                const creator of
                getEntryCreators(entry)
            ) {
                const slug =
                    creatorSlug(creator);

                if (
                    slug &&
                    !known.has(slug)
                ) {
                    known.set(slug, creator);
                }
            }
        }

        creators =
            [...known.values()].sort(
                (first, second) =>
                    creatorName(first).localeCompare(
                        creatorName(second),
                        "fr",
                        {
                            sensitivity: "base"
                        }
                    )
            );
    }

    /*
     * Dates et segments
     */

    function makeSegment(
        entry,
        dateKey
    ) {
        const start =
            localParts(entry.startsAt);

        const end =
            localParts(entry.endsAt);

        if (!start || !end) {
            return null;
        }

        const effectiveEnd =
            localParts(
                new Date(
                    Math.max(
                        start.date.getTime(),
                        end.date.getTime() - 1
                    )
                )
            );

        if (
            !effectiveEnd ||
            dateKey < start.dateKey ||
            dateKey > effectiveEnd.dateKey
        ) {
            return null;
        }

        const startMinute =
            dateKey === start.dateKey
                ? start.minute
                : 0;

        const endMinute =
            dateKey === end.dateKey
                ? end.minute
                : DAY_MINUTES;

        if (
            endMinute <= startMinute
        ) {
            return null;
        }

        return {
            entry,
            start: startMinute,
            end: endMinute,
            lane: 0,
            laneCount: 1
        };
    }

    function buildAvailableDates() {
        const dateSet =
            new Set(EVENT_DATES);

        for (const entry of entries) {
            const start =
                localParts(entry.startsAt);

            const end =
                localParts(
                    new Date(
                        new Date(
                            entry.endsAt
                        ).getTime() - 1
                    )
                );

            if (!start || !end) {
                continue;
            }

            for (
                const dateKey of
                datesBetween(
                    start.dateKey,
                    end.dateKey
                )
            ) {
                dateSet.add(dateKey);
            }
        }

        availableDates =
            [...dateSet].sort();
    }

    function entryMatchesCreators(
        entry
    ) {
        if (
            selectedCreatorSlugs.size === 0
        ) {
            return true;
        }

        return getEntryCreatorSlugs(entry)
            .some(slug =>
                selectedCreatorSlugs.has(slug)
            );
    }

    function getSelectedSegments() {
        return entries
            .filter(entry =>
                entryMatchesCreators(entry)
            )
            .map(entry =>
                makeSegment(
                    entry,
                    selectedDate
                )
            )
            .filter(Boolean)
            .sort(
                (first, second) =>
                    first.start -
                    second.start ||
                    second.end -
                    first.end
            );
    }

    /*
     * URL
     */

    function readFiltersFromUrl() {
        const url =
            new URL(window.location.href);

        const requestedDate =
            url.searchParams.get("jour");

        if (
            requestedDate &&
            availableDates.includes(
                requestedDate
            )
        ) {
            selectedDate =
                requestedDate;
        }

        const requestedCreators =
            String(
                url.searchParams.get(
                    "createurs"
                ) ?? ""
            )
                .split(",")
                .map(value =>
                    value.trim().toLowerCase()
                )
                .filter(Boolean);

        selectedCreatorSlugs.clear();

        for (
            const slug of requestedCreators
        ) {
            selectedCreatorSlugs.add(
                slug
            );
        }
    }

    function updateUrl() {
        const url =
            new URL(window.location.href);

        url.searchParams.set(
            "jour",
            selectedDate
        );

        if (
            selectedCreatorSlugs.size > 0
        ) {
            url.searchParams.set(
                "createurs",
                [...selectedCreatorSlugs]
                    .join(",")
            );
        } else {
            url.searchParams.delete(
                "createurs"
            );
        }

        window.history.replaceState(
            {},
            "",
            url
        );
    }

    /*
     * Filtres visuels
     */

    function countEntriesForDate(
        dateKey
    ) {
        return entries
            .filter(entry =>
                entryMatchesCreators(entry)
            )
            .filter(entry =>
                Boolean(
                    makeSegment(
                        entry,
                        dateKey
                    )
                )
            )
            .length;
    }

    function renderDayFilters() {
        elements.dayFilterList
            ?.replaceChildren();

        for (
            const dateKey of
            availableDates
        ) {
            const button =
                createElement(
                    "button",
                    "day-filter-button"
                );

            button.type = "button";
            button.setAttribute(
                "role",
                "tab"
            );

            const selected =
                dateKey === selectedDate;

            button.classList.toggle(
                "is-active",
                selected
            );

            button.setAttribute(
                "aria-selected",
                String(selected)
            );

            const weekday =
                createElement(
                    "span",
                    "day-filter-weekday",
                    formatWeekday(dateKey)
                );

            const date =
                createElement(
                    "span",
                    "day-filter-date"
                );

            date.append(
                createElement(
                    "strong",
                    "",
                    formatDayNumber(dateKey)
                ),

                createElement(
                    "span",
                    "",
                    formatMonth(dateKey)
                )
            );

            const count =
                countEntriesForDate(
                    dateKey
                );

            const countLabel =
                createElement(
                    "small",
                    "day-filter-count",
                    `${count} activité${count > 1 ? "s" : ""
                    }`
                );

            button.append(
                weekday,
                date,
                countLabel
            );

            button.addEventListener(
                "click",
                () => {
                    selectedDate =
                        dateKey;

                    updateUrl();
                    renderEverything();
                }
            );

            elements.dayFilterList
                ?.append(button);
        }
    }

    function renderCreatorFilters() {
        elements.creatorFilterList
            ?.replaceChildren();

        const allButton =
            createElement(
                "button",
                "creator-filter-button creator-filter-all"
            );

        allButton.type = "button";

        const allSelected =
            selectedCreatorSlugs.size === 0;

        allButton.classList.toggle(
            "is-active",
            allSelected
        );

        allButton.innerHTML = `
      <span class="creator-filter-all-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="8" cy="8" r="3"></circle>
          <circle cx="17" cy="9" r="2.5"></circle>
          <path d="M3 19c.5-3.4 2.2-5 5-5s4.5 1.6 5 5"></path>
          <path d="M14 15c2.8 0 4.5 1.3 5 4"></path>
        </svg>
      </span>

      <span>
        Tous
      </span>
    `;

        allButton.addEventListener(
            "click",
            () => {
                selectedCreatorSlugs.clear();

                updateUrl();
                renderEverything();
            }
        );

        elements.creatorFilterList
            ?.append(allButton);

        for (const creator of creators) {
            const slug =
                creatorSlug(creator);

            if (!slug) {
                continue;
            }

            const button =
                createElement(
                    "button",
                    "creator-filter-button"
                );

            button.type = "button";

            const selected =
                selectedCreatorSlugs.has(slug);

            button.classList.toggle(
                "is-active",
                selected
            );

            button.setAttribute(
                "aria-pressed",
                String(selected)
            );

            const avatar =
                createElement(
                    "img",
                    "creator-filter-avatar"
                );

            avatar.src =
                creatorAvatar(creator);

            avatar.alt = "";
            avatar.loading = "lazy";

            const name =
                createElement(
                    "span",
                    "creator-filter-name",
                    creatorName(creator)
                );

            button.append(
                avatar,
                name
            );

            button.addEventListener(
                "click",
                () => {
                    if (
                        selectedCreatorSlugs.has(
                            slug
                        )
                    ) {
                        selectedCreatorSlugs.delete(
                            slug
                        );
                    } else {
                        selectedCreatorSlugs.add(
                            slug
                        );
                    }

                    updateUrl();
                    renderEverything();
                }
            );

            elements.creatorFilterList
                ?.append(button);
        }
    }

    function renderActiveFilters() {
        if (!elements.activeFilters) {
            return;
        }

        elements.activeFilters
            .replaceChildren();

        const hasCreatorFilters =
            selectedCreatorSlugs.size > 0;

        elements.activeFilters.hidden =
            !hasCreatorFilters;

        elements.resetFiltersButton.hidden =
            !hasCreatorFilters &&
            selectedDate === defaultDate;

        if (!hasCreatorFilters) {
            return;
        }

        const label =
            createElement(
                "span",
                "active-filters-label",
                "Filtres actifs"
            );

        elements.activeFilters.append(
            label
        );

        for (
            const slug of
            selectedCreatorSlugs
        ) {
            const creator =
                creators.find(
                    item =>
                        creatorSlug(item) === slug
                );

            const chip =
                createElement(
                    "button",
                    "active-filter-chip"
                );

            chip.type = "button";

            chip.append(
                createElement(
                    "span",
                    "",
                    creator
                        ? creatorName(creator)
                        : slug
                )
            );

            const close =
                createElement(
                    "span",
                    "active-filter-remove"
                );

            close.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 7l10 10M17 7 7 17"></path>
        </svg>
      `;

            chip.append(close);

            chip.addEventListener(
                "click",
                () => {
                    selectedCreatorSlugs.delete(
                        slug
                    );

                    updateUrl();
                    renderEverything();
                }
            );

            elements.activeFilters.append(
                chip
            );
        }
    }

    function resetFilters() {
        selectedCreatorSlugs.clear();
        selectedDate = defaultDate;

        updateUrl();
        renderEverything();
    }

    /*
     * Placement des activités simultanées
     */

    function assignLanes(segments) {
        const groups = [];

        let currentGroup = [];
        let groupEnd = -1;

        for (const segment of segments) {
            if (
                currentGroup.length > 0 &&
                segment.start >= groupEnd
            ) {
                groups.push(currentGroup);

                currentGroup = [];
                groupEnd = -1;
            }

            currentGroup.push(segment);

            groupEnd =
                Math.max(
                    groupEnd,
                    segment.end
                );
        }

        if (currentGroup.length > 0) {
            groups.push(currentGroup);
        }

        for (const group of groups) {
            const laneEnds = [];

            for (const segment of group) {
                let lane =
                    laneEnds.findIndex(
                        end =>
                            end <= segment.start
                    );

                if (lane < 0) {
                    lane =
                        laneEnds.length;
                }

                laneEnds[lane] =
                    segment.end;

                segment.lane = lane;
            }

            const laneCount =
                Math.max(
                    1,
                    laneEnds.length
                );

            for (const segment of group) {
                segment.laneCount =
                    laneCount;
            }
        }

        return segments;
    }

    /*
     * Affichage d’une condition
     */

    function getConditionLabel(entry) {
        const condition =
            String(
                entry.goalCondition ??
                entry.goal_condition ??
                "always"
            ).toLowerCase();

        if (
            !entry.goal ||
            condition === "always"
        ) {
            return null;
        }

        if (condition === "reached") {
            return (
                "Sous réserve " +
                "d’objectif atteint"
            );
        }

        if (
            condition === "not_reached"
        ) {
            return (
                "Si l’objectif " +
                "n’est pas atteint"
            );
        }

        return null;
    }

    function createConditionIcon() {
        const icon =
            createElement(
                "span",
                "program-condition-icon"
            );

        icon.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8"></circle>
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>
      </svg>
    `;

        return icon;
    }

    /*
     * Calendrier
     */

    function createCalendarEvent(
        segment,
        visibleStart
    ) {
        const entry =
            segment.entry;

        const creator =
            getPrimaryCreator(entry);

        const button =
            createElement(
                "button",
                "calendar-event"
            );

        button.type = "button";

        const now =
            Date.now();

        const isLive =
            new Date(
                entry.startsAt
            ).getTime() <= now &&
            new Date(
                entry.endsAt
            ).getTime() > now;

        const condition =
            getConditionLabel(entry);

        button.classList.toggle(
            "is-live",
            isLive
        );

        button.classList.toggle(
            "has-goal",
            Boolean(condition)
        );

        button.classList.toggle(
            "is-fallback",
            Boolean(entry.isFallback)
        );

        if (
            segment.end -
            segment.start < 60
        ) {
            button.classList.add(
                "is-compact"
            );
        }

        button.style.top =
            `${(
                segment.start -
                visibleStart
            ) * PIXELS_PER_MINUTE
            }px`;

        button.style.height =
            `${Math.max(
                46,
                (
                    segment.end -
                    segment.start
                ) * PIXELS_PER_MINUTE
            )}px`;

        button.style.left =
            `calc(${segment.lane *
            100 /
            segment.laneCount
            }% + 4px)`;

        button.style.width =
            `calc(${100 /
            segment.laneCount
            }% - 8px)`;

        const top =
            createElement(
                "span",
                "calendar-event-top"
            );

        if (creator) {
            const avatar =
                createElement(
                    "img",
                    "calendar-event-avatar"
                );

            avatar.src =
                creatorAvatar(creator);

            avatar.alt = "";

            top.append(avatar);
        }

        top.append(
            createElement(
                "span",
                "calendar-event-creator",
                creatorName(creator)
            ),

            createElement(
                "span",
                "calendar-event-time",
                (
                    `${formatClock(
                        segment.start
                    )} – ${formatClock(
                        segment.end
                    )}`
                )
            )
        );

        const title =
            createElement(
                "strong",
                "calendar-event-title",
                entry.title ||
                "Activité du JEvent"
            );

        button.append(
            top,
            title
        );

        if (condition) {
            const goal =
                createElement(
                    "span",
                    "calendar-event-condition"
                );

            goal.append(
                createConditionIcon(),
                document.createTextNode(
                    condition
                )
            );

            button.append(goal);
        }

        button.addEventListener(
            "click",
            () => {
                openActivityDialog(entry);
            }
        );

        return button;
    }

    function renderCalendar(
        segments
    ) {
        elements.calendarGrid
            ?.replaceChildren();

        if (segments.length === 0) {
            return;
        }

        const laidOutSegments =
            assignLanes(segments);

        let visibleStart =
            Math.floor(
                Math.min(
                    ...laidOutSegments.map(
                        segment =>
                            segment.start
                    )
                ) / 60
            ) * 60 - 60;

        let visibleEnd =
            Math.ceil(
                Math.max(
                    ...laidOutSegments.map(
                        segment =>
                            segment.end
                    )
                ) / 60
            ) * 60 + 60;

        visibleStart =
            Math.max(
                0,
                visibleStart
            );

        visibleEnd =
            Math.min(
                DAY_MINUTES,
                visibleEnd
            );

        if (
            visibleEnd -
            visibleStart < 240
        ) {
            visibleEnd =
                Math.min(
                    DAY_MINUTES,
                    visibleStart + 240
                );
        }

        const calendarHeight =
            (
                visibleEnd -
                visibleStart
            ) * PIXELS_PER_MINUTE;

        const topbar =
            createElement(
                "div",
                "calendar-topbar"
            );

        topbar.append(
            createElement(
                "span",
                "calendar-timezone",
                "Heure de Paris"
            ),

            createElement(
                "strong",
                "calendar-topbar-date",
                formatFullDate(
                    selectedDate
                )
            )
        );

        const body =
            createElement(
                "div",
                "calendar-body"
            );

        const hours =
            createElement(
                "div",
                "calendar-hours"
            );

        const track =
            createElement(
                "div",
                "calendar-track"
            );

        hours.style.height =
            `${calendarHeight}px`;

        track.style.height =
            `${calendarHeight}px`;

        for (
            let minute = visibleStart;
            minute <= visibleEnd;
            minute += 60
        ) {
            const position =
                (
                    minute -
                    visibleStart
                ) * PIXELS_PER_MINUTE;

            const label =
                createElement(
                    "span",
                    "calendar-hour-label",
                    formatClock(minute)
                );

            label.style.top =
                `${position}px`;

            const line =
                createElement(
                    "span",
                    "calendar-hour-line"
                );

            line.style.top =
                `${position}px`;

            hours.append(label);
            track.append(line);
        }

        for (
            const segment of
            laidOutSegments
        ) {
            track.append(
                createCalendarEvent(
                    segment,
                    visibleStart
                )
            );
        }

        body.append(
            hours,
            track
        );

        elements.calendarGrid.append(
            topbar,
            body
        );
    }

    /*
     * Liste mobile
     */

    function createMobileActivity(
        segment
    ) {
        const entry =
            segment.entry;

        const creator =
            getPrimaryCreator(entry);

        const button =
            createElement(
                "button",
                "mobile-program-item"
            );

        button.type = "button";

        const time =
            createElement(
                "span",
                "mobile-program-time"
            );

        time.append(
            createElement(
                "strong",
                "",
                formatClock(segment.start)
            ),

            createElement(
                "span",
                "",
                formatClock(segment.end)
            )
        );

        const content =
            createElement(
                "span",
                "mobile-program-content"
            );

        const creatorLine =
            createElement(
                "span",
                "mobile-program-creator"
            );

        if (creator) {
            const avatar =
                createElement(
                    "img",
                    ""
                );

            avatar.src =
                creatorAvatar(creator);

            avatar.alt = "";

            creatorLine.append(
                avatar,
                document.createTextNode(
                    creatorName(creator)
                )
            );
        }

        content.append(
            creatorLine,

            createElement(
                "strong",
                "mobile-program-title",
                entry.title ||
                "Activité du JEvent"
            )
        );

        const condition =
            getConditionLabel(entry);

        if (condition) {
            const conditionElement =
                createElement(
                    "span",
                    "mobile-program-condition"
                );

            conditionElement.append(
                createConditionIcon(),
                document.createTextNode(
                    condition
                )
            );

            content.append(
                conditionElement
            );
        }

        const arrow =
            createElement(
                "span",
                "mobile-program-arrow"
            );

        arrow.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9 5 7 7-7 7"></path>
      </svg>
    `;

        button.append(
            time,
            content,
            arrow
        );

        button.addEventListener(
            "click",
            () => {
                openActivityDialog(entry);
            }
        );

        return button;
    }

    function renderMobileList(
        segments
    ) {
        elements.mobileList
            ?.replaceChildren();

        for (const segment of segments) {
            elements.mobileList.append(
                createMobileActivity(
                    segment
                )
            );
        }
    }

    /*
     * Fenêtre de détails
     */

    function appendDialogDetail(
        label,
        value
    ) {
        if (!value) {
            return;
        }

        const row =
            createElement(
                "div",
                "activity-detail-row"
            );

        row.append(
            createElement(
                "span",
                "activity-detail-label",
                label
            ),

            createElement(
                "div",
                "activity-detail-value",
                value
            )
        );

        elements.dialogContent
            ?.append(row);
    }

    function renderMarkdown(
        markdown
    ) {
        const value =
            String(
                markdown ?? ""
            ).trim();

        if (!value) {
            return;
        }

        const section =
            createElement(
                "section",
                "activity-description"
            );

        if (
            window.marked &&
            window.DOMPurify
        ) {
            section.innerHTML =
                window.DOMPurify.sanitize(
                    window.marked.parse(
                        value,
                        {
                            gfm: true,
                            breaks: true
                        }
                    )
                );
        } else {
            section.textContent =
                value;
        }

        elements.dialogContent
            ?.append(section);
    }

    function renderDialogCreators(
        entry
    ) {
        const entryCreators =
            getEntryCreators(entry);

        if (
            entryCreators.length === 0
        ) {
            return;
        }

        const section =
            createElement(
                "section",
                "activity-creators"
            );

        section.append(
            createElement(
                "span",
                "activity-detail-label",
                entryCreators.length > 1
                    ? "Créateurs"
                    : "Créateur"
            )
        );

        const list =
            createElement(
                "div",
                "activity-creators-list"
            );

        for (
            const creator of
            entryCreators
        ) {
            const link =
                createElement(
                    "a",
                    "activity-creator"
                );

            link.href =
                creatorPageUrl(creator);

            const avatar =
                createElement(
                    "img",
                    ""
                );

            avatar.src =
                creatorAvatar(creator);

            avatar.alt = "";

            link.append(
                avatar,

                createElement(
                    "strong",
                    "",
                    creatorName(creator)
                )
            );

            list.append(link);
        }

        section.append(list);

        elements.dialogContent
            ?.append(section);
    }

    function renderDialogGoal(entry) {
        if (!entry.goal) {
            return;
        }

        const goal =
            createElement(
                "section",
                "activity-goal-card"
            );

        goal.classList.toggle(
            "is-reached",
            Boolean(
                entry.goal.reached
            )
        );

        const heading =
            createElement(
                "div",
                "activity-goal-heading"
            );

        heading.append(
            createConditionIcon(),

            createElement(
                "strong",
                "",
                entry.goal.title ||
                "Objectif de dons"
            )
        );

        goal.append(
            heading,

            createElement(
                "span",
                "activity-goal-amount",
                formatMoney(
                    entry.goal.thresholdCents,
                    entry.goal.currency ??
                    "EUR"
                )
            )
        );

        const condition =
            getConditionLabel(entry);

        if (condition) {
            goal.append(
                createElement(
                    "small",
                    "",
                    condition
                )
            );
        }

        elements.dialogContent
            ?.append(goal);
    }

    function openActivityDialog(
        entry
    ) {
        if (
            !elements.dialog ||
            !elements.dialogContent
        ) {
            return;
        }

        const creator =
            getPrimaryCreator(entry);

        elements.dialogTitle.textContent =
            entry.title ||
            "Activité du JEvent";

        elements.dialogEyebrow.textContent =
            entry.isFallback
                ? "Activité de remplacement"
                : (
                    entry.category ||
                    "Programme"
                );

        elements.dialogContent
            .replaceChildren();

        renderDialogCreators(entry);

        appendDialogDetail(
            "Date",
            formatFullDate(
                entry.startsAt
            )
        );

        appendDialogDetail(
            "Horaire",
            `${formatTime(
                entry.startsAt
            )} – ${formatTime(
                entry.endsAt
            )}`
        );

        if (entry.category) {
            appendDialogDetail(
                "Catégorie",
                entry.category
            );
        }

        renderMarkdown(
            entry.descriptionMarkdown
        );

        renderDialogGoal(entry);

        if (creator) {
            elements.creatorLink.href =
                creatorPageUrl(creator);

            elements.creatorLink.hidden =
                false;
        } else {
            elements.creatorLink.hidden =
                true;
        }

        if (entry.externalUrl) {
            elements.externalLink.href =
                entry.externalUrl;

            elements.externalLink.hidden =
                false;
        } else {
            elements.externalLink.hidden =
                true;

            elements.externalLink.removeAttribute(
                "href"
            );
        }

        elements.dialog.showModal();
    }

    function closeActivityDialog() {
        elements.dialog?.close();
    }

    /*
     * Statut du programme
     */

    function renderProgramStatus() {
        const now =
            Date.now();

        const current =
            entries.find(entry => {
                const start =
                    new Date(
                        entry.startsAt
                    ).getTime();

                const end =
                    new Date(
                        entry.endsAt
                    ).getTime();

                return (
                    start <= now &&
                    end > now
                );
            });

        if (current) {
            elements.statusCard
                ?.classList.add(
                    "is-live"
                );

            elements.statusLabel.textContent =
                "En ce moment";

            elements.statusTitle.textContent =
                current.title ||
                "Activité en cours";

            elements.statusTime.textContent =
                (
                    `${creatorName(
                        getPrimaryCreator(current)
                    )} · ` +
                    `${formatTime(
                        current.startsAt
                    )} – ${formatTime(
                        current.endsAt
                    )}`
                );

            return;
        }

        elements.statusCard
            ?.classList.remove(
                "is-live"
            );

        const next =
            entries.find(
                entry =>
                    new Date(
                        entry.startsAt
                    ).getTime() > now
            );

        if (next) {
            elements.statusLabel.textContent =
                "Prochaine activité";

            elements.statusTitle.textContent =
                next.title ||
                "Activité à venir";

            elements.statusTime.textContent =
                (
                    `${formatFullDate(
                        next.startsAt
                    )} à ${formatTime(
                        next.startsAt
                    )}`
                );

            return;
        }

        elements.statusLabel.textContent =
            "Programme";

        elements.statusTitle.textContent =
            "Aucune activité à venir";

        elements.statusTime.textContent =
            "";
    }

    /*
     * Rendu général
     */

    function renderSelectedDayHeading() {
        elements.selectedDayTitle.textContent =
            formatFullDate(
                selectedDate
            );

        const selectedIndex =
            availableDates.indexOf(
                selectedDate
            );

        elements.selectedDayEyebrow
            .textContent =
            selectedIndex >= 0
                ? `Journée ${selectedIndex + 1
                }`
                : "Journée sélectionnée";
    }

    function renderResultCount(
        count
    ) {
        elements.filterResultCount
            .textContent =
            `${count} activité${count > 1 ? "s" : ""
            } affichée${count > 1 ? "s" : ""
            }`;
    }

    function renderProgramme() {
        const segments =
            getSelectedSegments();

        const empty =
            segments.length === 0;

        elements.calendarContainer.hidden =
            empty;

        elements.mobileList.hidden =
            empty;

        elements.empty.hidden =
            !empty;

        renderResultCount(
            segments.length
        );

        renderSelectedDayHeading();

        if (empty) {
            elements.calendarGrid
                ?.replaceChildren();

            elements.mobileList
                ?.replaceChildren();

            return;
        }

        renderCalendar(segments);
        renderMobileList(segments);
    }

    function renderEverything() {
        renderDayFilters();
        renderCreatorFilters();
        renderActiveFilters();
        renderProgramme();
        renderProgramStatus();
    }

    function setPageState(
        state
    ) {
        elements.loading.hidden =
            state !== "loading";

        elements.error.hidden =
            state !== "error";

        elements.content.hidden =
            state !== "ready";
    }

    /*
     * Chargement
     */

    async function loadProgramme() {
        setPageState("loading");

        try {
            const [
                programData,
                creatorsResult
            ] = await Promise.all([
                apiFetch(
                    "/api/program"
                ),

                apiFetch(
                    "/api/creators"
                ).catch(error => {
                    console.warn(
                        "Chargement des créateurs impossible :",
                        error
                    );

                    return {
                        creators: []
                    };
                })
            ]);

            entries =
                normalizeProgram(
                    programData
                );

            creators =
                normalizeCreators(
                    creatorsResult
                );

            mergeCreatorsFromEntries();
            buildAvailableDates();

            const today =
                localParts(
                    new Date()
                )?.dateKey;

            defaultDate =
                availableDates.includes(today)
                    ? today
                    : availableDates.includes(
                        EVENT_START_DATE
                    )
                        ? EVENT_START_DATE
                        : availableDates[0];

            selectedDate =
                defaultDate;

            readFiltersFromUrl();

            if (
                !availableDates.includes(
                    selectedDate
                )
            ) {
                selectedDate =
                    defaultDate;
            }

            setPageState("ready");

            renderEverything();
            updateUrl();
        } catch (error) {
            console.error(
                "Chargement du programme impossible :",
                error
            );

            elements.errorMessage.textContent =
                error.name === "AbortError"
                    ? (
                        "Le chargement a pris trop de temps."
                    )
                    : (
                        error.message ||
                        "Une erreur est survenue."
                    );

            setPageState("error");
        }
    }

    /*
     * Événements
     */

    elements.resetFiltersButton
        ?.addEventListener(
            "click",
            resetFilters
        );

    elements.emptyResetButton
        ?.addEventListener(
            "click",
            resetFilters
        );

    elements.retryButton
        ?.addEventListener(
            "click",
            () => {
                void loadProgramme();
            }
        );

    elements.closeDialog
        ?.addEventListener(
            "click",
            closeActivityDialog
        );

    elements.dialog
        ?.addEventListener(
            "click",
            event => {
                if (
                    event.target ===
                    elements.dialog
                ) {
                    closeActivityDialog();
                }
            }
        );

    elements.dialog
        ?.addEventListener(
            "cancel",
            event => {
                event.preventDefault();
                closeActivityDialog();
            }
        );

    window.addEventListener(
        "popstate",
        () => {
            readFiltersFromUrl();
            renderEverything();
        }
    );

    window.setInterval(
        renderProgramStatus,
        30_000
    );

    void loadProgramme();
})();