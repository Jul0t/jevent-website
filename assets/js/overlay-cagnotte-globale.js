(() => {
    "use strict";

    const API_BASE =
        "https://api.jevent.julot.fr";

    const overlayElement =
        document.querySelector(
            "#globalDonationOverlay"
        );

    const amountElement =
        document.querySelector(
            "#globalDonationAmount"
        );

    const debugElement =
        document.querySelector(
            "#globalDonationDebug"
        );

    function getToken() {
        const url =
            new URL(window.location.href);

        const queryToken =
            url.searchParams.get("code");

        if (queryToken) {
            return queryToken.trim();
        }

        const match =
            url.pathname.match(
                /\/overlay\/cagnotte-globale\/([^/?#]+)/
            );

        return match
            ? decodeURIComponent(match[1]).trim()
            : "";
    }

    function formatAmount(amountCents) {
        return new Intl.NumberFormat(
            "fr-FR",
            {
                style: "currency",
                currency: "EUR"
            }
        ).format(
            Math.max(
                0,
                Number(amountCents || 0)
            ) / 100
        );
    }

    async function update() {
        const token = getToken();

        if (!token) {
            throw new Error(
                "Jeton de l’overlay manquant."
            );
        }

        const response =
            await fetch(
                `${API_BASE}/api/overlays/` +
                encodeURIComponent(token),
                {
                    cache: "no-store",
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );

        const data =
            await response
                .json()
                .catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                data.error ||
                `Erreur HTTP ${response.status}`
            );
        }

        const overlay =
            data.overlay;

        if (
            !overlay ||
            overlay.overlayType !==
                "donation_global"
        ) {
            throw new Error(
                "Ce lien ne correspond pas à la cagnotte globale."
            );
        }

        const amountCents =
            overlay.globalDonation
                ?.amountCents || 0;

        amountElement.textContent =
            formatAmount(amountCents);

        overlayElement.hidden = false;
    }

    async function start() {
        try {
            await update();

            window.setInterval(
                () => {
                    update().catch(showError);
                },
                60000
            );
        } catch (error) {
            showError(error);
        }
    }

    function showError(error) {
        console.error(
            "[Cagnotte globale]",
            error
        );

        if (
            new URL(window.location.href)
                .searchParams.has("debug")
        ) {
            debugElement.hidden = false;
            debugElement.textContent =
                error.message ||
                String(error);
        }
    }

    start();
})();