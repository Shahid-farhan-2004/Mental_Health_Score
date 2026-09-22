(() => {
    "use strict";

    const API_BASE = "http://127.0.0.1:8000";

    const form = document.getElementById("predict-form");
    const submitBtn = document.getElementById("submit-btn");
    const resetBtn = document.getElementById("reset-btn");
    const errorRetryBtn = document.getElementById("error-retry-btn");

    const stateIdle = document.getElementById("state-idle");
    const stateLoading = document.getElementById("state-loading");
    const stateResult = document.getElementById("state-result");
    const stateError = document.getElementById("state-error");

    const scoreNumberEl = document.getElementById("score-number");
    const scoreBandEl = document.getElementById("score-band");
    const scoreContextEl = document.getElementById("score-context");

    const gaugeFill = document.getElementById("gauge-fill");
    const errorCopyEl = document.getElementById("error-copy");

    const GAUGE_ARC_LENGTH = 314;

    function drawTicks() {
        document.querySelectorAll(".gauge-ticks").forEach((g) => {
            g.innerHTML = "";

            const cx = 120;
            const cy = 140;
            const rOuter = 100;
            const rInner = 90;

            for (let i = 0; i <= 10; i += 2) {
                const angle = Math.PI - (i / 10) * Math.PI;

                const x1 = cx + rOuter * Math.cos(angle);
                const y1 = cy - rOuter * Math.sin(angle);

                const x2 = cx + rInner * Math.cos(angle);
                const y2 = cy - rInner * Math.sin(angle);

                const line = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );

                line.setAttribute("x1", x1.toFixed(1));
                line.setAttribute("y1", y1.toFixed(1));
                line.setAttribute("x2", x2.toFixed(1));
                line.setAttribute("y2", y2.toFixed(1));

                g.appendChild(line);
            }
        });
    }

    drawTicks();

    const segGroup = document.getElementById("stress_level_group");
    const stressHiddenInput = document.getElementById("stress_level");

    segGroup.querySelectorAll(".seg-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            segGroup
                .querySelectorAll(".seg-btn")
                .forEach((b) => b.classList.remove("active"));

            btn.classList.add("active");
            stressHiddenInput.value = btn.dataset.value;
            clearFieldError(stressHiddenInput);
        });
    });

    function fieldWrapper(input) {
        return input.closest(".field");
    }

    function setFieldError(input, message) {
        const wrap = fieldWrapper(input);

        if (!wrap) return;

        wrap.classList.add("field-error");

        const msgEl = wrap.querySelector(".error-msg");

        if (msgEl) {
            msgEl.textContent = message;
        }
    }

    function clearFieldError(input) {
        const wrap = fieldWrapper(input);

        if (!wrap) return;

        wrap.classList.remove("field-error");

        const msgEl = wrap.querySelector(".error-msg");

        if (msgEl) {
            msgEl.textContent = "";
        }
    }

    function clearAllErrors() {
        form.querySelectorAll(".field").forEach((field) => {
            field.classList.remove("field-error");
        });

        form.querySelectorAll(".error-msg").forEach((msg) => {
            msg.textContent = "";
        });
    }

    function collectPayload() {
        const fd = new FormData(form);

        return {
            age:
                fd.get("age") === ""
                    ? NaN
                    : parseInt(fd.get("age"), 10),

            gender: fd.get("gender") || "",

            country: (fd.get("country") || "").trim(),

            academic_level:
                fd.get("academic_level") || "",

            most_used_platform:
                fd.get("most_used_platform") || "",

            purpose_of_use:
                fd.get("purpose_of_use") || "",

            avg_daily_usage_hours:
                fd.get("avg_daily_usage_hours") === ""
                    ? NaN
                    : parseFloat(fd.get("avg_daily_usage_hours")),

            daily_unlocks:
                fd.get("daily_unlocks") === ""
                    ? NaN
                    : parseInt(fd.get("daily_unlocks"), 10),

            study_hours:
                fd.get("study_hours") === ""
                    ? NaN
                    : parseFloat(fd.get("study_hours")),

            physical_activity_hours:
                fd.get("physical_activity_hours") === ""
                    ? NaN
                    : parseFloat(fd.get("physical_activity_hours")),

            sleep_hours_per_night:
                fd.get("sleep_hours_per_night") === ""
                    ? NaN
                    : parseFloat(fd.get("sleep_hours_per_night")),

            stress_level:
                fd.get("stress_level") || ""
        };
    }

    function validate(payload) {
        const errors = [];

        const numericChecks = [
            ["age", 10, 100],
            ["avg_daily_usage_hours", 0, 24],
            ["daily_unlocks", 0, Infinity],
            ["study_hours", 0, 24],
            ["physical_activity_hours", 0, 24],
            ["sleep_hours_per_night", 0, 24]
        ];

        numericChecks.forEach(([key, min, max]) => {
            const input = document.getElementById(key);
            const value = payload[key];

            if (
                value === "" ||
                value === null ||
                Number.isNaN(value)
            ) {
                errors.push([
                    input,
                    "This field is required."
                ]);
            } else if (value < min || value > max) {
                errors.push([
                    input,
                    `Must be between ${min} and ${
                        max === Infinity ? "∞" : max
                    }.`
                ]);
            }
        });

        const textFields = [
            "gender",
            "country",
            "academic_level",
            "most_used_platform",
            "purpose_of_use"
        ];

        textFields.forEach((key) => {
            const input = document.getElementById(key);

            if (
                !payload[key] ||
                String(payload[key]).trim() === ""
            ) {
                errors.push([
                    input,
                    "This field is required."
                ]);
            }
        });

        if (!payload.stress_level) {
            errors.push([
                stressHiddenInput,
                "Pick a stress level."
            ]);
        }

        return errors;
    }

    function showState(name) {
        [
            stateIdle,
            stateLoading,
            stateResult,
            stateError
        ].forEach((el) => {
            el.hidden = true;
        });

        const states = {
            idle: stateIdle,
            loading: stateLoading,
            result: stateResult,
            error: stateError
        };

        states[name].hidden = false;
    }

    function setSubmitting(isSubmitting) {
        submitBtn.disabled = isSubmitting;

        submitBtn.classList.toggle(
            "loading",
            isSubmitting
        );
    }

    function bandFor(score) {
        if (score < 4) {
            return {
                label: "Signal: strained",
                context:
                    "Your responses suggest elevated strain right now. Small shifts in sleep or screen time can go a long way."
            };
        }

        if (score < 7) {
            return {
                label: "Signal: balanced",
                context:
                    "Your rhythm looks fairly steady, with some room to recover and reset."
            };
        }

        return {
            label: "Signal: strong",
            context:
                "Your habits point to a well-supported baseline. Keep it up."
        };
    }

    function renderResult(score) {
        const clamped = Math.max(
            0,
            Math.min(10, score)
        );

        const { label, context } = bandFor(clamped);

        scoreNumberEl.textContent =
            score.toFixed(2);

        scoreBandEl.textContent =
            label;

        scoreContextEl.textContent =
            context;

        gaugeFill.style.transition = "none";

        gaugeFill.style.strokeDashoffset =
            String(GAUGE_ARC_LENGTH);

        requestAnimationFrame(() => {
            gaugeFill.style.transition = "";

            const offset =
                GAUGE_ARC_LENGTH *
                (1 - clamped / 10);

            gaugeFill.style.strokeDashoffset =
                String(offset);
        });

        showState("result");
    }

    function renderError(message) {
        errorCopyEl.textContent = message;
        showState("error");
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        clearAllErrors();

        const payload = collectPayload();
        const clientErrors = validate(payload);

        if (clientErrors.length > 0) {
            clientErrors.forEach(([input, message]) => {
                if (input) {
                    setFieldError(input, message);
                }
            });

            clientErrors[0][0]?.focus?.();

            return;
        }

        setSubmitting(true);
        showState("loading");

        try {
            const response = await fetch(
                `${API_BASE}/predict`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            if (response.status === 422) {
                const body =
                    await response.json()
                        .catch(() => null);

                console.error(
                    "Validation error:",
                    body
                );

                renderError("Check your inputs");

                return;
            }

            if (!response.ok) {
                const body =
                    await response.json()
                        .catch(() => null);

                console.error(
                    "Server error:",
                    body
                );

                renderError(
                    `API error: ${response.status}`
                );

                return;
            }

            const data =
                await response.json();

            const score =
                data.predicted_mental_health_score;

            if (
                typeof score !== "number" ||
                Number.isNaN(score)
            ) {
                console.error(
                    "Invalid API response:",
                    data
                );

                renderError(
                    "The API returned an invalid score."
                );

                return;
            }

            renderResult(score);

        } catch (error) {
            console.error(
                "Connection error:",
                error
            );

            renderError(
                "Could not connect to the FastAPI server. Make sure Uvicorn is running on port 8000."
            );

        } finally {
            setSubmitting(false);
        }
    });

    form.querySelectorAll(
        "input, select"
    ).forEach((element) => {

        element.addEventListener(
            "input",
            () => clearFieldError(element)
        );

        element.addEventListener(
            "change",
            () => clearFieldError(element)
        );
    });

    resetBtn.addEventListener(
        "click",
        () => {
            showState("idle");
        }
    );

    errorRetryBtn.addEventListener(
        "click",
        () => {
            showState("idle");
        }
    );

})();