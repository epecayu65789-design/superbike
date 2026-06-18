// ==========================================================================
// 1. ENGINE IMPORT & ROUTING CONFIGURATION
// ==========================================================================
const express = require('express');
const app = express();

// Middleware to parse incoming JSON payloads seamlessly
app.use(express.json());

// Points Express to serve your public folder (index.html, style.css, script.js)
app.use(express.static('public'));

// ==========================================================================
// 2. MOTO-HUB FINANCIAL EMI CALCULATION ENDPOINT
// ==========================================================================
app.post('/api/moto-calculate', (req, res) => {
    try {
        const { bikePrice, downPayment, annualRate, tenureMonths } = req.body;

        // Validation Check: Prevent calculation if down payment is impossible
        if (downPayment >= bikePrice) {
            return res.status(400).json({ 
                success: false, 
                error: "Down payment cannot exceed or equal the total cost of the machine." 
            });
        }

        // 1. Calculate Core Loan Principal Amount
        const principal = bikePrice - downPayment;

        // 2. Convert Annualized Percentage Rate to a Monthly Decimal
        // Formula: (Annual Rate / 12 Months) / 100
        const monthlyRate = (annualRate / 12) / 100;

        // 3. Compute Exact Monthly EMI via Amortization Formula
        let emi = 0;
        if (monthlyRate === 0) {
            emi = principal / tenureMonths;
        } else {
            emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                  (Math.pow(1 + monthlyRate, tenureMonths) - 1);
        }

        // 4. Generate the Complete Repayment Lifecycle Schedule Array
        let remainingBalance = principal;
        const schedule = [];

        for (let month = 1; month <= tenureMonths; month++) {
            const interestForMonth = remainingBalance * monthlyRate;
            const principalForMonth = emi - interestForMonth;
            remainingBalance -= principalForMonth;

            schedule.push({
                month: month,
                emi: Math.round(emi),
                principalPaid: Math.round(principalForMonth),
                interestPaid: Math.round(interestForMonth),
                remainingBalance: Math.max(0, Math.round(remainingBalance)) // Prevents floating point negative artifacts
            });
        }

        // 5. Send calculated telemetry array structure back to script.js
        res.json({
            success: true,
            loanAmount: Math.round(principal),
            monthlyEmi: Math.round(emi),
            totalInterest: Math.round((emi * tenureMonths) - principal),
            totalRepayment: Math.round(emi * tenureMonths),
            amortizationSchedule: schedule
        });

    } catch (error) {
        console.error("❌ Critical Math Engine Breakdown:", error);
        res.status(500).json({ success: false, error: "Internal systemic compilation error." });
    }
});

// ==========================================================================
// 3. SERVER BOOT INITIALIZATION LOOP
// ==========================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 MOTO-HUB SERVICE ENGINE ONLINE AND IDLING`);
    console.log(`🌐 Local Gateway: http://localhost:${PORT}`);
    console.log(`==================================================\n`);
});