document.addEventListener('DOMContentLoaded', () => {
    // 1. SELECT HTML ELEMENTS WE NEED TO INTERACT WITH
    const calculatorForm = document.getElementById('calculatorForm');
    const placeholderState = document.getElementById('placeholderState');
    const resultsState = document.getElementById('resultsState');
    
    // Output Metric Fields
    const emiOutput = document.getElementById('emiOutput');
    const interestOutput = document.getElementById('interestOutput');
    const repaymentOutput = document.getElementById('repaymentOutput');
    const scheduleTableBody = document.getElementById('scheduleTableBody');

    // 2. LISTEN FOR THE FORM SUBMISSION (USER CLICKING THE BUTTON)
    if (calculatorForm) {
        calculatorForm.addEventListener('submit', async (e) => {
            // Stop page from doing an old-school full refresh
            e.preventDefault();

            // 3. GRAB THE VALUES FROM THE INPUT FIELDS
            const bikePrice = parseFloat(document.getElementById('bikeSelect').value);
            const downPayment = parseFloat(document.getElementById('downPaymentInput').value);
            const annualRate = parseFloat(document.getElementById('interestRateInput').value);
            const tenureMonths = parseInt(document.getElementById('tenureSelect').value);

            // Basic validation to protect our math engine
            if (downPayment >= bikePrice) {
                alert("❌ Validation Error: Down payment cannot equal or exceed the total bike showroom cost.");
                return;
            }

            // Create a payload object to match what our server.js API expects
            const calculationPayload = {
                bikePrice,
                downPayment,
                annualRate,
                tenureMonths
            };

            try {
                console.log("🚀 Sending payload to calculation engine...", calculationPayload);

                // 4. POST THE VALUES TO OUR SERVER API
                const response = await fetch('/api/moto-calculate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(calculationPayload)
                });

                const data = await response.json();

                if (data.success) {
                    console.log("✅ Math engine calculation received successfully:", data);

                    // 5. UPDATE METRIC VALUES ON SCREEN
                    // .toLocaleString() automatically adds clean commas (e.g., 1200000 turns to 1,200,000)
                    emiOutput.innerText = `₹${data.monthlyEmi.toLocaleString()}`;
                    interestOutput.innerText = `₹${data.totalInterest.toLocaleString()}`;
                    repaymentOutput.innerText = `₹${data.totalRepayment.toLocaleString()}`;

                    // 6. DRAW THE ENTIRE MONTH-BY-MONTH AMORTIZATION TABLE
                    // Wipe out any old table rows from previous calculations
                    scheduleTableBody.innerHTML = '';

                    // Loop through the schedule array sent back by the backend
                    data.amortizationSchedule.forEach(row => {
                        const tr = document.createElement('tr');
                        
                        tr.innerHTML = `
                            <td><strong>Month ${row.month}</strong></td>
                            <td style="color: #34d399;">₹${row.principalPaid.toLocaleString()}</td>
                            <td style="color: #f87171;">₹${row.interestPaid.toLocaleString()}</td>
                            <td style="color: #9ca3af;">₹${row.remainingBalance.toLocaleString()}</td>
                        `;
                        
                        scheduleTableBody.appendChild(tr);
                    });

                    // 7. SWAP SCREEN VISIBILITY STATES
                    placeholderState.classList.add('hidden');
                    resultsState.classList.remove('hidden');

                } else {
                    alert(`Server Error: ${data.error}`);
                }

            } catch (error) {
                console.error("❌ Communication breakdown with backend API:", error);
                alert("Failed to reach server calculation engine. Make sure your server is running.");
            }
        });
    }
});