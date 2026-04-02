document.addEventListener('DOMContentLoaded', () => {

    // ── Custom Themed Select Dropdowns ─────────────────────────────────────
    // Replaces every <select> with a fully custom component.
    // The hidden <select> stays in the DOM so all existing code referencing
    // .value / addEventListener continues to work unchanged.
    function initCustomSelects() {
        document.querySelectorAll('select').forEach(function(sel) {
            // Wrap the select
            const wrapper = document.createElement('div');
            wrapper.className = 'cx-select';

            // Hide the real select but keep it functional
            sel.classList.add('cx-select-hidden');
            sel.parentNode.insertBefore(wrapper, sel);
            wrapper.appendChild(sel);

            // Trigger (visible button)
            const trigger = document.createElement('div');
            trigger.className = 'cx-select-trigger';

            const label = document.createElement('span');
            label.className = 'cx-select-label';
            label.textContent = sel.options[sel.selectedIndex]?.text || '';

            // Arrow SVG — use setAttribute for SVG className (SVGAnimatedString)
            const arrow = document.createElementNS('http://www.w3.org/2000/svg','svg');
            arrow.setAttribute('viewBox','0 0 20 20');
            arrow.setAttribute('fill','currentColor');
            arrow.setAttribute('width','16');
            arrow.setAttribute('height','16');
            arrow.setAttribute('class','cx-select-arrow');
            arrow.style.cssText = 'width:16px;height:16px;flex-shrink:0;margin-left:10px;color:#b09898;transition:transform 280ms cubic-bezier(0.34,1.56,0.64,1);';
            arrow.innerHTML = '<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>';

            trigger.appendChild(label);
            trigger.appendChild(arrow);
            wrapper.appendChild(trigger);

            // Options panel
            const panel = document.createElement('div');
            panel.className = 'cx-select-panel';

            Array.from(sel.options).forEach(function(opt, idx) {
                const item = document.createElement('div');
                item.className = 'cx-select-option' + (opt.selected ? ' selected' : '');
                item.textContent = opt.text;
                item.dataset.value = opt.value;

                item.addEventListener('click', function() {
                    // Update underlying select
                    sel.value = opt.value;
                    sel.dispatchEvent(new Event('change', { bubbles: true }));
                    sel.dispatchEvent(new Event('input',  { bubbles: true }));

                    // Update visible label
                    label.textContent = opt.text;

                    // Mark selected
                    panel.querySelectorAll('.cx-select-option').forEach(function(el) {
                        el.classList.toggle('selected', el === item);
                    });

                    closePanel();
                });

                panel.appendChild(item);
            });

            wrapper.appendChild(panel);

            // Open / close
            function openPanel() {
                document.querySelectorAll('.cx-select.open').forEach(function(el) {
                    if (el !== wrapper) {
                        el.classList.remove('open');
                        // Reset other arrows
                        var otherArrow = el.querySelector('.cx-select-arrow');
                        if (otherArrow) otherArrow.style.transform = 'rotate(0deg)';
                    }
                });
                wrapper.classList.add('open');
                arrow.style.transform = 'rotate(180deg)';
            }
            function closePanel() {
                wrapper.classList.remove('open');
                arrow.style.transform = 'rotate(0deg)';
            }

            trigger.addEventListener('click', function(e) {
                e.stopPropagation();
                wrapper.classList.contains('open') ? closePanel() : openPanel();
            });

            // Sync external changes (e.g. restoreCalc sets sel.value directly)
            sel.addEventListener('change', function() {
                label.textContent = sel.options[sel.selectedIndex]?.text || '';
                panel.querySelectorAll('.cx-select-option').forEach(function(el) {
                    el.classList.toggle('selected', el.dataset.value === sel.value);
                });
            });
        });

        // Click outside closes all panels
        document.addEventListener('click', function() {
            document.querySelectorAll('.cx-select.open').forEach(function(el) {
                el.classList.remove('open');
            });
        });
    }

    initCustomSelects();

    // ── End Custom Selects ─────────────────────────────────────────────────

    const STORAGE = {
        CALC: 'neonfit_calc_v1',
        PLAN: 'neonfit_plan_v1'
    };


    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    const muscleGroups = [
        'Chest',
        'Back',
        'Shoulders',
        'Rear Delts',
        'Biceps',
        'Triceps',
        'Quads',
        'Hamstrings',
        'Glutes',
        'Calves',
        'Core'
    ];

    const splits = {
        push_pull_legs: [
            { label: 'Push', muscles: ['Chest', 'Shoulders', 'Triceps'] },
            { label: 'Pull', muscles: ['Back', 'Biceps', 'Rear Delts'] },
            { label: 'Legs', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] }
        ],
        upper_lower: [
            { label: 'Upper', muscles: ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps'] },
            { label: 'Lower', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] }
        ],
        full_body: [{ label: 'Full Body', muscles: ['Chest', 'Back', 'Quads', 'Hamstrings', 'Shoulders', 'Biceps', 'Triceps', 'Core'] }],
        bro_split: [
            { label: 'Chest', muscles: ['Chest'] },
            { label: 'Back', muscles: ['Back'] },
            { label: 'Shoulders', muscles: ['Shoulders', 'Rear Delts'] },
            { label: 'Arms', muscles: ['Biceps', 'Triceps'] },
            { label: 'Legs', muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] }
        ]
    };

    const exerciseLibrary = {
        Chest: ['Barbell Bench Press', 'Incline Dumbbell Press', 'Dumbbell Fly', 'Cable Fly', 'Machine Chest Press', 'Push-Ups', 'Weighted Dips'],
        Back: ['Pull-Ups', 'Lat Pulldown', 'Barbell Row', 'Seated Cable Row', 'Chest-Supported Row', 'Deadlift', 'Straight-Arm Pulldown'],
        Shoulders: ['Overhead Barbell Press', 'Dumbbell Shoulder Press', 'Lateral Raises', 'Arnold Press', 'Machine Shoulder Press'],
        'Rear Delts': ['Face Pulls', 'Reverse Pec Deck', 'Bent-Over Reverse Fly', 'Cable Rear-Delt Fly'],
        Biceps: ['Barbell Curl', 'Dumbbell Curl', 'Hammer Curl', 'Preacher Curl', 'Cable Curl'],
        Triceps: ['Close-Grip Bench Press', 'Triceps Pushdown', 'Overhead Triceps Extension', 'Skullcrusher', 'Dips'],
        Quads: ['Back Squat', 'Front Squat', 'Leg Press', 'Walking Lunge', 'Leg Extension', 'Hack Squat'],
        Hamstrings: ['Romanian Deadlift', 'Seated Leg Curl', 'Lying Leg Curl', 'Good Morning', 'Hip Hinge (Cable Pull-Through)'],
        Glutes: ['Hip Thrust', 'Glute Bridge', 'Bulgarian Split Squat', 'Cable Kickback', 'Step-Up'],
        Calves: ['Standing Calf Raise', 'Seated Calf Raise', 'Donkey Calf Raise'],
        Core: ['Plank', 'Cable Crunch', 'Hanging Leg Raise', 'Dead Bug', 'Ab Wheel Rollout']
    };

    function safeParseJSON(value, fallback) {
        try {
            if (!value) return fallback;
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }

    function load(key, fallback) {
        return safeParseJSON(localStorage.getItem(key), fallback);
    }

    function save(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function toId() {
        return Math.random().toString(36).slice(2, 10);
    }

    function initInfoCardObserver() {
        const infoCards = document.querySelectorAll('.info-card');
        if (!infoCards.length) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) entry.target.classList.add('visible');
                });
            },
            { threshold: 0.1 }
        );

        infoCards.forEach((card) => observer.observe(card));
    }

    // ---------- Calculator ----------
    function initCalculator() {
        const calcBtn = document.getElementById('calcBtn');
        if (!calcBtn) return;

        const unitSelect = document.getElementById('unit');
        const genderSelect = document.getElementById('gender');
        const ageInput = document.getElementById('age');
        const heightInput = document.getElementById('height');
        const weightInput = document.getElementById('weight');
        const activitySelect = document.getElementById('activity');
        const goalSelect = document.getElementById('goal');

        const heightLabel = document.querySelector('label[for="height"]');
        const weightLabel = document.querySelector('label[for="weight"]');

        const resultsSection = document.getElementById('results');
        const bmiVal = document.getElementById('bmi');
        const bmiInfo = document.getElementById('bmiInfo');
        const bmrVal = document.getElementById('bmr');
        const tdeeVal = document.getElementById('tdee');
        const targetVal = document.getElementById('target');
        const proteinVal = document.getElementById('protein');
        const summaryEl = document.getElementById('summary');
        const errorEl = document.getElementById('error');
        const goalExplanation = document.getElementById('goalExplanation');
        const goalExplanationTitle = document.getElementById('goalExplanationTitle');
        const goalExplanationText = document.getElementById('goalExplanationText');

        function showError(message) {
            if (!errorEl) return;
            errorEl.textContent = message;
        }

        function clearError() {
            if (!errorEl) return;
            errorEl.textContent = '';
        }

        function calculateBMR(weightKg, heightCm, ageYears, gender) {
            if (gender === 'male') return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
            return 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
        }

        function calculateBMI(weightKg, heightCm) {
            const heightInMeters = heightCm / 100;
            return weightKg / (heightInMeters * heightInMeters);
        }

        function getBMICategory(bmi) {
            if (bmi < 18.5) return { label: 'Underweight', note: 'Consider a gentle calorie surplus.' };
            if (bmi < 25) return { label: 'Normal', note: 'Great range — build or lean out from here.' };
            if (bmi < 30) return { label: 'Overweight', note: 'A steady calorie deficit will get you there.' };
            return { label: 'Obese', note: 'Prioritise a sustainable deficit and consistency.' };
        }

        function getGoalExplanation(goal, tdee, targetCalories, deficit) {
            if (goal === 'cut') {
                return {
                    title: '🔥 You are in a Calorie Deficit',
                    text: `Your TDEE is ${tdee} kcal — that\'s what your body burns daily. At ${targetCalories} kcal, you\'re eating ${deficit} calories less per day. That daily deficit forces your body to burn stored fat for energy. Every ~7,700 calorie deficit = roughly 1kg of fat lost. Stay consistent, hit your protein, and the fat goes — guaranteed.`
                };
            }
            if (goal === 'bulk') {
                return {
                    title: '💪 You are in a Calorie Surplus',
                    text: `Your TDEE is ${tdee} kcal. At ${targetCalories} kcal you are eating ${Math.abs(deficit)} calories above maintenance. That surplus gives your body the extra energy to build muscle. Without a surplus, muscle gain is very slow. Keep protein high and the surplus modest to minimise fat gain alongside muscle.`
                };
            }
            return {
                title: '⚖️ You are Eating at Maintenance',
                text: `At ${targetCalories} kcal you are matching what you burn (TDEE). Your weight will stay roughly the same. Maintenance is a great phase for building strength, recovering, or taking a diet break while keeping your results.`
            };
        }

        function persistCalc() {
            save(STORAGE.CALC, {
                unit: unitSelect.value,
                gender: genderSelect.value,
                age: ageInput.value,
                height: heightInput.value,
                weight: weightInput.value,
                activity: activitySelect.value,
                goal: goalSelect.value
            });
        }

        function restoreCalc() {
            const data = load(STORAGE.CALC, null);
            if (!data) return;
            if (data.unit) unitSelect.value = data.unit;
            if (data.gender) genderSelect.value = data.gender;
            if (data.age) ageInput.value = data.age;
            if (data.height) heightInput.value = data.height;
            if (data.weight) weightInput.value = data.weight;
            if (data.activity) activitySelect.value = data.activity;
            if (data.goal) goalSelect.value = data.goal;
        }

        unitSelect?.addEventListener('change', () => {
            if (unitSelect.value === 'imperial') {
                heightLabel.textContent = 'Height (inches)';
                weightLabel.textContent = 'Weight (lbs)';
                heightInput.placeholder = 'e.g. 70';
                weightInput.placeholder = 'e.g. 165';
            } else {
                heightLabel.textContent = 'Height (cm)';
                weightLabel.textContent = 'Weight (kg)';
                heightInput.placeholder = 'e.g. 180';
                weightInput.placeholder = 'e.g. 75';
            }
            persistCalc();
        });

        [genderSelect, ageInput, heightInput, weightInput, activitySelect, goalSelect].forEach((el) => {
            el?.addEventListener('input', persistCalc);
            el?.addEventListener('change', persistCalc);
        });

        restoreCalc();
        unitSelect?.dispatchEvent(new Event('change'));

        calcBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearError();
            if (summaryEl) summaryEl.textContent = '';

            let age = parseFloat(ageInput.value);
            let height = parseFloat(heightInput.value);
            let weight = parseFloat(weightInput.value);
            const gender = genderSelect.value;
            const activity = parseFloat(activitySelect.value);

            if (!age || !height || !weight) return showError('Please fill in age, height, and weight.');
            if (age <= 0 || height <= 0 || weight <= 0) return showError('Values must be positive numbers.');
            if (age < 14 || age > 80) return showError('This calculator is optimised for ages 14–80.');

            if (unitSelect.value === 'imperial') {
                height = height * 2.54;
                weight = weight * 0.453592;
            }

            const bmr = calculateBMR(weight, height, age, gender);
            const tdee = Math.round(bmr * activity);

            let targetCalories = tdee;
            if (goalSelect.value === 'cut') targetCalories = Math.round(tdee * 0.8);
            else if (goalSelect.value === 'bulk') targetCalories = Math.round(tdee * 1.1);

            // Protein: 1.8g per kg of bodyweight – evidence-based, simple
            const proteinG = Math.round(weight * 1.8);

            const bmi = calculateBMI(weight, height);
            const bmiCategory = getBMICategory(bmi);
            const deficit = tdee - targetCalories;

            bmiVal.textContent = bmi.toFixed(1);
            bmrVal.textContent = Math.round(bmr).toString();
            tdeeVal.textContent = tdee.toString();
            targetVal.textContent = targetCalories.toString();
            proteinVal.textContent = `${proteinG}g`;
            bmiInfo.textContent = `${bmiCategory.label} – ${bmiCategory.note}`;

            // Goal explanation
            if (goalExplanation && goalExplanationTitle && goalExplanationText) {
                const { title, text } = getGoalExplanation(goalSelect.value, tdee, targetCalories, deficit);
                goalExplanationTitle.textContent = title;
                goalExplanationText.textContent = text;
                goalExplanation.style.display = 'block';
            }

            if (summaryEl) {
                summaryEl.textContent = `Daily target: ${targetCalories} kcal • Protein goal: ${proteinG}g`;
            }

            resultsSection.style.display = 'block';

            const cards = document.querySelectorAll('.result-card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.animation = `fadeInUp 0.5s ease-out forwards ${index * 0.1}s`;
            });

            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // ---------- Workout Builder ----------
    function defaultRepsForMuscle(muscle) {
        if (muscle === 'Calves' || muscle === 'Core') return 12;
        if (muscle === 'Hamstrings' || muscle === 'Back') return 8;
        return 10;
    }

    function getSuggestedExercisesForMuscles(muscles) {
        const seen = new Set();
        const result = [];
        muscles.forEach((m) => {
            const list = exerciseLibrary[m] || [];
            list.slice(0, 3).forEach((name) => {
                if (seen.has(name)) return;
                seen.add(name);
                result.push({
                    id: toId(),
                    name,
                    muscle: m,
                    sets: 3,
                    reps: defaultRepsForMuscle(m)
                });
            });
        });
        return result;
    }

    function buildPlanFromSelection(splitKey, selectedDays) {
        if (!selectedDays.length) return { version: 1, days: [] };

        if (splitKey === 'custom') {
            return {
                version: 1,
                days: selectedDays.map((dayIndex) => ({
                    id: toId(),
                    dayIndex,
                    label: 'Custom',
                    muscles: [],
                    exercises: []
                }))
            };
        }

        const pattern = splits[splitKey] || splits.push_pull_legs;
        return {
            version: 1,
            days: selectedDays.map((dayIndex, i) => {
                const block = pattern[i % pattern.length];
                return {
                    id: toId(),
                    dayIndex,
                    label: block.label,
                    muscles: [...block.muscles],
                    exercises: getSuggestedExercisesForMuscles(block.muscles)
                };
            })
        };
    }

    function initWorkoutBuilder() {
        const generatePlanBtn = document.getElementById('generatePlanBtn');
        const workoutPlanEl = document.getElementById('workoutPlan');
        if (!generatePlanBtn || !workoutPlanEl) return;

        const splitTypeSelect = document.getElementById('splitType');
        const dayToggles = document.querySelectorAll('.day-toggle');
        const workoutCompleteBanner = document.getElementById('workoutCompleteBanner');
        const savePlanBtn = document.getElementById('savePlanBtn');
        const resetPlanBtn = document.getElementById('resetPlanBtn');

        let plan = load(STORAGE.PLAN, null);

        function getSelectedDays() {
            const indices = [];
            dayToggles.forEach((toggle) => {
                if (toggle.checked) indices.push(parseInt(toggle.value, 10));
            });
            return indices.sort((a, b) => a - b);
        }

        function setBanner(text) {
            if (!workoutCompleteBanner) return;
            workoutCompleteBanner.textContent = text || '';
        }

        function savePlan() {
            save(STORAGE.PLAN, plan);
            setBanner('Saved.');
            window.setTimeout(() => {
                if (workoutCompleteBanner?.textContent === 'Saved.') setBanner('');
            }, 1200);
        }

        function resetPlan() {
            plan = { version: 1, days: [] };
            localStorage.removeItem(STORAGE.PLAN);
            renderPlan();
            setBanner('Reset.');
            window.setTimeout(() => {
                if (workoutCompleteBanner?.textContent === 'Reset.') setBanner('');
            }, 1200);
        }

        function exerciseOptionsForDay(day) {
            const muscles = day.muscles?.length ? day.muscles : muscleGroups;
            const set = new Set();
            muscles.forEach((m) => (exerciseLibrary[m] || []).forEach((ex) => set.add(ex)));
            return Array.from(set).sort((a, b) => a.localeCompare(b));
        }

        function renderPlan() {
            workoutPlanEl.innerHTML = '';
            setBanner('');

            if (!plan?.days?.length) {
                workoutPlanEl.innerHTML = '<p class="helper-text">Generate a plan to start customizing.</p>';
                return;
            }

            plan.days
                .slice()
                .sort((a, b) => a.dayIndex - b.dayIndex)
                .forEach((day) => {
                    const options = exerciseOptionsForDay(day);
                    const musclesText = day.muscles?.length ? day.muscles.join(', ') : 'Choose muscles';

                    const muscleTags = muscleGroups
                        .map((m) => {
                            const active = day.muscles?.includes(m);
                            return `<button type="button" class="muscle-chip ${active ? 'active' : ''}" data-day-id="${day.id}" data-muscle="${m}">${m}</button>`;
                        })
                        .join('');

                    const exercisesMarkup = (day.exercises || [])
                        .map((ex) => {
                            const demoHref = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(ex.name)}`;
                            const selectOptions = options
                                .map((name) => `<option value="${name}" ${name === ex.name ? 'selected' : ''}>${name}</option>`)
                                .join('');

                            return `
                            <div class="exercise-row" data-day-id="${day.id}" data-ex-id="${ex.id}">
                                <div class="exercise-row-main">
                                    <div>
                                        <div class="exercise-name">
                                            <select class="exercise-name-select">
                                                ${selectOptions}
                                            </select>
                                        </div>
                                        <div class="exercise-meta">${ex.muscle || 'Custom'}</div>
                                    </div>
                                    <div class="exercise-meta">
                                        <label>Sets <input type="number" min="1" value="${ex.sets}" class="exercise-sets"></label>
                                        <label>Reps <input type="number" min="1" value="${ex.reps}" class="exercise-reps"></label>
                                    </div>
                                </div>
                                <div class="exercise-controls">
                                    <span class="exercise-meta">Demo:</span>
                                    <a class="exercise-demo-link" href="${demoHref}" target="_blank" rel="noreferrer">Images</a>
                                    <span class="exercise-meta">Form intent:</span>
                                    <select class="form-quality">
                                        <option value="good">Good</option>
                                        <option value="hard">Hard but controlled</option>
                                        <option value="bad">Not great</option>
                                    </select>
                                    <button type="button" class="remove-exercise-btn">Remove</button>
                                </div>
                                <div class="exercise-advice"></div>
                            </div>
                        `;
                        })
                        .join('');

                    const card = document.createElement('div');
                    card.className = 'day-card';
                    card.innerHTML = `
                        <div class="day-card-header">
                            <h3>${dayNames[day.dayIndex]}</h3>
                            <span>${musclesText}</span>
                        </div>
                        <div class="day-editor">
                            <label class="day-label-edit">
                                <span class="exercise-meta">Session name</span>
                                <input type="text" class="day-label-input" data-day-id="${day.id}" value="${day.label}">
                            </label>
                        </div>
                        <div class="muscle-tags">${muscleTags}</div>
                        <div class="exercise-list">
                            ${exercisesMarkup}
                        </div>
                        <div class="day-actions">
                            <button class="add-exercise-btn" type="button" data-day-id="${day.id}">+ Add exercise</button>
                            <a class="start-session-btn" href="workout-session.html?day=${day.dayIndex}">Start</a>
                        </div>
                    `;

                    workoutPlanEl.appendChild(card);
                });
        }

        function addExercise(dayId) {
            const day = plan.days.find((d) => d.id === dayId);
            if (!day) return;

            const muscles = day.muscles?.length ? day.muscles : ['Chest'];
            const firstMuscle = muscles[0];
            const name = (exerciseLibrary[firstMuscle] || ['Custom Exercise'])[0] || 'Custom Exercise';

            day.exercises = day.exercises || [];
            day.exercises.push({
                id: toId(),
                name,
                muscle: firstMuscle,
                sets: 3,
                reps: defaultRepsForMuscle(firstMuscle)
            });
            renderPlan();
            savePlan();
        }

        function removeExercise(dayId, exId) {
            const day = plan.days.find((d) => d.id === dayId);
            if (!day) return;
            day.exercises = (day.exercises || []).filter((e) => e.id !== exId);
            renderPlan();
            savePlan();
        }

        function setFormAdvice(rowEl, value) {
            const adviceEl = rowEl.querySelector('.exercise-advice');
            if (!adviceEl) return;
            if (value === 'bad') {
                adviceEl.textContent = 'If it feels hard, it’s working. Drop the weight a bit, slow the tempo, and focus on clean, controlled reps.';
            } else if (value === 'hard') {
                adviceEl.textContent = 'Perfect zone. Keep the weight challenging but stay in control of every rep.';
            } else {
                adviceEl.textContent = '';
            }
        }

        // Restore (if saved)
        if (!plan) {
            plan = { version: 1, days: [] };
        }
        renderPlan();

        generatePlanBtn.addEventListener('click', () => {
            const selectedDays = getSelectedDays();
            plan = buildPlanFromSelection(splitTypeSelect.value, selectedDays);
            renderPlan();
            savePlan();
        });

        savePlanBtn?.addEventListener('click', savePlan);
        resetPlanBtn?.addEventListener('click', resetPlan);

        workoutPlanEl.addEventListener('click', (e) => {
            const target = e.target;
            if (!(target instanceof Element)) return;

            if (target.classList.contains('add-exercise-btn')) {
                addExercise(target.getAttribute('data-day-id'));
            }

            if (target.classList.contains('remove-exercise-btn')) {
                const row = target.closest('.exercise-row');
                if (!row) return;
                const dayId = row.getAttribute('data-day-id');
                const exId = row.getAttribute('data-ex-id');
                removeExercise(dayId, exId);
            }

            if (target.classList.contains('muscle-chip')) {
                const dayId = target.getAttribute('data-day-id');
                const muscle = target.getAttribute('data-muscle');
                const day = plan.days.find((d) => d.id === dayId);
                if (!day) return;

                day.muscles = day.muscles || [];
                if (day.muscles.includes(muscle)) {
                    day.muscles = day.muscles.filter((m) => m !== muscle);
                } else {
                    day.muscles.push(muscle);
                }

                // If no exercises yet, seed suggestions.
                if (!day.exercises?.length && day.muscles.length) {
                    day.exercises = getSuggestedExercisesForMuscles(day.muscles);
                }

                renderPlan();
                savePlan();
            }
        });

        workoutPlanEl.addEventListener('input', (e) => {
            const target = e.target;
            if (!(target instanceof Element)) return;

            if (target.classList.contains('day-label-input')) {
                const dayId = target.getAttribute('data-day-id');
                const day = plan.days.find((d) => d.id === dayId);
                if (!day) return;
                day.label = target.value || 'Session';
                savePlan();
            }

            if (target.classList.contains('exercise-sets') || target.classList.contains('exercise-reps')) {
                const row = target.closest('.exercise-row');
                if (!row) return;
                const dayId = row.getAttribute('data-day-id');
                const exId = row.getAttribute('data-ex-id');
                const day = plan.days.find((d) => d.id === dayId);
                const ex = day?.exercises?.find((x) => x.id === exId);
                if (!ex) return;

                const setsInput = row.querySelector('.exercise-sets');
                const repsInput = row.querySelector('.exercise-reps');
                ex.sets = Math.max(1, parseInt(setsInput.value, 10) || 1);
                ex.reps = Math.max(1, parseInt(repsInput.value, 10) || 1);
                savePlan();
            }
        });

        workoutPlanEl.addEventListener('change', (e) => {
            const target = e.target;
            if (!(target instanceof Element)) return;

            if (target.classList.contains('exercise-name-select')) {
                const row = target.closest('.exercise-row');
                if (!row) return;
                const dayId = row.getAttribute('data-day-id');
                const exId = row.getAttribute('data-ex-id');
                const day = plan.days.find((d) => d.id === dayId);
                const ex = day?.exercises?.find((x) => x.id === exId);
                if (!ex) return;

                ex.name = target.value;
                savePlan();
                renderPlan();
            }

            if (target.classList.contains('form-quality')) {
                const row = target.closest('.exercise-row');
                if (!row) return;
                setFormAdvice(row, target.value);
            }
        });
    }

    // ---------- Workout Session ----------
    function initWorkoutSession() {
        const root = document.getElementById('sessionRoot');
        if (!root) return;

        const titleEl = document.getElementById('sessionTitle');
        const subtitleEl = document.getElementById('sessionSubtitle');
        const quoteEl = document.getElementById('sessionQuote');

        const params = new URLSearchParams(window.location.search);
        const dayIndex = parseInt(params.get('day'), 10);
        const plan = load(STORAGE.PLAN, { version: 1, days: [] });
        const day = plan.days.find((d) => d.dayIndex === dayIndex);

        if (!day) {
            titleEl.textContent = 'Workout Session';
            subtitleEl.textContent = 'No session found for this day. Go back and generate a plan.';
            root.innerHTML = '<p class="helper-text">Open the Workout Builder and create a plan first.</p>';
            return;
        }

        titleEl.textContent = `${dayNames[day.dayIndex]} – ${day.label}`;
        subtitleEl.textContent = (day.muscles?.length ? day.muscles.join(' • ') : 'Custom session') + ' • Focus on clean reps.';

        function render() {
            root.innerHTML = '';
            quoteEl.textContent = '';

            (day.exercises || []).forEach((ex) => {
                const demoHref = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(ex.name)}`;
                const wrapper = document.createElement('div');
                wrapper.className = 'session-exercise';
                wrapper.dataset.exId = ex.id;

                const setTiles = Array.from({ length: ex.sets }, (_, i) => {
                    const setNum = i + 1;
                    return `
                        <div class="set-tile" data-set="${setNum}">
                            <div class="set-tile-top">
                                <span>Set ${setNum}</span>
                                <label>
                                    <input type="checkbox" class="set-done">
                                    Done
                                </label>
                            </div>
                            <div class="exercise-meta">Target reps: <strong>${ex.reps}</strong></div>
                            <div class="exercise-controls" style="margin-top:8px;">
                                <span>Form:</span>
                                <select class="form-quality">
                                    <option value="good">Good</option>
                                    <option value="hard">Hard but controlled</option>
                                    <option value="bad">Not great</option>
                                </select>
                            </div>
                            <div class="exercise-advice"></div>
                        </div>
                    `;
                }).join('');

                wrapper.innerHTML = `
                    <div class="session-exercise-header">
                        <div>
                            <div class="session-exercise-title">${ex.name}</div>
                            <div class="exercise-meta">${ex.muscle || ''}</div>
                        </div>
                        <div class="session-exercise-links">
                            <a href="${demoHref}" target="_blank" rel="noreferrer">Demo images</a>
                        </div>
                    </div>
                    <div class="set-grid">${setTiles}</div>
                `;

                root.appendChild(wrapper);
            });
        }

        function setAdvice(container, value) {
            const adviceEl = container.querySelector('.exercise-advice');
            if (!adviceEl) return;
            if (value === 'bad') {
                adviceEl.textContent = 'If it feels hard, it’s working. Reduce the load slightly, slow the rep, and keep a tight range of motion.';
            } else if (value === 'hard') {
                adviceEl.textContent = 'This is the sweet spot. Keep control and stop 1–2 reps before failure if form breaks.';
            } else {
                adviceEl.textContent = '';
            }
        }

        function checkCompletion() {
            const checks = root.querySelectorAll('.set-done');
            if (!checks.length) return;
            const done = Array.from(checks).every((c) => c.checked);
            quoteEl.textContent = done ? '“Road to hell feels like heaven, Road to heaven feels like hell.”' : '';
        }

        root.addEventListener('change', (e) => {
            const target = e.target;
            if (!(target instanceof Element)) return;

            if (target.classList.contains('form-quality')) {
                const tile = target.closest('.set-tile');
                if (!tile) return;
                setAdvice(tile, target.value);
            }

            if (target.classList.contains('set-done')) {
                checkCompletion();
            }
        });

        render();
    }

    initInfoCardObserver();
    initCalculator();
    initWorkoutBuilder();
    initWorkoutSession();

    // ── Smooth global scroll ─────────────────────────────
    document.documentElement.style.scrollBehavior = 'smooth';

    // ── Header shadow on scroll ──────────────────────────
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 20) {
                header.style.background = 'rgba(4,0,0,0.72)';
                header.style.boxShadow = '0 4px 24px rgba(0,0,0,0.55)';
            } else {
                header.style.background = 'rgba(4,0,0,0.48)';
                header.style.boxShadow = 'none';
            }
        }, { passive: true });
    }

    // ── Staggered reveal for feature cards ──────────────
    function initStaggerReveal(selector, delayStep) {
        var els = document.querySelectorAll(selector);
        if (!els.length) return;
        var obs = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (!entry.isIntersecting) return;
                var idx = Array.from(els).indexOf(entry.target);
                entry.target.style.transitionDelay = (idx * delayStep) + 'ms';
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) scale(1)';
                obs.unobserve(entry.target);
            });
        }, { threshold: 0.08 });
        els.forEach(function(el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(22px) scale(0.99)';
            el.style.transition = 'opacity 0.42s cubic-bezier(0.16,1,0.3,1), transform 0.42s cubic-bezier(0.16,1,0.3,1)';
            obs.observe(el);
        });
    }
    initStaggerReveal('.feature-card', 100);

    // ── Result cards staggered enter ─────────────────────
    var calcBtn2 = document.getElementById('calcBtn');
    if (calcBtn2) {
        calcBtn2.addEventListener('click', function() {
            requestAnimationFrame(function() {
                var cards = document.querySelectorAll('.result-card');
                cards.forEach(function(card, i) {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(16px) scale(0.98)';
                    card.style.transition = 'none';
                    requestAnimationFrame(function() {
                        card.style.transition = 'opacity 0.36s cubic-bezier(0.16,1,0.3,1) ' + (i * 65) + 'ms, transform 0.36s cubic-bezier(0.16,1,0.3,1) ' + (i * 65) + 'ms';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0) scale(1)';
                    });
                });
            });
        }, { passive: true });
    }
});
