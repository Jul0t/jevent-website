(() => {
    "use strict";

    const API_BASE =
        "https://api.jevent.julot.fr";

    const elements = {
        overlay:
            document.querySelector(
                "#donationQrOverlay"
            ),

        code:
            document.querySelector(
                "#donationQrCode"
            ),

        title:
            document.querySelector(
                "#donationQrTitle"
            ),

        creator:
            document.querySelector(
                "#donationQrCreator"
            ),

        debug:
            document.querySelector(
                "#donationQrDebug"
            )
    };

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
                /\/overlay\/qr-don\/([^/?#]+)/
            );

        return match
            ? decodeURIComponent(match[1]).trim()
            : "";
    }

    async function fetchJson(pathname) {
        const response =
            await fetch(
                API_BASE + pathname,
                {
                    cache: "no-store",

                    headers: {
                        Accept: "application/json"
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

        return data;
    }

    function setVariable(name, value) {
        if (value) {
            document.documentElement
                .style.setProperty(
                    name,
                    String(value)
                );
        }
    }

    function applySettings(settings = {}) {
        setVariable(
            "--qr-primary",
            settings.primaryColor
        );

        setVariable(
            "--qr-secondary",
            settings.secondaryColor
        );

        setVariable(
            "--qr-background",
            settings.backgroundColor
        );

        setVariable(
            "--qr-text",
            settings.textColor
        );
    }

    function render(overlay) {
        const settings =
            overlay.settings || {};

        const creator =
            overlay.creator || {};

        const slug =
            String(creator.slug || "").trim();

        if (!slug) {
            throw new Error(
                "Créateur introuvable."
            );
        }

        if (typeof window.QRCodeStyling !== "function") {

            throw new Error(
                "La bibliothèque QR code est introuvable."
            );
        }

        applySettings(settings);

        const donationUrl =
            `${API_BASE}/don/` +
            encodeURIComponent(slug);

        elements.title.textContent =
            String(settings.title || "").trim() ||
            "Scannez pour faire un don";

        elements.creator.textContent =
            creator.displayName ||
            slug;

        elements.code.replaceChildren();

        const qrCode = new window.QRCodeStyling({
            width: 270,
            height: 270,
            type: "canvas",

            data: donationUrl,

            image: "/assets/jevent_logo.png",

            qrOptions: {
                errorCorrectionLevel: "H"
            },

            dotsOptions: {
                color: String(
                    settings.qrColor || "#07150d"
                ),
                type: "rounded"
            },

            cornersSquareOptions: {
                color: String(
                    settings.qrColor || "#07150d"
                ),
                type: "extra-rounded"
            },

            cornersDotOptions: {
                color: String(
                    settings.qrColor || "#07150d"
                ),
                type: "dot"
            },

            backgroundOptions: {
                color: "#ffffff"
            },

            imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.28,
                margin: 8,
                crossOrigin: "anonymous"
            }
        });

        qrCode.append(elements.code);

        elements.overlay.hidden = false;
    }

    function showError(error) {
        console.error(
            "[QR code de don]",
            error
        );

        if (
            new URL(window.location.href)
                .searchParams.has("debug")
        ) {
            elements.debug.hidden = false;

            elements.debug.textContent =
                error.message ||
                String(error);
        }
    }

    async function start() {
        try {
            const token = getToken();

            if (!token) {
                throw new Error(
                    "Jeton de l’overlay manquant."
                );
            }

            const data =
                await fetchJson(
                    "/api/overlays/" +
                    encodeURIComponent(token)
                );

            const overlay =
                data.overlay;

            if (
                !overlay ||
                overlay.overlayType !==
                "donation_qr"
            ) {
                throw new Error(
                    "Ce lien ne correspond pas au QR code de don."
                );
            }

            render(overlay);
        } catch (error) {
            showError(error);
        }
    }

    start();
})();