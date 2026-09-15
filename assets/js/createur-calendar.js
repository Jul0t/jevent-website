(() => {
    "use strict";

    const TIMEZONE = "Europe/Paris";
    const DAY_MINUTES = 24 * 60;
    const PIXELS_PER_MINUTE = 1;

    let creator = null;
    let programEntries = [];
    let activeDateKey = null;

    const datePartsFormatter =
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

    function getElements() {
        return {
            calendar:
                document.querySelector(
                    "#programCalendar"
                ),

            empty:
                document.querySelector(
                    "#programEmpty"
                ),

            editButton:
                document.querySelector(
                    "#editProgramButton"
                ),

            dialog:
                document.querySelector(
                    "#programDetailsDialog"
                ),

            dialogTitle:
                document.querySelector(
                    "#programDetailsTitle"
                ),

            dialogContent:
                document.querySelector(
                    "#programDetailsContent"
                ),

            closeDialog:
                document.querySelector(
                    "#closeProgramDetails"
                )
        };
    }

    function localParts(value) {
        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        const result = {};

        for (
            const part of
            datePartsFormatter.formatToParts(date)
        ) {
            if (part.type !== "literal") {
                result[part.type] = part.value;
            }
        }

        return {
            date,
            dateKey:
                `${result.year}-${result.month}-${result.day}`,

            minute:
                Number(result.hour) * 60 +
                Number(result.minute)
        };
    }

    function addDays(dateKey, amount) {
        const date =
            new Date(`${dateKey}T12:00:00Z`);

        date.setUTCDate(
            date.getUTCDate() + amount
        );

        return date
            .toISOString()
            .slice(0, 10);
    }

    function listDates(first, last) {
        const dates = [];
        let current = first;

        while (current <= last) {
            dates.push(current);
            current = addDays(current, 1);
        }

        return dates;
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

    function formatDay(dateKey) {
        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                weekday: "short",
                day: "numeric",
                month: "short",
                timeZone: "UTC"
            }
        ).format(
            new Date(`${dateKey}T12:00:00Z`)
        );
    }

    function formatFullDate(value) {
        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: TIMEZONE
            }
        ).format(new Date(value));
    }

    function formatTime(value) {
        return new Intl.DateTimeFormat(
            "fr-FR",
            {
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23",
                timeZone: TIMEZONE
            }
        ).format(new Date(value));
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
                maximumFractionDigits:
                    Number(cents) % 100 === 0
                        ? 0
                        : 2
            }
        ).format(
            Number(cents || 0) / 100
        );
    }

    function getPrimaryCreator(entry) {
        return (
            entry.primaryCreator ??
            (entry.participants ?? []).find(
                participant =>
                    participant.primary
            ) ??
            null
        );
    }

    function belongsToCreator(entry) {
        const primary =
            getPrimaryCreator(entry);

        const primaryId =
            primary?.id ??
            primary?.creatorId ??
            null;

        return (
            Number(primaryId) ===
            Number(creator.id)
        );
    }

    function makeSegments(
        entry,
        dates
    ) {
        const start =
            localParts(entry.startsAt);

        const end =
            localParts(entry.endsAt);

        if (!start || !end) {
            return [];
        }

        const effectiveEnd =
            localParts(
                new Date(
                    Math.max(
                        start.date.getTime(),
                        end.date.getTime() - 1
                    )
                ).toISOString()
            );

        return dates.flatMap(dateKey => {
            if (
                dateKey < start.dateKey ||
                dateKey > effectiveEnd.dateKey
            ) {
                return [];
            }

            const startMinute =
                dateKey === start.dateKey
                    ? start.minute
                    : 0;

            const endMinute =
                dateKey === end.dateKey
                    ? end.minute
                    : DAY_MINUTES;

            if (endMinute <= startMinute) {
                return [];
            }

            return [{
                entry,
                start: startMinute,
                end: endMinute
            }];
        });
    }

    function createOverlapGroups(segments) {
        const groups = [];
        let group = [];
        let groupEnd = -1;

        for (const segment of segments) {
            if (
                group.length > 0 &&
                segment.start >= groupEnd
            ) {
                groups.push(group);
                group = [];
                groupEnd = -1;
            }

            group.push(segment);

            groupEnd = Math.max(
                groupEnd,
                segment.end
            );
        }

        if (group.length > 0) {
            groups.push(group);
        }

        return groups;
    }

    function assignLanes(group) {
        const laneEnds = [];

        for (const segment of group) {
            let lane =
                laneEnds.findIndex(
                    end => end <= segment.start
                );

            if (lane < 0) {
                lane = laneEnds.length;
            }

            laneEnds[lane] = segment.end;
            segment.lane = lane;
        }

        return Math.max(1, laneEnds.length);
    }

    function createGoalIcon(reached) {
        const icon = document.createElement("span");

        icon.className = "calendar-goal-icon";
        icon.setAttribute("aria-hidden", "true");

        icon.innerHTML = reached
            ? `
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="m8 12 2.5 2.5L16 9"></path>
      </svg>
    `
            : `
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9"></circle>
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3"></path>
      </svg>
    `;

        return icon;
    }


    function createEventButton(
        segment,
        visibleStart,
        laneCount
    ) {
        const { entry, start, end, lane } =
            segment;

        const button =
            document.createElement("button");

        button.type = "button";
        button.className =
            "public-calendar-event";

        if (entry.status === "cancelled") {
            button.classList.add(
                "is-cancelled"
            );
        }

        button.style.top =
            `${(
                start - visibleStart
            ) * PIXELS_PER_MINUTE}px`;

        button.style.height =
            `${Math.max(
                22,
                (end - start) *
                PIXELS_PER_MINUTE
            )}px`;

        button.style.left =
            `calc(${lane * 100 / laneCount
            }% + 3px)`;

        button.style.width =
            `calc(${100 / laneCount
            }% - 6px)`;

        const title =
            document.createElement("strong");

        title.className =
            "public-calendar-event-title";

        title.textContent =
            entry.title || "Activité";

        const time =
            document.createElement("span");

        time.className =
            "public-calendar-event-time";

        time.textContent =
            `${formatClock(start)} – ` +
            `${formatClock(end)}`;

        button.append(title, time);

        if (
            entry.goal &&
            entry.goalCondition !== "not_reached"
        ) {
            const goal =
                document.createElement("span");

            goal.className =
                "public-calendar-event-goal";

            if (entry.goal.reached) {
                goal.classList.add("is-reached");
            }

            goal.append(
                createGoalIcon(entry.goal.reached),
                document.createTextNode(
                    entry.goal.reached
                        ? "Objectif atteint"
                        : "Sous réserve d’objectif atteint"
                )
            );

            button.append(goal);
        }

        button.title =
            `${entry.title} — ${time.textContent}`;

        button.addEventListener(
            "click",
            () => openDetails(entry)
        );

        return button;
    }

    function appendDetail(
        container,
        label,
        value
    ) {
        if (!value) {
            return;
        }

        const row =
            document.createElement("div");

        row.className =
            "program-detail-row";

        const labelElement =
            document.createElement("span");

        labelElement.className =
            "program-detail-label";

        labelElement.textContent = label;

        const valueElement =
            document.createElement("div");

        valueElement.className =
            "program-detail-value";

        valueElement.textContent = value;

        row.append(
            labelElement,
            valueElement
        );

        container.append(row);
    }

    function renderDescription(
        container,
        markdown
    ) {
        const value =
            String(markdown ?? "").trim();

        if (!value) {
            return;
        }

        const section =
            document.createElement("section");

        section.className =
            "program-detail-description";

        if (
            window.marked &&
            window.DOMPurify
        ) {
            const html =
                window.marked.parse(value, {
                    gfm: true,
                    breaks: true
                });

            section.innerHTML =
                window.DOMPurify.sanitize(
                    html
                );
        } else {
            section.textContent = value;
        }

        container.append(section);
    }

    function openDetails(entry) {
        const elements = getElements();

        if (
            !elements.dialog ||
            !elements.dialogContent
        ) {
            return;
        }

        elements.dialogTitle.textContent =
            entry.title || "Activité";

        elements.dialogContent
            .replaceChildren();

        appendDetail(
            elements.dialogContent,
            "Date",
            formatFullDate(entry.startsAt)
        );

        appendDetail(
            elements.dialogContent,
            "Horaire",
            `${formatTime(entry.startsAt)} – ` +
            `${formatTime(entry.endsAt)}`
        );

        appendDetail(
            elements.dialogContent,
            "Catégorie",
            entry.category
        );

        const participants =
            (entry.participants ?? [])
                .map(participant =>
                    participant.twitchDisplayName ??
                    participant.displayName ??
                    participant.twitchLogin
                )
                .filter(Boolean);

        if (participants.length > 0) {
            appendDetail(
                elements.dialogContent,
                "Participants",
                participants.join(", ")
            );
        }

        renderDescription(
            elements.dialogContent,
            entry.descriptionMarkdown
        );

        if (
            entry.goal &&
            entry.goalCondition !== "not_reached"
        ) {
            const goal =
                document.createElement("section");

            goal.className =
                "program-detail-goal";

            if (entry.goal.reached) {
                goal.classList.add("is-reached");
            }

            const state =
                document.createElement("strong");

            state.className =
                "program-detail-goal-state";

            state.append(
                createGoalIcon(entry.goal.reached),
                document.createTextNode(
                    entry.goal.reached
                        ? "Objectif atteint"
                        : "Sous réserve d’objectif atteint"
                )
            );

            const title =
                document.createElement("span");

            title.textContent =
                entry.goal.title || "Objectif";

            const amount =
                document.createElement("span");

            amount.textContent =
                formatMoney(
                    entry.goal.thresholdCents,
                    entry.goal.currency ?? "EUR"
                );

            goal.append(state, title, amount);
            elements.dialogContent.append(goal);
        }

        if (entry.cancelledReason) {
            const cancelled =
                document.createElement("p");

            cancelled.className =
                "program-detail-cancelled";

            cancelled.textContent =
                `Activité annulée : ` +
                entry.cancelledReason;

            elements.dialogContent.append(
                cancelled
            );
        }

        if (entry.externalUrl) {
            const link =
                document.createElement("a");

            link.className =
                "button button-secondary";

            link.href = entry.externalUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent =
                "Ouvrir le lien de l’activité";

            elements.dialogContent.append(link);
        }

        elements.dialog.showModal();
    }

    function renderCalendar() {
        const elements = getElements();

        elements.calendar.replaceChildren();

        elements.empty.hidden =
            programEntries.length !== 0;

        if (programEntries.length === 0) {
            return;
        }

        const validEntries =
            programEntries.filter(entry =>
                localParts(entry.startsAt) &&
                localParts(entry.endsAt)
            );

        if (validEntries.length === 0) {
            elements.empty.hidden = false;
            return;
        }

        const firstDate =
            validEntries
                .map(entry =>
                    localParts(entry.startsAt).dateKey
                )
                .sort()[0];

        const lastDate =
            validEntries
                .map(entry => {
                    const start =
                        new Date(entry.startsAt);

                    const end =
                        new Date(entry.endsAt);

                    return localParts(
                        new Date(
                            Math.max(
                                start.getTime(),
                                end.getTime() - 1
                            )
                        ).toISOString()
                    ).dateKey;
                })
                .sort()
                .at(-1);

        const dates =
            listDates(firstDate, lastDate);

        const today =
            localParts(
                new Date().toISOString()
            )?.dateKey;

        if (!dates.includes(activeDateKey)) {
            activeDateKey =
                dates.includes(today)
                    ? today
                    : dates[0];
        }

        /* Boutons permettant de changer de jour */

        const dayNavigation =
            document.createElement("div");

        dayNavigation.className =
            "public-calendar-days";

        for (const date of dates) {
            const button =
                document.createElement("button");

            button.type = "button";
            button.className =
                "public-calendar-day-button";

            button.textContent =
                formatDay(date);

            if (date === activeDateKey) {
                button.classList.add("is-active");
                button.setAttribute(
                    "aria-current",
                    "date"
                );
            }

            button.addEventListener(
                "click",
                () => {
                    activeDateKey = date;
                    renderCalendar();
                }
            );

            dayNavigation.append(button);
        }

        elements.calendar.append(dayNavigation);

        /*
         * Tous les segments servent à conserver
         * la même plage horaire entre les jours.
         */

        const allSegments =
            validEntries.flatMap(entry =>
                makeSegments(entry, dates)
            );

        const activeSegments =
            validEntries
                .flatMap(entry =>
                    makeSegments(
                        entry,
                        [activeDateKey]
                    )
                )
                .sort(
                    (first, second) =>
                        first.start - second.start ||
                        second.end - first.end
                );

        let visibleStart =
            Math.floor(
                Math.min(
                    ...allSegments.map(
                        segment => segment.start
                    )
                ) / 60
            ) * 60 - 60;

        let visibleEnd =
            Math.ceil(
                Math.max(
                    ...allSegments.map(
                        segment => segment.end
                    )
                ) / 60
            ) * 60 + 60;

        visibleStart =
            Math.max(0, visibleStart);

        visibleEnd =
            Math.min(
                DAY_MINUTES,
                visibleEnd
            );

        if (
            visibleEnd - visibleStart < 180
        ) {
            visibleEnd = Math.min(
                DAY_MINUTES,
                visibleStart + 180
            );
        }

        const calendarHeight =
            (visibleEnd - visibleStart) *
            PIXELS_PER_MINUTE;

        const scroll =
            document.createElement("div");

        scroll.className =
            "public-calendar-scroll";

        const grid =
            document.createElement("div");

        grid.className =
            "public-calendar-grid";

        grid.style.gridTemplateColumns =
            "76px minmax(300px, 1fr)";

        const corner =
            document.createElement("div");

        corner.className =
            "public-calendar-heading";

        corner.textContent = "Paris";

        const dayHeading =
            document.createElement("div");

        dayHeading.className =
            "public-calendar-heading";

        dayHeading.textContent =
            formatDay(activeDateKey);

        grid.append(corner, dayHeading);

        const hours =
            document.createElement("div");

        hours.className =
            "public-calendar-hours";

        hours.style.height =
            `${calendarHeight}px`;

        for (
            let minute = visibleStart;
            minute <= visibleEnd;
            minute += 60
        ) {
            const label =
                document.createElement("span");

            label.className =
                "public-calendar-hour";

            label.style.top =
                `${minute - visibleStart}px`;

            label.textContent =
                formatClock(minute);

            hours.append(label);
        }

        grid.append(hours);

        const column =
            document.createElement("div");

        column.className =
            "public-calendar-day";

        column.style.height =
            `${calendarHeight}px`;

        const groups =
            createOverlapGroups(
                activeSegments
            );

        for (const group of groups) {
            const laneCount =
                assignLanes(group);

            for (const segment of group) {
                column.append(
                    createEventButton(
                        segment,
                        visibleStart,
                        laneCount
                    )
                );
            }
        }

        grid.append(column);
        scroll.append(grid);
        elements.calendar.append(scroll);
    }

    function resolvePublicEntry(entry) {
        const condition =
            entry.goalCondition ?? "always";

        if (condition === "always") {
            return entry;
        }

        if (!entry.goal) {
            return entry;
        }

        /* Anciennes activités séparées */
        if (condition === "not_reached") {
            if (entry.goal.reached) {
                return null;
            }

            return {
                ...entry,
                goal: null,
                goalPublicId: null,
                goalCondition: "always",
                isFallback: true
            };
        }

        /* Activité principale débloquée */
        if (entry.goal.reached) {
            return entry;
        }

        /* Goal non atteint et aucun remplacement */
        if (
            !entry.fallbackEnabled ||
            !entry.fallback?.title
        ) {
            return null;
        }

        /* Afficher le remplacement comme une activité normale */
        return {
            ...entry,

            title: entry.fallback.title,

            descriptionMarkdown:
                entry.fallback.descriptionMarkdown ?? "",

            category:
                entry.fallback.category ??
                entry.category,

            externalUrl:
                entry.fallback.externalUrl ?? null,

            goal: null,
            goalPublicId: null,
            goalCondition: "always",
            isFallback: true
        };
    }

    async function load({
        apiFetch,
        creator: currentCreator,
        canManage = false
    }) {
        creator = currentCreator;

        const elements = getElements();

        if (
            !elements.calendar ||
            !elements.empty
        ) {
            return;
        }

        if (elements.editButton) {
            elements.editButton.hidden =
                !canManage;
        }

        try {
            const data = await apiFetch(
                "/api/program/creator/" +
                encodeURIComponent(creator.slug)
            );

            const entries =
                Array.isArray(data?.entries)
                    ? data.entries
                    : Array.isArray(data?.program)
                        ? data.program
                        : [];

            programEntries = entries
                .map(resolvePublicEntry)
                .filter(Boolean)
                .sort(
                    (first, second) =>
                        new Date(first.startsAt) -
                        new Date(second.startsAt)
                );

            renderCalendar();
        } catch (error) {
            console.error(
                "Impossible de charger le programme :",
                error
            );

            programEntries = [];
            elements.calendar.replaceChildren();
            elements.empty.hidden = false;
            elements.empty.textContent =
                "Le programme est temporairement indisponible.";
        }
    }

    const elements = getElements();

    elements.closeDialog?.addEventListener(
        "click",
        () => elements.dialog.close()
    );

    elements.dialog?.addEventListener(
        "cancel",
        event => {
            event.preventDefault();
            elements.dialog.close();
        }
    );

    elements.dialog?.addEventListener(
        "click",
        event => {
            if (event.target === elements.dialog) {
                elements.dialog.close();
            }
        }
    );

    window.JEventCreatorCalendar = {
        load
    };
})();