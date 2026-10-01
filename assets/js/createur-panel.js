(() => {
    "use strict";

    const API_URL =
        "https://api-beta.jevent.julot.fr";

    const TIME_ZONE =
        "Europe/Paris";

    const REFRESH_INTERVAL_MS =
        60 * 1000;

    const REMINDER_DURATION_MS =
        9 * 1000;

    const PANEL_INFORMATION = {
        overview: {
            kicker: "Tableau de bord",
            title: "Vue d’ensemble"
        },

        raffles: {
            kicker: "Animation",
            title: "Tombola"
        },

        interactions: {
            kicker: "Participations",
            title: "Interactions"
        },

        program: {
            kicker: "Organisation",
            title: "Programme"
        },

        statistics: {
            kicker: "Activité",
            title: "Statistiques"
        },

        team: {
            kicker: "Permissions",
            title: "Équipe"
        },

        settings: {
            kicker: "Configuration",
            title: "Paramètres"
        }
    };

    const DELIVERY_LABELS = {
        waiting: "En attente",
        used: "Utilisée",
        dismissed: "Ignorée"
    };

    const $ = selector =>
        document.querySelector(selector);

    const $$ = selector =>
        [
            ...document.querySelectorAll(
                selector
            )
        ];

    const elements = {
        loading:
            $("#dashboardLoading"),

        error:
            $("#dashboardError"),

        errorMessage:
            $("#dashboardErrorMessage"),

        application:
            $("#dashboardApplication"),

        sidebar:
            $("#dashboardSidebar"),

        sidebarBackdrop:
            $("#sidebarBackdrop"),

        openSidebarButton:
            $("#openSidebarButton"),

        closeSidebarButton:
            $("#closeSidebarButton"),

        navigationButtons:
            $$(
                "[data-dashboard-panel]"
            ),

        panelButtons:
            $$(
                "[data-open-dashboard-panel]"
            ),

        panels:
            $$(
                "[data-dashboard-panel-content]"
            ),

        currentPanelKicker:
            $("#currentPanelKicker"),

        currentPanelTitle:
            $("#currentPanelTitle"),

        sidebarCreatorAvatar:
            $("#sidebarCreatorAvatar"),

        sidebarCreatorName:
            $("#sidebarCreatorName"),

        sidebarCreatorLogin:
            $("#sidebarCreatorLogin"),

        sidebarLiveIndicator:
            $("#sidebarLiveIndicator"),

        dashboardLiveStatus:
            $("#dashboardLiveStatus"),

        publicCreatorPageLink:
            $("#publicCreatorPageLink"),

        adminCreatorSelectorWrapper:
            $("#adminCreatorSelectorWrapper"),

        adminCreatorSelector:
            $("#adminCreatorSelector"),

        refreshDashboardButton:
            $("#refreshDashboardButton"),

        dashboardLastUpdate:
            $("#dashboardLastUpdate"),

        raisedAmount:
            $("#overviewRaisedAmount"),

        raisedProgress:
            $("#overviewRaisedProgress"),

        raisedDetail:
            $("#overviewRaisedDetail"),

        messagesCount:
            $("#overviewMessagesCount"),

        emotesCount:
            $("#overviewEmotesCount"),

        interactionsCount:
            $("#overviewInteractionsCount"),

        raffleParticipants:
            $("#overviewRaffleParticipants"),

        raffleStatus:
            $("#overviewRaffleStatus"),

        sidebarInteractionsBadge:
            $("#sidebarInteractionsBadge"),

        sidebarRaffleBadge:
            $("#sidebarRaffleBadge"),

        overviewInteractionsList:
            $("#overviewInteractionsList"),

        overviewInteractionsEmpty:
            $("#overviewInteractionsEmpty"),

        creatorInteractionsList:
            $("#creatorInteractionsList"),

        creatorInteractionsEmpty:
            $("#creatorInteractionsEmpty"),

        refreshInteractionsButton:
            $("#refreshInteractionsButton"),

        hideAllImagesButton:
            $("#hideAllInteractionImagesButton"),

        scheduleTimeline:
            $("#dashboardScheduleTimeline"),

        scheduleEmpty:
            $("#dashboardScheduleEmpty"),

        scheduleCurrentDate:
            $("#scheduleCurrentDate"),

        currentTimeLine:
            $("#dashboardCurrentTimeLine"),

        currentTimeLabel:
            $("#dashboardCurrentTimeLabel"),

        reminder:
            $("#dashboardReminder"),

        reminderType:
            $("#dashboardReminderType"),

        reminderTitle:
            $("#dashboardReminderTitle"),

        reminderMessage:
            $("#dashboardReminderMessage"),

        dismissReminderButton:
            $("#dismissReminderButton"),

        creatorStatisticsContent:
            $("#creatorStatisticsContent"),

        creatorTeamContent:
            $("#creatorTeamContent"),

        remindersEnabled:
            $("#importantRemindersEnabled"),

        reminderSoundsEnabled:
            $("#reminderSoundsEnabled"),

        quickStartRaffleButton:
            $("#quickStartRaffleButton"),

        createRaffleButton:
            $("#createRaffleButton"),

        rafflesPanelContent:
            $("#rafflesPanelContent"),


        raffleDialog:
            $("#raffleDialog"),

        raffleForm:
            $("#raffleForm"),

        closeRaffleDialogButton:
            $("#closeRaffleDialogButton"),

        cancelRaffleButton:
            $("#cancelRaffleButton"),

        raffleTitle:
            $("#raffleTitle"),

        raffleDescription:
            $("#raffleDescription"),

        customRaffleDurationField:
            $("#customRaffleDurationField"),

        customRaffleDuration:
            $("#customRaffleDuration"),

        raffleCountdownField:
            $("#raffleCountdownField"),

        raffleCountdownMinutes:
            $("#raffleCountdownMinutes"),

        raffleFormMessage:
            $("#raffleFormMessage"),

        submitRaffleButton:
            $("#submitRaffleButton"),

        activeRaffleCard:
            $("#activeRaffleCard"),

        activeRaffleTitle:
            $("#activeRaffleTitle"),

        activeRaffleDescription:
            $("#activeRaffleDescription"),

        activeRaffleTimer:
            $("#activeRaffleTimer"),

        activeRaffleEntries:
            $("#activeRaffleEntries"),

        activeRaffleUsers:
            $("#activeRaffleUsers"),

        activeRaffleAmount:
            $("#activeRaffleAmount"),

        stopRaffleButton:
            $("#stopRaffleButton"),

        drawRaffleButton:
            $("#drawRaffleButton"),

        themeToggleButton:
            $("#themeToggleButton"),

        darkModeEnabled:
            $("#darkModeEnabled")
    };

    const state = {
        currentUser: null,
        creator: null,
        creatorPanel: null,

        raffles: [],
        raffleTimer: null,
        raffleDataTimer: null,
        raffleRefreshPending: false,

        availableCreators: [],

        statistics: null,

        program: [],

        queue: [],
        queueCounts: {
            waiting: 0,
            used: 0,
            dismissed: 0,
            total: 0
        },

        activeRaffle: null,

        selectedPanel:
            "overview",

        loading: false,
        refreshing: false,

        reminderTimer: null,
        refreshTimer: null,
        clockTimer: null,

        revealedUploads:
            new Set(),

        settings: {
            remindersEnabled: true,
            soundsEnabled: false,
            darkMode: false
        }
    };

    /* ======================================================
       OUTILS
       ====================================================== */

    function onSafe(
        element,
        eventName,
        callback
    ) {
        if (!element) {
            return;
        }

        element.addEventListener(
            eventName,
            callback
        );
    }

    function setHidden(
        element,
        hidden
    ) {
        if (element) {
            element.hidden = hidden;
        }
    }

    function numberOrZero(value) {
        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }

    function formatNumber(value) {
        return new Intl.NumberFormat(
            "fr-FR"
        ).format(
            numberOrZero(value)
        );
    }

    function formatMoney(
        cents,
        currency = "EUR"
    ) {
        return new Intl.NumberFormat(
            "fr-FR",
            {
                style: "currency",
                currency,
                maximumFractionDigits: 2
            }
        ).format(
            numberOrZero(cents) / 100
        );
    }

    function formatFileSize(bytes) {
        const size =
            numberOrZero(bytes);

        if (size < 1024) {
            return `${size} octets`;
        }

        if (
            size <
            1024 * 1024
        ) {
            return (
                `${(
                    size / 1024
                ).toFixed(1)} Ko`
            );
        }

        return (
            `${(
                size /
                1024 /
                1024
            ).toFixed(2)} Mo`
        );
    }

    function formatTime(value) {
        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "—";
        }

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: TIME_ZONE
            }
        ).format(date);
    }

    function formatDate(value) {
        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "—";
        }

        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: TIME_ZONE
            }
        ).format(date);
    }

    function getDateKey(value) {
        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }

        const parts =
            new Intl.DateTimeFormat(
                "fr-FR",
                {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    timeZone: TIME_ZONE
                }
            ).formatToParts(date);

        const values =
            Object.fromEntries(
                parts.map(part => [
                    part.type,
                    part.value
                ])
            );

        return (
            `${values.year}-` +
            `${values.month}-` +
            `${values.day}`
        );
    }

    function getTodayKey() {
        return getDateKey(
            new Date()
        );
    }

    function createElement(
        tagName,
        className = "",
        textContent = ""
    ) {
        const element =
            document.createElement(
                tagName
            );

        if (className) {
            element.className =
                className;
        }

        if (textContent) {
            element.textContent =
                textContent;
        }

        return element;
    }

    function displayNameForCreator(
        creator
    ) {
        return (
            creator?.twitchDisplayName ||
            creator?.twitch_display_name ||
            creator?.displayName ||
            creator?.slug ||
            "Créateur"
        );
    }

    function creatorAvatar(
        creator
    ) {
        return (
            creator?.twitchProfileImageUrl ||
            creator?.twitch_profile_image_url ||
            creator?.profileImageUrl ||
            "/assets/jevent_logo.png"
        );
    }

    function currentCreatorId() {
        return Number(
            state.creator?.id ||
            state.creatorPanel
                ?.creator?.id ||
            0
        );
    }

    function getSettingsKey() {
        return (
            "jevent-creator-dashboard-" +
            String(
                currentCreatorId() || "default"
            )
        );
    }

    function getMembershipRoleLabel(
        role
    ) {
        const labels = {
            owner: "Propriétaire",
            delegate: "Délégué",
            creator_moderator:
                "Modérateur de la chaîne",
            super_admin:
                "Administrateur"
        };

        return labels[role] || role;
    }

    /* ======================================================
       API
       ====================================================== */

    async function apiFetch(
        pathname,
        options = {}
    ) {
        const headers = {
            Accept:
                "application/json",

            ...(options.headers || {})
        };

        if (
            options.body &&
            typeof options.body ===
            "string"
        ) {
            headers["Content-Type"] =
                "application/json";
        }

        const response =
            await fetch(
                API_URL + pathname,
                {
                    ...options,
                    headers,
                    credentials: "include"
                }
            );

        const contentType =
            response.headers.get(
                "Content-Type"
            ) || "";

        let data = {};

        if (
            contentType.includes(
                "application/json"
            )
        ) {
            try {
                data =
                    await response.json();
            } catch {
                data = {};
            }
        }

        if (!response.ok) {
            const error =
                new Error(
                    data.error ||
                    data.message ||
                    `Erreur HTTP ${response.status}`
                );

            error.status =
                response.status;

            error.data =
                data;

            throw error;
        }

        return data;
    }

    async function safeApiFetch(
        pathname,
        options = {}
    ) {
        try {
            return await apiFetch(
                pathname,
                options
            );
        } catch (error) {
            console.warn(
                "[Tableau créateur]",
                pathname,
                error.message
            );

            return null;
        }
    }

    /* ======================================================
       AFFICHAGE DE LA PAGE
       ====================================================== */

    function showLoading() {
        setHidden(
            elements.loading,
            false
        );

        setHidden(
            elements.error,
            true
        );

        setHidden(
            elements.application,
            true
        );
    }

    function showApplication() {
        setHidden(
            elements.loading,
            true
        );

        setHidden(
            elements.error,
            true
        );

        setHidden(
            elements.application,
            false
        );
    }

    function showError(error) {
        setHidden(
            elements.loading,
            true
        );

        setHidden(
            elements.application,
            true
        );

        setHidden(
            elements.error,
            false
        );

        if (elements.errorMessage) {
            if (error.status === 401) {
                elements.errorMessage
                    .textContent =
                    "Connecte-toi avec Twitch pour accéder à ce tableau de bord.";
            } else if (
                error.status === 403
            ) {
                elements.errorMessage
                    .textContent =
                    "Tu n’as pas accès à ce tableau de bord.";
            } else {
                elements.errorMessage
                    .textContent =
                    error.message ||
                    "Une erreur est survenue.";
            }
        }
    }

    /* ======================================================
       NAVIGATION
       ====================================================== */

    function normalizePanelName(
        value
    ) {
        const panel =
            String(value || "")
                .replace(/^#/, "")
                .trim()
                .toLowerCase();

        return Object.hasOwn(
            PANEL_INFORMATION,
            panel
        )
            ? panel
            : "overview";
    }

    function openPanel(
        panelName,
        {
            updateHash = true
        } = {}
    ) {
        const panel =
            normalizePanelName(
                panelName
            );

        state.selectedPanel =
            panel;

        for (
            const button of
            elements.navigationButtons
        ) {
            const selected =
                button.dataset
                    .dashboardPanel === panel;

            button.classList.toggle(
                "is-active",
                selected
            );

            button.setAttribute(
                "aria-current",
                selected
                    ? "page"
                    : "false"
            );
        }

        for (
            const content of
            elements.panels
        ) {
            const selected =
                content.dataset
                    .dashboardPanelContent ===
                panel;

            content.hidden =
                !selected;

            content.classList.toggle(
                "is-active",
                selected
            );
        }

        const information =
            PANEL_INFORMATION[panel];

        if (
            elements.currentPanelKicker
        ) {
            elements.currentPanelKicker
                .textContent =
                information.kicker;
        }

        if (
            elements.currentPanelTitle
        ) {
            elements.currentPanelTitle
                .textContent =
                information.title;
        }

        if (updateHash) {
            history.replaceState(
                null,
                "",
                `#${panel}`
            );
        }

        closeSidebar();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    function openSidebar() {
        elements.sidebar
            ?.classList.add(
                "is-open"
            );

        document.body.classList.add(
            "is-sidebar-open"
        );

        setHidden(
            elements.sidebarBackdrop,
            false
        );
    }

    function closeSidebar() {
        elements.sidebar
            ?.classList.remove(
                "is-open"
            );

        document.body.classList.remove(
            "is-sidebar-open"
        );

        setHidden(
            elements.sidebarBackdrop,
            true
        );
    }

    /* ======================================================
       AUTHENTIFICATION ET CRÉATEUR
       ====================================================== */

    async function loadCurrentUser() {
        const data =
            await apiFetch(
                "/api/auth/me"
            );

        state.currentUser =
            data.user || data;

        if (!state.currentUser?.id) {
            throw Object.assign(
                new Error(
                    "Tu dois être connecté."
                ),
                {
                    status: 401
                }
            );
        }
    }

    function isSuperAdmin() {
        return Boolean(
            state.currentUser
                ?.permissions
                ?.isSuperAdmin
        );
    }

    function manageableMemberships() {
        return (
            state.currentUser
                ?.creatorMemberships || []
        ).filter(
            membership =>
                [
                    "owner",
                    "delegate"
                ].includes(
                    membership.memberRole
                )
        );
    }

    async function loadAdminCreators() {
        if (!isSuperAdmin()) {
            state.availableCreators = [];
            return;
        }

        const data =
            await apiFetch(
                "/api/admin/creators"
            );

        state.availableCreators =
            Array.isArray(data.creators)
                ? data.creators.filter(
                    creator =>
                        !creator.archived
                )
                : [];
    }

    function requestedCreatorId() {
        const parameters =
            new URLSearchParams(
                location.search
            );

        return numberOrZero(
            parameters.get(
                "creatorId"
            )
        );
    }

    function resolveInitialCreatorId() {
        const requestedId =
            requestedCreatorId();

        if (
            requestedId &&
            isSuperAdmin()
        ) {
            return requestedId;
        }

        const memberships =
            manageableMemberships();

        if (requestedId) {
            const membership =
                memberships.find(
                    item =>
                        Number(
                            item.creatorId
                        ) === requestedId
                );

            if (membership) {
                return requestedId;
            }
        }

        if (memberships.length > 0) {
            return Number(
                memberships[0].creatorId
            );
        }

        if (
            isSuperAdmin() &&
            state.availableCreators.length > 0
        ) {
            return Number(
                state.availableCreators[0].id
            );
        }

        throw Object.assign(
            new Error(
                "Aucun espace créateur n’est associé à ton compte."
            ),
            {
                status: 403
            }
        );
    }

    async function loadCreator(
        creatorId
    ) {
        const data =
            await apiFetch(
                (
                    "/api/creator-panel" +
                    `?creatorId=${encodeURIComponent(
                        creatorId
                    )
                    }`
                )
            );

        state.creatorPanel =
            data;

        const panelCreator =
            data.creator;

        if (!panelCreator) {
            throw new Error(
                "Profil créateur introuvable."
            );
        }

        let publicCreator = null;

        if (panelCreator.slug) {
            const publicData =
                await safeApiFetch(
                    (
                        "/api/creators/" +
                        encodeURIComponent(
                            panelCreator.slug
                        )
                    )
                );

            publicCreator =
                publicData?.creator || null;
        }

        state.creator = {
            ...panelCreator,
            ...(publicCreator || {})
        };

        updateCreatorUrl(
            creatorId
        );
    }

    function updateCreatorUrl(
        creatorId
    ) {
        const url =
            new URL(location.href);

        if (isSuperAdmin()) {
            url.searchParams.set(
                "creatorId",
                String(creatorId)
            );
        } else {
            url.searchParams.delete(
                "creatorId"
            );
        }

        history.replaceState(
            null,
            "",
            url.pathname +
            url.search +
            url.hash
        );
    }

    function renderAdminCreatorSelector() {
        const visible =
            isSuperAdmin() &&
            state.availableCreators.length >
            0;

        setHidden(
            elements
                .adminCreatorSelectorWrapper,
            !visible
        );

        if (
            !visible ||
            !elements.adminCreatorSelector
        ) {
            return;
        }

        elements.adminCreatorSelector
            .replaceChildren();

        for (
            const creator of
            state.availableCreators
        ) {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(creator.id);

            option.textContent =
                displayNameForCreator(
                    creator
                );

            option.selected =
                Number(creator.id) ===
                currentCreatorId();

            elements.adminCreatorSelector
                .append(option);
        }
    }

    /* ======================================================
       PROFIL ET LIVE
       ====================================================== */

    function renderCreator() {
        const creator =
            state.creator;

        if (!creator) {
            return;
        }

        const name =
            displayNameForCreator(
                creator
            );

        const login =
            creator.twitchLogin ||
            creator.twitch_login ||
            creator.slug ||
            "";

        const avatar =
            creatorAvatar(creator);

        if (
            elements.sidebarCreatorAvatar
        ) {
            elements.sidebarCreatorAvatar.src =
                avatar;

            elements.sidebarCreatorAvatar.alt =
                `Avatar de ${name}`;
        }

        if (
            elements.sidebarCreatorName
        ) {
            elements.sidebarCreatorName
                .textContent =
                name;
        }

        if (
            elements.sidebarCreatorLogin
        ) {
            elements.sidebarCreatorLogin
                .textContent =
                login
                    ? `@${login}`
                    : "";
        }

        if (
            elements.publicCreatorPageLink
        ) {
            elements.publicCreatorPageLink.href =
                (
                    "/createur.html?slug=" +
                    encodeURIComponent(
                        creator.slug
                    )
                );
        }

        document.title =
            `${name} — Tableau créateur`;

        renderLiveStatus();
    }

    function renderLiveStatus() {
        const isLive =
            Boolean(
                state.creator?.isLive
            );

        elements.sidebarLiveIndicator
            ?.classList.toggle(
                "is-live",
                isLive
            );

        if (
            elements.sidebarLiveIndicator
        ) {
            elements.sidebarLiveIndicator.title =
                isLive
                    ? "En direct"
                    : "Hors ligne";
        }

        if (
            elements.dashboardLiveStatus
        ) {
            elements.dashboardLiveStatus
                .classList.toggle(
                    "is-live",
                    isLive
                );

            const label =
                elements.dashboardLiveStatus
                    .querySelector("strong");

            if (label) {
                label.textContent =
                    isLive
                        ? "En direct"
                        : "Hors ligne";
            }
        }
    }

    /* ======================================================
       STATISTIQUES
       ====================================================== */

    async function loadStatistics() {
        const creatorId =
            currentCreatorId();

        let data =
            await safeApiFetch(
                (
                    "/api/creator-panel/statistics" +
                    `?creatorId=${encodeURIComponent(
                        creatorId
                    )
                    }`
                )
            );

        if (
            !data &&
            isSuperAdmin()
        ) {
            data =
                await safeApiFetch(
                    (
                        "/api/admin/stats/overview" +
                        `?creatorId=${encodeURIComponent(
                            creatorId
                        )
                        }`
                    )
                );
        }

        state.statistics =
            data;
    }

    function getOverviewStatistics() {
        return (
            state.statistics?.overview ||
            state.statistics?.statistics ||
            state.statistics ||
            {}
        );
    }

    function renderStatistics() {
        const overview =
            getOverviewStatistics();

        const raisedCents =
            state.creator
                ?.raisedAvailable
                ? numberOrZero(
                    state.creator.raisedCents
                )
                : (
                    overview.raisedCents ===
                        null ||
                        overview.raisedCents ===
                        undefined
                        ? null
                        : numberOrZero(
                            overview.raisedCents
                        )
                );

        if (elements.raisedAmount) {
            elements.raisedAmount.textContent =
                raisedCents === null
                    ? "Non disponible"
                    : formatMoney(
                        raisedCents
                    );
        }

        if (elements.raisedDetail) {
            elements.raisedDetail.textContent =
                raisedCents === null
                    ? (
                        "La cagnotte Streamlabs n’est pas configurée."
                    )
                    : raisedCents > 0
                        ? (
                            `${formatMoney(
                                raisedCents
                            )} collectés`
                        )
                        : "Aucun don pour le moment";
        }

        if (elements.raisedProgress) {
            const goalCents =
                numberOrZero(
                    overview.goalCents ||
                    overview.targetCents
                );

            const percentage =
                (
                    raisedCents !== null &&
                    goalCents > 0
                )
                    ? Math.min(
                        100,
                        Math.round(
                            raisedCents /
                            goalCents *
                            100
                        )
                    )
                    : 0;

            elements.raisedProgress.style.width =
                `${percentage}%`;
        }

        if (elements.messagesCount) {
            elements.messagesCount
                .textContent =
                overview.messages ===
                    undefined
                    ? "—"
                    : formatNumber(
                        overview.messages
                    );
        }

        if (elements.emotesCount) {
            elements.emotesCount
                .textContent =
                overview.emotes ===
                    undefined
                    ? "—"
                    : formatNumber(
                        overview.emotes
                    );
        }

        renderStatisticsPanel(
            overview,
            raisedCents
        );
    }

    function renderStatisticsPanel(
        overview,
        raisedCents
    ) {
        if (
            !elements.creatorStatisticsContent
        ) {
            return;
        }

        elements.creatorStatisticsContent
            .replaceChildren();

        const grid =
            createElement(
                "div",
                "dashboard-statistics-grid"
            );

        const values = [
            {
                label: "Cagnotte",
                value:
                    raisedCents === null
                        ? "Non disponible"
                        : formatMoney(
                            raisedCents
                        )
            },

            {
                label: "Messages",
                value:
                    overview.messages ===
                        undefined
                        ? "—"
                        : formatNumber(
                            overview.messages
                        )
            },

            {
                label: "Emotes",
                value:
                    overview.emotes ===
                        undefined
                        ? "—"
                        : formatNumber(
                            overview.emotes
                        )
            },

            {
                label:
                    "Interactions en attente",

                value:
                    formatNumber(
                        state.queueCounts.waiting
                    )
            },

            {
                label:
                    "Interactions utilisées",

                value:
                    formatNumber(
                        state.queueCounts.used
                    )
            }
        ];

        for (const item of values) {
            const card =
                createElement(
                    "article",
                    "dashboard-stat-card"
                );

            card.append(
                createElement(
                    "span",
                    "",
                    item.label
                ),

                createElement(
                    "strong",
                    "",
                    item.value
                )
            );

            grid.append(card);
        }

        elements.creatorStatisticsContent
            .append(grid);
    }

    /* ======================================================
       PROGRAMME
       ====================================================== */

    function entryBelongsToCreator(
        entry
    ) {
        const creatorId =
            currentCreatorId();

        const primary =
            entry.primaryCreator ||
            (
                entry.participants || []
            ).find(
                participant =>
                    participant.primary
            );

        return (
            Number(primary?.id) ===
            creatorId
        );
    }

    async function loadProgram() {
        const data =
            await safeApiFetch(
                "/api/program"
            );

        const entries =
            Array.isArray(data?.entries)
                ? data.entries
                : Array.isArray(
                    data?.program
                )
                    ? data.program
                    : [];

        state.program =
            entries
                .filter(
                    entry =>
                        entryBelongsToCreator(
                            entry
                        ) &&
                        entry.status !==
                        "cancelled"
                )
                .sort(
                    (first, second) =>
                        new Date(
                            first.startsAt
                        ) -
                        new Date(
                            second.startsAt
                        )
                );
    }

    function todayProgram() {
        const today =
            getTodayKey();

        return state.program.filter(
            entry =>
                getDateKey(
                    entry.startsAt
                ) === today
        );
    }

    function createScheduleEntry(
        entry
    ) {
        const now =
            Date.now();

        const startsAt =
            new Date(
                entry.startsAt
            ).getTime();

        const endsAt =
            new Date(
                entry.endsAt
            ).getTime();

        const article =
            createElement(
                "article",
                "dashboard-schedule-entry"
            );

        if (
            now >= startsAt &&
            now < endsAt
        ) {
            article.classList.add(
                "is-current"
            );
        } else if (
            now >= endsAt
        ) {
            article.classList.add(
                "is-past"
            );
        }

        const time =
            createElement(
                "span",
                "dashboard-schedule-entry-time",
                formatTime(entry.startsAt)
            );

        const title =
            createElement(
                "strong",
                "",
                entry.title || "Activité"
            );

        article.append(
            time,
            title
        );

        if (entry.category) {
            article.append(
                createElement(
                    "p",
                    "",
                    entry.category
                )
            );
        }

        if (entry.goal) {
            const condition =
                createElement(
                    "span",
                    "dashboard-schedule-entry-condition"
                );

            condition.textContent =
                entry.goal.reached
                    ? (
                        "Objectif atteint"
                    )
                    : (
                        "Sous réserve d’objectif"
                    );

            article.append(condition);
        }

        return article;
    }

    function renderSchedule() {
        if (!elements.scheduleTimeline) {
            return;
        }

        const entries =
            todayProgram();

        const oldEntries =
            elements.scheduleTimeline
                .querySelectorAll(
                    ".dashboard-schedule-entry"
                );

        for (
            const entry of
            oldEntries
        ) {
            entry.remove();
        }

        if (
            elements.scheduleCurrentDate
        ) {
            elements.scheduleCurrentDate
                .textContent =
                entries.length > 0
                    ? formatDate(
                        entries[0].startsAt
                    )
                    : formatDate(
                        new Date()
                    );
        }

        setHidden(
            elements.scheduleEmpty,
            entries.length > 0
        );

        setHidden(
            elements.currentTimeLine,
            entries.length === 0
        );

        if (entries.length === 0) {
            return;
        }

        for (const entry of entries) {
            elements.scheduleTimeline
                .append(
                    createScheduleEntry(
                        entry
                    )
                );
        }

        requestAnimationFrame(
            positionCurrentTimeLine
        );
    }

    function positionCurrentTimeLine() {
        const entries =
            todayProgram();

        if (
            entries.length === 0 ||
            !elements.scheduleTimeline ||
            !elements.currentTimeLine
        ) {
            return;
        }

        const firstStart =
            new Date(
                entries[0].startsAt
            ).getTime();

        const lastEnd =
            new Date(
                entries[
                    entries.length - 1
                ].endsAt
            ).getTime();

        const now =
            Date.now();

        const duration =
            Math.max(
                1,
                lastEnd - firstStart
            );

        const ratio =
            Math.max(
                0,
                Math.min(
                    1,
                    (
                        now - firstStart
                    ) / duration
                )
            );

        const availableHeight =
            Math.max(
                0,
                elements.scheduleTimeline
                    .scrollHeight - 30
            );

        elements.currentTimeLine
            .style.top =
            `${15 + ratio * availableHeight}px`;

        if (
            elements.currentTimeLabel
        ) {
            elements.currentTimeLabel
                .textContent =
                formatTime(
                    new Date()
                );
        }

        elements.currentTimeLine.hidden =
            !(
                now >= firstStart &&
                now <= lastEnd
            );
    }

    /* ======================================================
       INTERACTIONS
       ====================================================== */

    async function loadInteractionQueue() {
        const creatorId =
            currentCreatorId();

        const data =
            await apiFetch(
                (
                    "/api/creator-panel/" +
                    "interactions/queue" +
                    `?creatorId=${encodeURIComponent(
                        creatorId
                    )
                    }&status=all`
                )
            );

        state.queue =
            Array.isArray(data.uploads)
                ? data.uploads
                : [];

        state.queueCounts = {
            waiting:
                numberOrZero(
                    data.counts?.waiting
                ),

            used:
                numberOrZero(
                    data.counts?.used
                ),

            dismissed:
                numberOrZero(
                    data.counts?.dismissed
                ),

            total:
                numberOrZero(
                    data.counts?.total
                )
        };
    }

    function waitingInteractions() {
        return state.queue.filter(
            upload =>
                upload.deliveryStatus ===
                "waiting"
        );
    }

    function interactionParticipantName(
        upload
    ) {
        return (
            upload.participant
                ?.twitchDisplayName ||
            upload.participant
                ?.twitchLogin ||
            "Participant"
        );
    }

    function interactionTitle(upload) {
        return (
            upload.interaction?.title ||
            upload.originalName ||
            "Interaction"
        );
    }

    function renderInteractionCounts() {
        const waiting =
            state.queueCounts.waiting;

        if (
            elements.interactionsCount
        ) {
            elements.interactionsCount
                .textContent =
                formatNumber(waiting);
        }

        if (
            elements.sidebarInteractionsBadge
        ) {
            elements
                .sidebarInteractionsBadge
                .textContent =
                formatNumber(waiting);

            elements
                .sidebarInteractionsBadge
                .hidden =
                waiting === 0;
        }
    }

    function renderOverviewInteractions() {
        if (
            !elements.overviewInteractionsList
        ) {
            return;
        }

        elements.overviewInteractionsList
            .replaceChildren();

        const uploads =
            waitingInteractions()
                .slice(0, 3);

        setHidden(
            elements.overviewInteractionsEmpty,
            uploads.length > 0
        );

        for (const upload of uploads) {
            const item =
                createElement(
                    "article",
                    "dashboard-overview-interaction"
                );

            const icon =
                createElement(
                    "div",
                    "dashboard-overview-interaction-icon"
                );

            icon.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="3"
        ></rect>

        <circle
          cx="9"
          cy="10"
          r="2"
        ></circle>

        <path
          d="m5 18 5-5 3 3 2-2 4 4"
        ></path>
      </svg>
    `;

            const content =
                createElement(
                    "div",
                    "dashboard-overview-interaction-content"
                );

            content.append(
                createElement(
                    "strong",
                    "",
                    interactionTitle(upload)
                ),
                createElement(
                    "span",
                    "",
                    (
                        "Envoyée par " +
                        interactionParticipantName(
                            upload
                        )
                    )
                )
            );

            const button =
                createElement(
                    "button",
                    "",
                    "Consulter"
                );

            button.type = "button";

            button.addEventListener(
                "click",
                () => {
                    openPanel("interactions");

                    window.setTimeout(
                        () => {
                            const publicId =
                                String(
                                    upload.publicId || ""
                                );

                            document
                                .querySelector(
                                    `[data-upload-id="${CSS.escape(publicId)
                                    }"]`
                                )
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center"
                                });
                        },
                        100
                    );
                }
            );

            item.append(
                icon,
                content,
                button
            );

            elements.overviewInteractionsList
                .append(item);
        }
    }

    function createInteractionCard(
        upload
    ) {
        const card =
            createElement(
                "article",
                "dashboard-interaction-card"
            );

        card.dataset.uploadId =
            upload.publicId;

        const preview =
            createElement(
                "div",
                "dashboard-interaction-preview is-hidden"
            );

        const image =
            document.createElement("img");

        image.src =
            upload.fileUrl;

        image.alt =
            "Image envoyée par un participant";

        image.loading =
            "lazy";

        preview.append(image);

        const spoiler =
            createElement(
                "button",
                "dashboard-interaction-spoiler"
            );

        spoiler.type = "button";

        spoiler.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
        ></path>

        <circle
          cx="12"
          cy="12"
          r="2.5"
        ></circle>

        <path
          d="M4 4l16 16"
        ></path>
      </svg>

      <strong>
        Révéler l’image
      </strong>

      <span>
        Attention au spoiler
      </span>
    `;

        const revealed =
            state.revealedUploads.has(
                upload.publicId
            );

        if (revealed) {
            preview.classList.remove(
                "is-hidden"
            );

            spoiler.hidden = true;
        }

        spoiler.addEventListener(
            "click",
            () => {
                state.revealedUploads.add(
                    upload.publicId
                );

                preview.classList.remove(
                    "is-hidden"
                );

                spoiler.hidden = true;
            }
        );

        preview.append(spoiler);

        const information =
            createElement(
                "div",
                "dashboard-interaction-information"
            );

        information.append(
            createElement(
                "h3",
                "",
                interactionTitle(
                    upload
                )
            ),

            createElement(
                "p",
                "",
                (
                    "Envoyée par " +
                    interactionParticipantName(
                        upload
                    )
                )
            )
        );

        const metadata =
            createElement(
                "div",
                "dashboard-interaction-metadata"
            );

        metadata.append(
            createElement(
                "span",
                "",
                formatFileSize(
                    upload.fileSizeBytes
                )
            ),

            createElement(
                "span",
                "",
                formatTime(
                    upload.createdAt
                )
            ),

            createElement(
                "span",
                "",
                (
                    DELIVERY_LABELS[
                    upload.deliveryStatus
                    ] ||
                    upload.deliveryStatus
                )
            )
        );

        information.append(metadata);

        card.append(
            preview,
            information
        );

        if (
            upload.deliveryStatus ===
            "waiting"
        ) {
            const actions =
                createElement(
                    "div",
                    "dashboard-interaction-actions"
                );

            const dismissButton =
                createElement(
                    "button",
                    "dashboard-interaction-dismiss",
                    "Ignorer"
                );

            dismissButton.type =
                "button";

            dismissButton.addEventListener(
                "click",
                () => {
                    void updateInteraction(
                        upload,
                        "dismiss",
                        dismissButton
                    );
                }
            );

            const useButton =
                createElement(
                    "button",
                    "dashboard-interaction-use",
                    "Utiliser"
                );

            useButton.type =
                "button";

            useButton.addEventListener(
                "click",
                () => {
                    void updateInteraction(
                        upload,
                        "use",
                        useButton
                    );
                }
            );

            actions.append(
                dismissButton,
                useButton
            );

            card.append(actions);
        }

        return card;
    }

    function renderInteractions() {
        if (
            !elements.creatorInteractionsList
        ) {
            return;
        }

        elements.creatorInteractionsList
            .replaceChildren();

        const uploads =
            waitingInteractions();

        setHidden(
            elements.creatorInteractionsEmpty,
            uploads.length > 0
        );

        for (const upload of uploads) {
            elements.creatorInteractionsList
                .append(
                    createInteractionCard(
                        upload
                    )
                );
        }

        renderInteractionCounts();
        renderOverviewInteractions();
    }

    async function updateInteraction(
        upload,
        action,
        button
    ) {
        if (
            !upload?.publicId
        ) {
            return;
        }

        const originalText =
            button.textContent;

        button.disabled = true;
        button.textContent =
            action === "use"
                ? "Validation…"
                : "Traitement…";

        try {
            await apiFetch(
                (
                    "/api/creator-panel/" +
                    "interactions/queue/" +
                    encodeURIComponent(
                        upload.publicId
                    ) +
                    `?creatorId=${encodeURIComponent(
                        currentCreatorId()
                    )
                    }`
                ),
                {
                    method: "PUT",

                    body:
                        JSON.stringify({
                            action
                        })
                }
            );

            state.revealedUploads.delete(
                upload.publicId
            );

            await loadInteractionQueue();

            renderInteractions();
            renderStatistics();
            checkReminders();
        } catch (error) {
            window.alert(
                error.message ||
                "Impossible de traiter cette interaction."
            );

            button.disabled = false;
            button.textContent =
                originalText;
        }
    }

    function hideAllInteractionImages() {
        state.revealedUploads.clear();

        renderInteractions();
    }

    /* ======================================================
       ÉQUIPE
       ====================================================== */

    function renderTeam() {
        if (
            !elements.creatorTeamContent
        ) {
            return;
        }

        elements.creatorTeamContent
            .replaceChildren();

        const creatorId =
            currentCreatorId();

        const memberships =
            (
                state.currentUser
                    ?.creatorMemberships || []
            ).filter(
                membership =>
                    Number(
                        membership.creatorId
                    ) === creatorId
            );

        if (
            memberships.length === 0 &&
            isSuperAdmin()
        ) {
            const message =
                createElement(
                    "div",
                    "dashboard-large-empty"
                );

            message.append(
                createElement(
                    "strong",
                    "",
                    "Accès administrateur"
                ),

                createElement(
                    "p",
                    "",
                    (
                        "Tu accèdes à ce tableau " +
                        "en tant qu’administrateur."
                    )
                )
            );

            elements.creatorTeamContent
                .append(message);

            return;
        }

        for (
            const membership of
            memberships
        ) {
            const row =
                createElement(
                    "article",
                    "dashboard-overview-interaction"
                );

            const content =
                createElement(
                    "div",
                    "dashboard-overview-interaction-content"
                );

            content.append(
                createElement(
                    "strong",
                    "",
                    (
                        state.currentUser
                            .twitchDisplayName ||
                        state.currentUser
                            .twitchLogin ||
                        "Ton compte"
                    )
                ),

                createElement(
                    "span",
                    "",
                    getMembershipRoleLabel(
                        membership.memberRole
                    )
                )
            );

            row.append(content);

            elements.creatorTeamContent
                .append(row);
        }
    }

    /* ======================================================
       RAPPELS
       ====================================================== */

    function loadSettings() {
        try {
            const stored =
                JSON.parse(
                    localStorage.getItem(
                        getSettingsKey()
                    ) || "{}"
                );

            state.settings = {
                remindersEnabled:
                    stored.remindersEnabled !==
                    false,

                soundsEnabled:
                    Boolean(
                        stored.soundsEnabled
                    )
            };
        } catch {
            state.settings = {
                remindersEnabled: true,
                soundsEnabled: false
            };
        }

        if (elements.remindersEnabled) {
            elements.remindersEnabled.checked =
                state.settings
                    .remindersEnabled;
        }

        if (
            elements.reminderSoundsEnabled
        ) {
            elements
                .reminderSoundsEnabled
                .checked =
                state.settings
                    .soundsEnabled;
        }
    }

    function saveSettings() {
        state.settings = {
            remindersEnabled:
                Boolean(
                    elements.remindersEnabled
                        ?.checked
                ),

            soundsEnabled:
                Boolean(
                    elements
                        .reminderSoundsEnabled
                        ?.checked
                )
        };

        localStorage.setItem(
            getSettingsKey(),
            JSON.stringify(
                state.settings
            )
        );

        if (
            !state.settings
                .remindersEnabled
        ) {
            dismissReminder();
        }
    }

    function reminderWasDismissed(
        key
    ) {
        return (
            sessionStorage.getItem(
                `jevent-reminder-${key}`
            ) === "dismissed"
        );
    }

    let reminderAudioContext = null;

    function playReminderSound() {
        if (!state.settings.soundsEnabled) {
            return;
        }

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContextClass) {
            return;
        }

        try {
            reminderAudioContext ??=
                new AudioContextClass();

            const play = () => {
                const oscillator =
                    reminderAudioContext
                        .createOscillator();

                const gain =
                    reminderAudioContext
                        .createGain();

                const now =
                    reminderAudioContext
                        .currentTime;

                oscillator.type = "sine";

                oscillator.frequency
                    .setValueAtTime(
                        660,
                        now
                    );

                oscillator.frequency
                    .setValueAtTime(
                        880,
                        now + 0.12
                    );

                gain.gain.setValueAtTime(
                    0.0001,
                    now
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.12,
                    now + 0.02
                );

                gain.gain.exponentialRampToValueAtTime(
                    0.0001,
                    now + 0.3
                );

                oscillator.connect(gain);
                gain.connect(
                    reminderAudioContext.destination
                );

                oscillator.start(now);
                oscillator.stop(now + 0.32);
            };

            if (
                reminderAudioContext.state ===
                "suspended"
            ) {
                void reminderAudioContext
                    .resume()
                    .then(play);
            } else {
                play();
            }
        } catch (error) {
            console.warn(
                "Impossible de jouer le rappel sonore :",
                error
            );
        }
    }

    function getCurrentRaisedCents() {
        if (
            state.creator?.raisedAvailable
        ) {
            return numberOrZero(
                state.creator.raisedCents
            );
        }

        const overview =
            getOverviewStatistics();

        if (
            overview.raisedCents === null ||
            overview.raisedCents === undefined
        ) {
            return null;
        }

        return numberOrZero(
            overview.raisedCents
        );
    }

    function getUpcomingGoalReminder() {
        const raisedCents =
            getCurrentRaisedCents();

        if (raisedCents === null) {
            return null;
        }

        for (const entry of todayProgram()) {
            const goal = entry.goal;

            if (!goal || goal.reached) {
                continue;
            }

            const targetCents =
                numberOrZero(
                    goal.thresholdCents ??
                    goal.targetAmountCents ??
                    goal.targetCents
                );

            if (targetCents <= 0) {
                continue;
            }

            const percentage =
                raisedCents / targetCents;

            if (
                percentage >= 0.8 &&
                raisedCents < targetCents
            ) {
                return {
                    entry,
                    goal,
                    targetCents,
                    remainingCents:
                        targetCents - raisedCents
                };
            }
        }

        return null;
    }

    function showReminder({
        key,
        type,
        title,
        message
    }) {
        if (
            !state.settings
                .remindersEnabled ||
            reminderWasDismissed(key)
        ) {
            return;
        }

        if (
            elements.reminderType
        ) {
            elements.reminderType
                .textContent =
                type;
        }

        if (
            elements.reminderTitle
        ) {
            elements.reminderTitle
                .textContent =
                title;
        }

        if (
            elements.reminderMessage
        ) {
            elements.reminderMessage
                .textContent =
                message;
        }

        elements.reminder.dataset
            .reminderKey =
            key;

        elements.reminder.hidden =
            false;

        playReminderSound();

        window.clearTimeout(
            state.reminderTimer
        );

        state.reminderTimer =
            window.setTimeout(
                dismissReminder,
                REMINDER_DURATION_MS
            );
    }

    function dismissReminder() {
        if (!elements.reminder) {
            return;
        }

        const key =
            elements.reminder.dataset
                .reminderKey;

        if (key) {
            sessionStorage.setItem(
                `jevent-reminder-${key}`,
                "dismissed"
            );
        }

        elements.reminder.hidden =
            true;

        window.clearTimeout(
            state.reminderTimer
        );
    }

    function checkReminders() {
        if (
            !state.settings.remindersEnabled
        ) {
            return;
        }

        const now = Date.now();

        /*
         * Priorité 1 :
         * prochain changement de programme.
         */
        const nextEntry =
            todayProgram().find(
                entry =>
                    new Date(
                        entry.startsAt
                    ).getTime() > now
            );

        if (nextEntry) {
            const start =
                new Date(
                    nextEntry.startsAt
                ).getTime();

            const remaining =
                start - now;

            if (
                remaining > 0 &&
                remaining <= 10 * 60 * 1000
            ) {
                const minutes =
                    Math.max(
                        1,
                        Math.ceil(
                            remaining / 60000
                        )
                    );

                showReminder({
                    key:
                        `program-${nextEntry.publicId ||
                        nextEntry.id
                        }`,

                    type: "Programme",

                    title:
                        "Changement de créneau imminent",

                    message:
                        `${nextEntry.title} commence ` +
                        `dans ${minutes} minute` +
                        (
                            minutes > 1
                                ? "s"
                                : ""
                        ) +
                        "."
                });

                return;
            }
        }

        /*
         * Priorité 2 :
         * objectif bientôt atteint.
         */
        const goalReminder =
            getUpcomingGoalReminder();

        if (goalReminder) {
            const {
                goal,
                entry,
                remainingCents
            } = goalReminder;

            showReminder({
                key:
                    `goal-near-${goal.publicId ||
                    entry.publicId ||
                    entry.id
                    }`,

                type:
                    "Objectif de dons",

                title:
                    "Objectif bientôt atteint",

                message:
                    `${formatMoney(
                        remainingCents
                    )} restent avant ` +
                    `« ${goal.title || entry.title} ». ` +
                    "Le programme pourrait changer automatiquement."
            });

            return;
        }

        /*
         * Priorité 3 :
         * interactions à utiliser.
         */
        if (
            state.queueCounts.waiting > 0
        ) {
            showReminder({
                key:
                    "interactions-" +
                    state.queueCounts.waiting,

                type:
                    "Interactions",

                title:
                    `${state.queueCounts.waiting} ` +
                    "interaction" +
                    (
                        state.queueCounts.waiting > 1
                            ? "s"
                            : ""
                    ) +
                    " en attente",

                message:
                    "Des participations acceptées attendent d’être utilisées."
            });
        }
    }

    /* ======================================================
   TOMBOLA
   ====================================================== */

    const RAFFLE_STATUS_LABELS = {
        countdown:
            "Démarrage prochain",

        active:
            "En cours",

        drawing:
            "Prête pour le tirage",

        completed:
            "Terminée",

        cancelled:
            "Annulée"
    };

    const RAFFLE_METHOD_LABELS = {
        ticket_per_euro:
            "1 € = 1 ticket",

        highest_donor:
            "Plus gros donateur"
    };

    function setRaffleMessage(
        message = "",
        type = ""
    ) {
        if (
            !elements.raffleFormMessage
        ) {
            return;
        }

        elements.raffleFormMessage
            .textContent =
            message;

        elements.raffleFormMessage
            .className =
            "dashboard-form-message";

        if (type) {
            elements.raffleFormMessage
                .classList.add(
                    `is-${type}`
                );
        }
    }

    async function loadRaffles() {
        const creatorId =
            currentCreatorId();

        const data =
            await apiFetch(
                (
                    "/api/creator-panel/raffles" +
                    `?creatorId=${encodeURIComponent(
                        creatorId
                    )
                    }`
                )
            );

        state.raffles =
            Array.isArray(data.raffles)
                ? data.raffles
                : [];

        state.activeRaffle =
            data.activeRaffle || null;
    }

    function openRaffleDialog() {
        if (
            !elements.raffleDialog
        ) {
            return;
        }

        elements.raffleForm
            ?.reset();

        setHidden(
            elements
                .customRaffleDurationField,
            true
        );

        setHidden(
            elements.raffleCountdownField,
            true
        );

        setRaffleMessage();

        elements.raffleDialog
            .showModal();

        elements.raffleTitle
            ?.focus();
    }

    function closeRaffleDialog() {
        if (
            elements.raffleDialog?.open
        ) {
            elements.raffleDialog.close();
        }

        setRaffleMessage();
    }

    function selectedRadioValue(
        name
    ) {
        return document.querySelector(
            `input[name="${name}"]:checked`
        )?.value || "";
    }

    function updateRaffleFields() {
        const customDuration =
            selectedRadioValue(
                "raffleDurationType"
            ) === "custom";

        const countdown =
            selectedRadioValue(
                "raffleStartType"
            ) === "countdown";

        setHidden(
            elements
                .customRaffleDurationField,
            !customDuration
        );

        setHidden(
            elements.raffleCountdownField,
            !countdown
        );
    }

    function formatRaffleTimer(
        milliseconds
    ) {
        const totalSeconds =
            Math.max(
                0,
                Math.ceil(
                    milliseconds / 1000
                )
            );

        const hours =
            Math.floor(
                totalSeconds / 3600
            );

        const minutes =
            Math.floor(
                (
                    totalSeconds % 3600
                ) / 60
            );

        const seconds =
            totalSeconds % 60;

        if (hours > 0) {
            return (
                `${String(hours).padStart(2, "0")}:` +
                `${String(minutes).padStart(2, "0")}:` +
                `${String(seconds).padStart(2, "0")}`
            );
        }

        return (
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`
        );
    }

    async function refreshRaffleOnly() {
        if (
            state.raffleRefreshPending
        ) {
            return;
        }

        state.raffleRefreshPending =
            true;

        try {
            await loadRaffles();
            renderRaffle();
        } catch (error) {
            console.error(
                "Impossible d’actualiser la tombola :",
                error
            );
        } finally {
            state.raffleRefreshPending =
                false;
        }
    }

    function updateRaffleTimer() {
        const raffle =
            state.activeRaffle;

        if (
            !raffle ||
            !elements.activeRaffleTimer
        ) {
            return;
        }

        if (
            raffle.status === "drawing"
        ) {
            elements.activeRaffleTimer
                .textContent =
                "Tirage";

            return;
        }

        const target =
            raffle.status === "countdown"
                ? new Date(
                    raffle.startsAt
                ).getTime()
                : new Date(
                    raffle.endsAt
                ).getTime();

        if (
            !Number.isFinite(target)
        ) {
            elements.activeRaffleTimer
                .textContent =
                "—";

            return;
        }

        const remaining =
            target - Date.now();

        elements.activeRaffleTimer
            .textContent =
            formatRaffleTimer(
                remaining
            );

        if (remaining <= 0) {
            void refreshRaffleOnly();
        }
    }

    function startRaffleTimer() {
        window.clearInterval(
            state.raffleTimer
        );

        state.raffleTimer = null;

        if (!state.activeRaffle) {
            return;
        }

        updateRaffleTimer();

        state.raffleTimer =
            window.setInterval(
                updateRaffleTimer,
                1000
            );
    }

    function renderRaffleHistory() {
        if (!elements.rafflesPanelContent) {
            return;
        }

        elements.rafflesPanelContent
            .replaceChildren();

        if (state.raffles.length === 0) {
            const empty =
                createElement(
                    "div",
                    "dashboard-large-empty"
                );

            empty.append(
                createElement(
                    "strong",
                    "",
                    "Aucune tombola"
                ),
                createElement(
                    "p",
                    "",
                    "Les tombolas créées apparaîtront ici."
                )
            );

            elements.rafflesPanelContent
                .append(empty);

            return;
        }

        const list =
            createElement(
                "div",
                "dashboard-overview-interactions"
            );

        for (const raffle of state.raffles) {
            const row =
                createElement(
                    "article",
                    "dashboard-overview-interaction"
                );

            const content =
                createElement(
                    "div",
                    "dashboard-overview-interaction-content"
                );

            const winner =
                raffle.winner
                    ?.twitchDisplayName ||
                raffle.winner
                    ?.donorName ||
                raffle.winner
                    ?.twitchLogin ||
                null;

            content.append(
                createElement(
                    "strong",
                    "",
                    raffle.title || "Tombola"
                ),
                createElement(
                    "span",
                    "",
                    (
                        `${RAFFLE_STATUS_LABELS[
                        raffle.status
                        ] || raffle.status
                        } · ` +
                        `${RAFFLE_METHOD_LABELS[
                        raffle.method
                        ] || raffle.method
                        } · ` +
                        `${formatNumber(
                            raffle.participantsCount
                        )} participant(s)`
                    )
                )
            );

            if (
                raffle.status === "completed" &&
                winner
            ) {
                content.append(
                    createElement(
                        "span",
                        "dashboard-raffle-winner",
                        `Gagnant : ${winner}`
                    )
                );
            }

            const status =
                createElement(
                    "span",
                    "dashboard-interaction-metadata"
                );

            status.append(
                createElement(
                    "span",
                    "",
                    formatMoney(
                        raffle.amountCents
                    )
                )
            );

            row.append(
                content,
                status
            );

            list.append(row);
        }

        elements.rafflesPanelContent
            .append(list);
    }

    function renderRaffle() {
        const raffle =
            state.activeRaffle;

        setHidden(
            elements.activeRaffleCard,
            !raffle
        );

        if (!raffle) {
            if (
                elements.raffleParticipants
            ) {
                elements.raffleParticipants
                    .textContent =
                    "—";
            }

            if (
                elements.raffleStatus
            ) {
                elements.raffleStatus
                    .textContent =
                    "Aucune tombola active";
            }

            setHidden(
                elements.sidebarRaffleBadge,
                true
            );

            window.clearInterval(
                state.raffleTimer
            );

            state.raffleTimer = null;

            renderRaffleHistory();

            return;
        }

        if (
            elements.activeRaffleTitle
        ) {
            elements.activeRaffleTitle
                .textContent =
                raffle.title;
        }

        if (
            elements.activeRaffleDescription
        ) {
            elements.activeRaffleDescription
                .textContent =
                raffle.description ||
                RAFFLE_METHOD_LABELS[
                raffle.method
                ] ||
                "";
        }

        if (
            elements.activeRaffleEntries
        ) {
            elements.activeRaffleEntries
                .textContent =
                raffle.method ===
                    "ticket_per_euro"
                    ? formatNumber(
                        raffle.ticketCount
                    )
                    : formatNumber(
                        raffle.donationsCount
                    );
        }

        if (
            elements.activeRaffleUsers
        ) {
            elements.activeRaffleUsers
                .textContent =
                formatNumber(
                    raffle.participantsCount
                );
        }

        if (
            elements.activeRaffleAmount
        ) {
            elements.activeRaffleAmount
                .textContent =
                formatMoney(
                    raffle.amountCents
                );
        }

        if (
            elements.raffleParticipants
        ) {
            elements.raffleParticipants
                .textContent =
                formatNumber(
                    raffle.participantsCount
                );
        }

        if (
            elements.raffleStatus
        ) {
            elements.raffleStatus
                .textContent =
                RAFFLE_STATUS_LABELS[
                raffle.status
                ] || raffle.status;
        }

        if (
            elements.sidebarRaffleBadge
        ) {
            elements.sidebarRaffleBadge
                .textContent =
                "1";

            elements.sidebarRaffleBadge
                .hidden = false;
        }

        if (
            elements.stopRaffleButton
        ) {
            elements.stopRaffleButton
                .textContent =
                "Annuler la tombola";
        }

        if (
            elements.drawRaffleButton
        ) {
            elements.drawRaffleButton
                .textContent =
                raffle.status === "drawing"
                    ? "Tirer le gagnant"
                    : "Tirer maintenant";
        }

        startRaffleTimer();
        renderRaffleHistory();
    }

    async function submitRaffle(
        event
    ) {
        event.preventDefault();

        const title =
            elements.raffleTitle
                ?.value
                .trim();

        if (!title) {
            setRaffleMessage(
                "Indique le lot à gagner.",
                "error"
            );

            elements.raffleTitle
                ?.focus();

            return;
        }

        const durationType =
            selectedRadioValue(
                "raffleDurationType"
            );

        const durationMinutes =
            durationType ===
                "five_minutes"
                ? 5
                : numberOrZero(
                    elements
                        .customRaffleDuration
                        ?.value
                );

        const startType =
            selectedRadioValue(
                "raffleStartType"
            );

        const countdownMinutes =
            startType === "countdown"
                ? numberOrZero(
                    elements
                        .raffleCountdownMinutes
                        ?.value
                )
                : 0;

        if (
            durationMinutes < 1 ||
            durationMinutes > 1440
        ) {
            setRaffleMessage(
                "La durée doit être comprise entre 1 et 1 440 minutes.",
                "error"
            );

            return;
        }

        if (
            countdownMinutes < 0 ||
            countdownMinutes > 60
        ) {
            setRaffleMessage(
                "Le compte à rebours doit être compris entre 0 et 60 minutes.",
                "error"
            );

            return;
        }

        if (
            elements.submitRaffleButton
        ) {
            elements.submitRaffleButton
                .disabled = true;

            elements.submitRaffleButton
                .textContent =
                "Lancement…";
        }

        setRaffleMessage(
            "Création de la tombola…"
        );

        try {
            const data =
                await apiFetch(
                    (
                        "/api/creator-panel/raffles" +
                        `?creatorId=${encodeURIComponent(
                            currentCreatorId()
                        )
                        }`
                    ),
                    {
                        method: "POST",

                        body:
                            JSON.stringify({
                                title,

                                description:
                                    elements
                                        .raffleDescription
                                        ?.value
                                        .trim() || "",

                                method:
                                    selectedRadioValue(
                                        "raffleMethod"
                                    ),

                                drawMode:
                                    selectedRadioValue(
                                        "raffleDrawMode"
                                    ) || "manual",

                                durationMinutes,
                                countdownMinutes
                            })
                    }
                );

            state.activeRaffle =
                data.raffle;

            state.raffles.unshift(
                data.raffle
            );

            closeRaffleDialog();
            renderRaffle();

            openPanel("overview");

            showReminder({
                key:
                    `raffle-${data.raffle.publicId
                    }`,

                type:
                    "Tombola",

                title:
                    countdownMinutes > 0
                        ? "Tombola programmée"
                        : "Tombola lancée",

                message:
                    countdownMinutes > 0
                        ? (
                            `La tombola commencera dans ` +
                            `${countdownMinutes} minute(s).`
                        )
                        : (
                            `La tombola est ouverte pendant ` +
                            `${durationMinutes} minute(s).`
                        )
            });
        } catch (error) {
            setRaffleMessage(
                error.message ||
                "Impossible de lancer la tombola.",
                "error"
            );
        } finally {
            if (
                elements.submitRaffleButton
            ) {
                elements.submitRaffleButton
                    .disabled = false;

                elements.submitRaffleButton
                    .textContent =
                    "Lancer la tombola";
            }
        }
    }

    async function cancelActiveRaffle() {
        const raffle =
            state.activeRaffle;

        if (!raffle) {
            return;
        }

        const confirmed =
            window.confirm(
                "Annuler définitivement cette tombola ?"
            );

        if (!confirmed) {
            return;
        }

        elements.stopRaffleButton
            .disabled = true;

        try {
            await apiFetch(
                (
                    "/api/creator-panel/raffles/" +
                    encodeURIComponent(
                        raffle.publicId
                    ) +
                    "/cancel" +
                    `?creatorId=${encodeURIComponent(
                        currentCreatorId()
                    )
                    }`
                ),
                {
                    method: "POST"
                }
            );

            await loadRaffles();
            renderRaffle();
        } catch (error) {
            window.alert(
                error.message ||
                "Impossible d’annuler la tombola."
            );
        } finally {
            elements.stopRaffleButton
                .disabled = false;
        }
    }

    async function drawActiveRaffle() {
        const raffle =
            state.activeRaffle;

        if (!raffle) {
            return;
        }

        if (
            raffle.status !== "drawing"
        ) {
            const confirmed =
                window.confirm(
                    "Le tirage terminera immédiatement la tombola. Continuer ?"
                );

            if (!confirmed) {
                return;
            }
        }

        elements.drawRaffleButton
            .disabled = true;

        elements.drawRaffleButton
            .textContent =
            "Tirage…";

        try {
            const data =
                await apiFetch(
                    (
                        "/api/creator-panel/raffles/" +
                        encodeURIComponent(
                            raffle.publicId
                        ) +
                        "/draw" +
                        `?creatorId=${encodeURIComponent(
                            currentCreatorId()
                        )
                        }`
                    ),
                    {
                        method: "POST"
                    }
                );

            const completedRaffle =
                data.raffle;

            state.activeRaffle = null;

            state.raffles =
                state.raffles.map(
                    item =>
                        item.publicId ===
                            completedRaffle.publicId
                            ? completedRaffle
                            : item
                );

            renderRaffle();

            const winner =
                completedRaffle.winner
                    ?.twitchDisplayName ||
                completedRaffle.winner
                    ?.donorName ||
                completedRaffle.winner
                    ?.twitchLogin ||
                "Participant inconnu";

            window.alert(
                `Le gagnant est : ${winner}`
            );
        } catch (error) {
            window.alert(
                error.message ||
                "Impossible de tirer le gagnant."
            );
        } finally {
            elements.drawRaffleButton
                .disabled = false;

            elements.drawRaffleButton
                .textContent =
                "Tirer le gagnant";
        }
    }

    /* ======================================================
       ACTUALISATION
       ====================================================== */

    function updateLastRefresh() {
        if (
            !elements.dashboardLastUpdate
        ) {
            return;
        }

        elements.dashboardLastUpdate
            .textContent =
            (
                "Actualisé à " +
                formatTime(
                    new Date()
                )
            );
    }

    async function loadDashboardData() {
        await Promise.all([
            loadProgram(),
            loadInteractionQueue(),
            loadStatistics(),
            loadRaffles()
        ]);

        renderCreator();
        renderStatistics();
        renderSchedule();
        renderInteractions();
        renderRaffle();
        renderTeam();

        updateLastRefresh();
        checkReminders();
    }

    async function refreshDashboard() {
        if (state.refreshing) {
            return;
        }

        state.refreshing = true;

        if (
            elements.refreshDashboardButton
        ) {
            elements
                .refreshDashboardButton
                .disabled = true;
        }

        if (
            elements.refreshInteractionsButton
        ) {
            elements
                .refreshInteractionsButton
                .disabled = true;

            elements
                .refreshInteractionsButton
                .textContent =
                "Actualisation…";
        }

        try {
            await loadCreator(
                currentCreatorId()
            );

            await loadDashboardData();
        } catch (error) {
            console.error(
                "Actualisation impossible :",
                error
            );
        } finally {
            state.refreshing = false;

            if (
                elements.refreshDashboardButton
            ) {
                elements
                    .refreshDashboardButton
                    .disabled = false;
            }

            if (
                elements.refreshInteractionsButton
            ) {
                elements
                    .refreshInteractionsButton
                    .disabled = false;

                elements
                    .refreshInteractionsButton
                    .textContent =
                    "Actualiser";
            }
        }
    }

    function startAutomaticRefresh() {
        window.clearInterval(
            state.refreshTimer
        );

        window.clearInterval(
            state.raffleDataTimer
        );

        window.clearInterval(
            state.clockTimer
        );

        state.refreshTimer =
            window.setInterval(
                refreshDashboard,
                REFRESH_INTERVAL_MS
            );

        state.clockTimer =
            window.setInterval(
                () => {
                    renderSchedule();
                    checkReminders();
                },
                30 * 1000
            );

        state.raffleDataTimer =
            window.setInterval(
                () => {
                    if (
                        !document.hidden &&
                        state.activeRaffle
                    ) {
                        void refreshRaffleOnly();
                    }
                },
                10 * 1000
            );
    }

    /* ======================================================
       CHANGEMENT DE CRÉATEUR ADMIN
       ====================================================== */

    async function changeAdminCreator() {
        const creatorId =
            numberOrZero(
                elements
                    .adminCreatorSelector
                    ?.value
            );

        if (!creatorId) {
            return;
        }

        showLoading();

        try {
            state.revealedUploads.clear();

            await loadCreator(
                creatorId
            );

            loadSettings();

            await loadDashboardData();

            renderAdminCreatorSelector();

            showApplication();
        } catch (error) {
            showError(error);
        }
    }

    /* ======================================================
       INITIALISATION
       ====================================================== */

    const DASHBOARD_THEME_KEY =
        "jevent-creator-dashboard-theme";

    function getInitialTheme() {
        const savedTheme =
            localStorage.getItem(
                DASHBOARD_THEME_KEY
            );

        if (savedTheme === "dark") {
            return true;
        }

        if (savedTheme === "light") {
            return false;
        }

        return Boolean(
            window.matchMedia?.(
                "(prefers-color-scheme: dark)"
            ).matches
        );
    }

    function applyDashboardTheme(
        darkMode,
        save = true
    ) {
        state.darkMode =
            Boolean(darkMode);

        document.documentElement.dataset
            .dashboardTheme =
            state.darkMode
                ? "dark"
                : "light";

        if (elements.darkModeEnabled) {
            elements.darkModeEnabled.checked =
                state.darkMode;
        }

        if (elements.themeToggleButton) {
            const label =
                state.darkMode
                    ? "Activer le mode clair"
                    : "Activer le mode sombre";

            elements.themeToggleButton.title =
                label;

            elements.themeToggleButton.setAttribute(
                "aria-label",
                label
            );

            elements.themeToggleButton.setAttribute(
                "aria-pressed",
                String(state.darkMode)
            );
        }

        if (save) {
            localStorage.setItem(
                DASHBOARD_THEME_KEY,
                state.darkMode
                    ? "dark"
                    : "light"
            );
        }
    }

    async function startApplication() {
        if (state.loading) {
            return;
        }

        state.loading = true;

        showLoading();

        try {
            await loadCurrentUser();

            await loadAdminCreators();

            const creatorId =
                resolveInitialCreatorId();

            await loadCreator(
                creatorId
            );

            loadSettings();

            renderAdminCreatorSelector();

            await loadDashboardData();

            openPanel(
                location.hash,
                {
                    updateHash: false
                }
            );

            showApplication();

            startAutomaticRefresh();
        } catch (error) {
            console.error(
                "Impossible d’ouvrir le tableau de bord :",
                error
            );

            showError(error);
        } finally {
            state.loading = false;
        }
    }

    /* ======================================================
       ÉVÉNEMENTS
       ====================================================== */

    for (
        const button of
        elements.navigationButtons
    ) {
        button.addEventListener(
            "click",
            () => {
                openPanel(
                    button.dataset
                        .dashboardPanel
                );
            }
        );
    }

    for (
        const button of
        elements.panelButtons
    ) {
        button.addEventListener(
            "click",
            () => {
                openPanel(
                    button.dataset
                        .openDashboardPanel
                );
            }
        );
    }

    onSafe(
        elements.stopRaffleButton,
        "click",
        cancelActiveRaffle
    );

    onSafe(
        elements.drawRaffleButton,
        "click",
        drawActiveRaffle
    );

    onSafe(
        elements.openSidebarButton,
        "click",
        openSidebar
    );

    onSafe(
        elements.closeSidebarButton,
        "click",
        closeSidebar
    );

    onSafe(
        elements.sidebarBackdrop,
        "click",
        closeSidebar
    );

    onSafe(
        elements.refreshDashboardButton,
        "click",
        refreshDashboard
    );

    onSafe(
        elements.refreshInteractionsButton,
        "click",
        async () => {
            elements
                .refreshInteractionsButton
                .disabled = true;

            try {
                await loadInteractionQueue();

                renderInteractions();
                renderStatistics();
            } catch (error) {
                window.alert(
                    error.message ||
                    "Impossible d’actualiser les interactions."
                );
            } finally {
                elements
                    .refreshInteractionsButton
                    .disabled = false;

                elements
                    .refreshInteractionsButton
                    .textContent =
                    "Actualiser";
            }
        }
    );

    onSafe(
        elements.hideAllImagesButton,
        "click",
        hideAllInteractionImages
    );

    onSafe(
        elements.dismissReminderButton,
        "click",
        dismissReminder
    );

    onSafe(
        elements.remindersEnabled,
        "change",
        saveSettings
    );

    onSafe(
        elements.reminderSoundsEnabled,
        "change",
        saveSettings
    );

    onSafe(
        elements.adminCreatorSelector,
        "change",
        changeAdminCreator
    );

    onSafe(
        elements.quickStartRaffleButton,
        "click",
        openRaffleDialog
    );

    onSafe(
        elements.createRaffleButton,
        "click",
        openRaffleDialog
    );

    onSafe(
        elements.closeRaffleDialogButton,
        "click",
        closeRaffleDialog
    );

    onSafe(
        elements.cancelRaffleButton,
        "click",
        closeRaffleDialog
    );

    onSafe(
        elements.raffleForm,
        "submit",
        submitRaffle
    );

    for (
        const input of
        $$(
            'input[name="raffleDurationType"], ' +
            'input[name="raffleStartType"]'
        )
    ) {
        input.addEventListener(
            "change",
            updateRaffleFields
        );
    }

    onSafe(
        elements.raffleDialog,
        "cancel",
        event => {
            event.preventDefault();

            closeRaffleDialog();
        }
    );

    onSafe(
        elements.raffleDialog,
        "click",
        event => {
            if (
                event.target ===
                elements.raffleDialog
            ) {
                closeRaffleDialog();
            }
        }
    );

    onSafe(
        elements.themeToggleButton,
        "click",
        () => {
            applyDashboardTheme(
                !state.darkMode
            );
        }
    );

    onSafe(
        elements.darkModeEnabled,
        "change",
        () => {
            applyDashboardTheme(
                elements.darkModeEnabled.checked
            );
        }
    );

    window.addEventListener(
        "keydown",
        event => {
            if (event.key === "Escape") {
                closeSidebar();
            }
        }
    );

    window.addEventListener(
        "resize",
        () => {
            if (window.innerWidth > 900) {
                closeSidebar();
            }
        }
    );

    window.addEventListener(
        "hashchange",
        () => {
            openPanel(
                location.hash,
                {
                    updateHash: false
                }
            );
        }
    );

    window.addEventListener(
        "resize",
        () => {
            if (
                window.innerWidth > 900
            ) {
                closeSidebar();
            }

            requestAnimationFrame(
                positionCurrentTimeLine
            );
        }
    );

    window.addEventListener(
        "beforeunload",
        () => {
            window.clearInterval(
                state.refreshTimer
            );

            window.clearInterval(
                state.clockTimer
            );

            window.clearTimeout(
                state.reminderTimer
            );

            window.clearInterval(
                state.raffleTimer
            );
        }
    );

    applyDashboardTheme(
        getInitialTheme(),
        false
    );

    startApplication();
})();