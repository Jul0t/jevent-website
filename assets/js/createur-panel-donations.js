(() => {
    const API_URL =
        "https://api-beta.jevent.julot.fr";

    const list =
        document.querySelector(
            "#donationHistoryList"
        );

    const status =
        document.querySelector(
            "#donationHistoryStatus"
        );

    const setting =
        document.querySelector(
            "#hideDonationDetailsUntilOverlay"
        );

    if (!list || !status || !setting) {
        return;
    }

    let creatorId = 0;
    let timer = null;
    let loading = false;
    let updatingSetting = false;

    async function apiFetch(
        pathname,
        options = {}
    ) {
        const response = await fetch(
            API_URL + pathname,
            {
                credentials: "include",

                ...options,

                headers: {
                    Accept: "application/json",

                    ...(options.body
                        ? {
                            "Content-Type":
                                "application/json"
                        }
                        : {}),

                    ...(options.headers || {})
                }
            }
        );

        const data =
            await response.json().catch(
                () => ({})
            );

        if (!response.ok) {
            throw new Error(
                data.error ||
                `Erreur HTTP ${response.status}`
            );
        }

        return data;
    }

    function creatorUrl(pathname) {
        const separator =
            pathname.includes("?")
                ? "&"
                : "?";

        return (
            pathname +
            separator +
            "creatorId=" +
            encodeURIComponent(creatorId)
        );
    }

    function formatAmount(donation) {
        return new Intl.NumberFormat(
            "fr-FR",
            {
                style: "currency",
                currency:
                    donation.currency || "EUR"
            }
        ).format(
            Number(
                donation.amountCents || 0
            ) / 100
        );
    }

    function formatDate(value) {
        if (!value) {
            return "";
        }

        const date = new Date(value);

        if (
            Number.isNaN(date.getTime())
        ) {
            return "";
        }

        return date.toLocaleString(
            "fr-FR",
            {
                dateStyle: "short",
                timeStyle: "medium"
            }
        );
    }

    function createElement(
        tag,
        className,
        text
    ) {
        const element =
            document.createElement(tag);

        if (className) {
            element.className =
                className;
        }

        if (text !== undefined) {
            element.textContent =
                text;
        }

        return element;
    }

    function renderDonations(
        donations
    ) {
        list.replaceChildren();

        if (!donations.length) {
            list.append(
                createElement(
                    "p",
                    "dashboard-donation-history-empty",
                    "Aucun don pour le moment."
                )
            );

            return;
        }

        for (
            const donation of donations
        ) {
            const card =
                createElement(
                    "article",
                    "dashboard-donation-history-item"
                );

            if (!donation.revealed) {
                card.classList.add(
                    "is-masked"
                );
            }

            const content =
                createElement(
                    "div",
                    "dashboard-donation-history-content"
                );

            const heading =
                createElement(
                    "div",
                    "dashboard-donation-history-heading"
                );

            heading.append(
                createElement(
                    "strong",
                    "",
                    donation.revealed
                        ? donation.donorName
                        : "Nouveau don masqué"
                )
            );

            if (donation.revealed) {
                heading.append(
                    createElement(
                        "span",
                        "dashboard-donation-history-amount",
                        formatAmount(donation)
                    )
                );
            }

            content.append(heading);

            if (
                donation.revealed &&
                donation.message
            ) {
                content.append(
                    createElement(
                        "p",
                        "dashboard-donation-history-message",
                        donation.message
                    )
                );
            } else if (
                !donation.revealed
            ) {
                content.append(
                    createElement(
                        "p",
                        "dashboard-donation-history-message",
                        "Les informations apparaîtront avec le montant dans l’overlay."
                    )
                );
            }

            content.append(
                createElement(
                    "time",
                    "dashboard-donation-history-date",
                    formatDate(
                        donation.donatedAt
                    )
                )
            );

            card.append(content);

            if (!donation.revealed) {
                const revealButton =
                    createElement(
                        "button",
                        "dashboard-button dashboard-button-secondary",
                        "Afficher maintenant"
                    );

                revealButton.type =
                    "button";

                revealButton.dataset
                    .revealDonation =
                    String(donation.id);

                card.append(
                    revealButton
                );
            }

            list.append(card);
        }
    }

    async function loadDonations() {
        if (
            !creatorId ||
            loading ||
            document.hidden
        ) {
            return;
        }

        loading = true;

        try {
            const data =
                await apiFetch(
                    creatorUrl(
                        "/api/creator-panel/donations"
                    )
                );

            renderDonations(
                Array.isArray(
                    data.donations
                )
                    ? data.donations
                    : []
            );

            if (!updatingSetting) {
                setting.checked =
                    Boolean(
                        data.hideUntilOverlay
                    );
            }

            status.textContent =
                "À jour";
        } catch (error) {
            console.error(
                "Historique des dons :",
                error
            );

            status.textContent =
                "Erreur";
        } finally {
            loading = false;
        }
    }

    async function revealDonation(
        donationId,
        button
    ) {
        button.disabled = true;

        try {
            await apiFetch(
                creatorUrl(
                    "/api/creator-panel/donations/" +
                    encodeURIComponent(
                        donationId
                    ) +
                    "/reveal"
                ),
                {
                    method: "POST"
                }
            );

            await loadDonations();
        } catch (error) {
            button.disabled = false;

            window.alert(
                error.message
            );
        }
    }

    async function updateSetting() {
        if (
            !creatorId ||
            updatingSetting
        ) {
            return;
        }

        const nextValue =
            setting.checked;

        updatingSetting = true;
        setting.disabled = true;

        try {
            await apiFetch(
                creatorUrl(
                    "/api/creator-panel/donations/settings"
                ),
                {
                    method: "PATCH",

                    body: JSON.stringify({
                        hideUntilOverlay:
                            nextValue
                    })
                }
            );

            await loadDonations();
        } catch (error) {
            setting.checked =
                !nextValue;

            window.alert(
                error.message
            );
        } finally {
            updatingSetting = false;
            setting.disabled = false;
        }
    }

    function start(nextCreatorId) {
        creatorId =
            Number(nextCreatorId) || 0;

        window.clearInterval(
            timer
        );

        void loadDonations();

        timer =
            window.setInterval(
                loadDonations,
                1000
            );
    }

    list.addEventListener(
        "click",
        event => {
            const button =
                event.target.closest(
                    "[data-reveal-donation]"
                );

            if (!button) {
                return;
            }

            void revealDonation(
                button.dataset
                    .revealDonation,
                button
            );
        }
    );

    setting.addEventListener(
        "change",
        updateSetting
    );

    window.addEventListener(
        "jevent:creator-dashboard-ready",
        event => {
            start(
                event.detail?.creatorId
            );
        }
    );

    document.addEventListener(
        "visibilitychange",
        () => {
            if (!document.hidden) {
                void loadDonations();
            }
        }
    );

    window.addEventListener(
        "beforeunload",
        () => {
            window.clearInterval(
                timer
            );
        }
    );
})();