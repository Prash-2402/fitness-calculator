document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const unitSelect = document.getElementById('unit');
    const genderSelect = document.getElementById('gender');
    const ageInput = document.getElementById('age');
    const heightInput = document.getElementById('height');
    const weightInput = document.getElementById('weight');
    const activitySelect = document.getElementById('activity');
    const goalSelect = document.getElementById('goal');
    const calcBtn = document.getElementById('calcBtn');
    
    // Labels
    const heightLabel = document.querySelector('label[for="height"]');
    const weightLabel = document.querySelector('label[for="weight"]');
    
    // Output Section
    const resultsSection = document.getElementById('results');
    const bmiVal = document.getElementById('bmi');
    const bmrVal = document.getElementById('bmr');
    const tdeeVal = document.getElementById('tdee');
    const targetVal = document.getElementById('target');
    const proteinVal = document.getElementById('protein');

    // Unit Change Listener
    unitSelect.addEventListener('change', () => {
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
    });

    // Calculate Function
    calcBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        let age = parseFloat(ageInput.value);
        let height = parseFloat(heightInput.value);
        let weight = parseFloat(weightInput.value);
        let gender = genderSelect.value;
        let activity = parseFloat(activitySelect.value);
        
        if (!age || !height || !weight) {
            alert('Please fill in all fields correctly.');
            return;
        }

        // Convert Imperial to Metric for Calculation
        if (unitSelect.value === 'imperial') {
            height = height * 2.54; // inches to cm
            weight = weight * 0.453592; // lbs to kg
        }

        // BMR Calculation (Mifflin-St Jeor Equation)
        let bmr;
        if (gender === 'male') {
            bmr = 10 * weight + 6.25 * height - 5 * age + 5;
        } else {
            bmr = 10 * weight + 6.25 * height - 5 * age - 161;
        }

        // TDEE Calculation
        const tdee = Math.round(bmr * activity);

        // Goal Calculation
        let targetCalories = tdee;
        if (goalSelect.value === 'cut') targetCalories = Math.round(tdee * 0.8); // 20% deficit
        else if (goalSelect.value === 'bulk') targetCalories = Math.round(tdee * 1.1); // 10% surplus

        // BMI Calculation
        const heightInMeters = height / 100;
        const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);

        // Protein Recommendation (approx 1.6g - 2.2g per kg, using 2g for active)
        const protein = Math.round(weight * 2.0);

        // Display Results
        bmiVal.textContent = bmi;
        bmrVal.textContent = Math.round(bmr);
        tdeeVal.textContent = tdee;
        targetVal.textContent = targetCalories;
        proteinVal.textContent = `${protein}g`;

        // Show Results Section with Animation
        resultsSection.style.display = 'block';
        
        // Staggered Animation for cards
        const cards = document.querySelectorAll('.result-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.animation = `fadeInUp 0.5s ease-out forwards ${index * 0.1}s`;
        });

        // Smooth Scroll to Results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Intersectional Observer for Scroll Animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.info-card').forEach(card => {
        observer.observe(card);
    });
});
