// State Management
let bookings = JSON.parse(localStorage.getItem('sports_zone_bookings')) || [];
let currentBooking = {
    sport: '',
    rate: 0,
    duration: 0,
    total: 0
};
// UI Elements
const exploreSection = document.getElementById('explore-section');
const wizardSection = document.getElementById('booking-wizard-section');
const bookingsSection = document.getElementById('bookings-section');
const navBook = document.getElementById('btn-nav-book');
const navHistory = document.getElementById('btn-nav-history');
// Navigation Handlers
function switchSection(section) {
    [exploreSection, wizardSection, bookingsSection].forEach(s => s.classList.remove('active'));
    section.classList.add('active');
    // Update active nav state
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    if (section === exploreSection || section === wizardSection) {
        navBook.classList.add('active');
    } else if (section === bookingsSection) {
        navHistory.classList.add('active');
    }
}
navBook.addEventListener('click', (e) => {
    e.preventDefault();
    switchSection(exploreSection);
});
navHistory.addEventListener('click', (e) => {
    e.preventDefault();
    renderBookings();
    switchSection(bookingsSection);
});
document.querySelector('.btn-explore-redirect').addEventListener('click', () => {
    switchSection(exploreSection);
});
document.querySelector('.btn-explore').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('sports-selector').scrollIntoView({ behavior: 'smooth' });
});
// System Log Logger
function logAction(message, type = 'system') {
    const logsContainer = document.getElementById('logs-container');
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `[${timestamp}] ${message}`;
    logsContainer.appendChild(entry);
    logsContainer.scrollTop = logsContainer.scrollHeight;
}
// Sport Card Selection
document.querySelectorAll('.sport-card').forEach(card => {
    card.addEventListener('click', () => {
        const sport = card.getAttribute('data-sport');
        const rate = parseFloat(card.getAttribute('data-rate'));
        currentBooking = {
            sport: sport,
            rate: rate,
            duration: 0,
            total: 0
        };
        // Reset forms & setup first pane
        document.getElementById('booking-info-form').reset();
        document.getElementById('sport-display').value = sport;
        
        // Setup Date picker to today by default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('booking-date').setAttribute('min', today);
        document.getElementById('booking-date').value = today;
        // Reset wizard step visuals
        setWizardStep('info');
        updateBookingSummary();
        
        switchSection(wizardSection);
        logAction(`Selected sport: ${sport}. Starting booking wizard.`, 'system');
    });
});
// Wizard Steps Manager
function setWizardStep(step) {
    const paneInfo = document.getElementById('pane-info');
    const panePayment = document.getElementById('pane-payment');
    const paneConfirm = document.getElementById('pane-confirm');
    const stepInfo = document.getElementById('step-info');
    const stepPayment = document.getElementById('step-payment');
    const stepConfirm = document.getElementById('step-confirm');
    const steps = [stepInfo, stepPayment, stepConfirm];
    const panes = [paneInfo, panePayment, paneConfirm];
    panes.forEach(pane => pane.classList.remove('active'));
    steps.forEach(st => {
        st.classList.remove('active');
        st.classList.remove('completed');
    });
    if (step === 'info') {
        paneInfo.classList.add('active');
        stepInfo.classList.add('active');
    } else if (step === 'payment') {
        panePayment.classList.add('active');
        stepInfo.classList.add('completed');
        stepPayment.classList.add('active');
    } else if (step === 'confirm') {
        paneConfirm.classList.add('active');
        stepInfo.classList.add('completed');
        stepPayment.classList.add('completed');
        stepConfirm.classList.add('completed');
    }
}
// Event Listeners for back buttons in Wizard
document.querySelector('.btn-cancel-booking').addEventListener('click', () => {
    switchSection(exploreSection);
    logAction('Booking wizard cancelled.', 'system');
});
document.querySelector('.btn-back-to-info').addEventListener('click', () => {
    setWizardStep('info');
    logAction('Returned to Booking Details screen.', 'system');
});
document.getElementById('btn-back-home').addEventListener('click', () => {
    switchSection(exploreSection);
});
document.getElementById('btn-view-bookings').addEventListener('click', () => {
    renderBookings();
    switchSection(bookingsSection);
});
// Duration and Realtime Fee Calculations
const startTimeSelect = document.getElementById('start-time');
const endTimeSelect = document.getElementById('end-time');
function updateBookingSummary() {
    const startTimeVal = startTimeSelect.value;
    const endTimeVal = endTimeSelect.value;
    const sumSport = document.getElementById('sum-sport-type');
    const sumRate = document.getElementById('sum-venue-rate');
    const sumDuration = document.getElementById('sum-duration');
    const sumTotal = document.getElementById('sum-total-amount');
    sumSport.innerText = currentBooking.sport || '-';
    sumRate.innerText = currentBooking.rate ? `$${currentBooking.rate.toFixed(2)}/hour` : '-';
    if (startTimeVal && endTimeVal) {
        const startHour = parseInt(startTimeVal.split(':')[0]);
        const endHour = parseInt(endTimeVal.split(':')[0]);
        if (endHour <= startHour) {
            sumDuration.innerText = 'Invalid Duration';
            sumDuration.style.color = '#e71d36';
            sumTotal.innerText = '$0.00';
            currentBooking.duration = 0;
            currentBooking.total = 0;
        } else {
            const duration = endHour - startHour;
            currentBooking.duration = duration;
            currentBooking.total = duration * currentBooking.rate;
            sumDuration.innerText = `${duration} Hour(s) (${startTimeVal} - ${endTimeVal})`;
            sumDuration.style.color = 'var(--text-primary)';
            sumTotal.innerText = `$${currentBooking.total.toFixed(2)}`;
        }
    } else {
        sumDuration.innerText = '-';
        sumTotal.innerText = '$0.00';
        currentBooking.duration = 0;
        currentBooking.total = 0;
    }
}
startTimeSelect.addEventListener('change', updateBookingSummary);
endTimeSelect.addEventListener('change', updateBookingSummary);
// Step 1 Form Submission (Validate Availability)
document.getElementById('booking-info-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const hall = document.getElementById('hall-select').value;
    const date = document.getElementById('booking-date').value;
    const startTime = startTimeSelect.value;
    const endTime = endTimeSelect.value;
    if (currentBooking.duration <= 0) {
        alert('Please select a valid time range where End Time is after Start Time.');
        return;
    }
    // Availability Overlap Validation
    const hasOverlap = bookings.some(b => {
        if (b.status === 'cancelled') return false;
        if (b.hallName !== hall || b.date !== date) return false;
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        const existingStart = parseInt(b.startTime.split(':')[0]);
        const existingEnd = parseInt(b.endTime.split(':')[0]);
        // Overlap condition: startA < endB && endA > startB
        return startHour < existingEnd && endHour > existingStart;
    });
    if (hasOverlap) {
        logAction(`Overlap check failed: ${hall} is already booked on ${date} between selected hours.`, 'warning');
        alert(`Double Booking Prevention: ${hall} is already booked during this time slot. Please choose another slot or court.`);
        return;
    }
    // Update Checkout Info
    document.getElementById('check-sport').innerText = currentBooking.sport;
    document.getElementById('check-hall').innerText = hall;
    document.getElementById('check-date-time').innerText = `${date} at ${startTime} - ${endTime}`;
    document.getElementById('check-duration').innerText = `${currentBooking.duration} hour(s)`;
    document.getElementById('check-total-amount').innerText = `$${currentBooking.total.toFixed(2)}`;
    setWizardStep('payment');
    logAction(`Availability check passed. Total fee calculated: $${currentBooking.total.toFixed(2)}. Proceeding to checkout.`, 'system');
});
// Payment Method Toggle Input Fields
const paymentMethodInputs = document.querySelectorAll('input[name="payment_method"]');
paymentMethodInputs.forEach(input => {
    input.addEventListener('change', () => {
        // Remove active class from all method selectors
        document.querySelectorAll('.pay-method-card').forEach(c => c.classList.remove('active'));
        input.closest('.pay-method-card').classList.add('active');
        // Hide all fields, show matching one
        document.querySelectorAll('.payment-fields-group').forEach(f => f.classList.remove('active'));
        const val = input.value;
        if (val === 'Credit Card') {
            document.getElementById('credit-card-fields').classList.add('active');
        } else if (val === 'UPI') {
            document.getElementById('upi-fields').classList.add('active');
        } else if (val === 'Net Banking') {
            document.getElementById('net-banking-fields').classList.add('active');
        }
    });
});
// Step 2 Form Submission (Submit Booking and create ServiceNow entry mockup)
document.getElementById('payment-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const hall = document.getElementById('hall-select').value;
    const date = document.getElementById('booking-date').value;
    const startTime = startTimeSelect.value;
    const endTime = endTimeSelect.value;
    const bookedBy = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const purpose = document.getElementById('purpose').value;
    const instructions = document.getElementById('instructions').value || 'No special requests.';
    const method = document.querySelector('input[name="payment_method"]:checked').value;
    // Generate Mock Identifiers
    const sysId = 'sys_id_' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const transactionNum = 'TXN' + Math.floor(1000000000 + Math.random() * 9000000000);
    // Save record properties mimicking ServiceNow record u_sports_hall_bookings
    const newBooking = {
        sys_id: sysId,
        bookedBy: bookedBy,
        email: email,
        startTime: startTime,
        endTime: endTime,
        date: date,
        durationHours: currentBooking.duration,
        hallName: hall,
        status: 'pending', // Starts in pending per flow
        payment: currentBooking.total,
        refundPayment: 0,
        refundStatus: '',
        transactionNumber: transactionNum,
        modeOfPayment: method,
        reminder: false,
        instructions: 'Initialized',
        purpose: purpose
    };
    bookings.push(newBooking);
    localStorage.setItem('sports_zone_bookings', JSON.stringify(bookings));
    // Populate Receipt
    document.getElementById('conf-email-addr').innerText = email;
    document.getElementById('conf-sys-id').innerText = `Sys ID: ${sysId}`;
    document.getElementById('conf-hall-name').innerText = hall;
    document.getElementById('conf-sport-type').innerText = currentBooking.sport;
    document.getElementById('conf-duration').innerText = `${date} (${startTime} - ${endTime})`;
    document.getElementById('conf-payment').innerText = `$${currentBooking.total.toFixed(2)}`;
    document.getElementById('conf-transaction-num').innerText = transactionNum;
    document.getElementById('conf-instructions').innerText = instructions;
    setWizardStep('confirm');
    logAction(`Record created in u_sports_hall_bookings with status 'pending' (Sys ID: ${sysId})`, 'system');
    logAction(`E-mail Event triggered: sports.hall.reminder was fired to ${email}.`, 'event');
});
// Render Bookings List
function renderBookings() {
    const listContainer = document.getElementById('bookings-list-container');
    const countLabel = document.getElementById('lbl-booking-count');
    
    countLabel.innerText = `${bookings.length} Booking(s)`;
    if (bookings.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-calendar-times"></i>
                <p>No sports hall bookings found. Explore venues to make your first reservation.</p>
                <button class="btn btn-primary btn-explore-redirect">Book a Court</button>
            </div>
        `;
        // Re-attach explorer redirect handler
        listContainer.querySelector('.btn-explore-redirect').addEventListener('click', () => {
            switchSection(exploreSection);
        });
        return;
    }
    listContainer.innerHTML = '';
    bookings.slice().reverse().forEach(b => {
        const item = document.createElement('div');
        item.className = 'booking-item-card';
        let statusClass = 'pending';
        if (b.status === 'approved') statusClass = 'approved';
        if (b.status === 'cancelled') statusClass = 'cancelled';
        let refundDetailsHTML = '';
        if (b.status === 'cancelled' && b.refundPayment > 0) {
            refundDetailsHTML = `
                <div class="booking-instructions-log" style="border-left-color: var(--accent-green);">
                    <i class="fa-solid fa-receipt"></i> <strong>Refund Details:</strong> Refunded $${b.refundPayment.toFixed(2)} (${b.refundStatus}).
                </div>
            `;
        }
        item.innerHTML = `
            <div class="booking-item-header">
                <div class="booking-item-title">
                    <h4>${b.hallName}</h4>
                    <span class="sport-indicator-tag">${b.purpose}</span>
                </div>
                <span class="status-badge ${statusClass}">${b.status}</span>
            </div>
            <div class="booking-item-grid">
                <div class="grid-cell">
                    <span>Date & Hours</span>
                    <strong>${b.date} (${b.startTime} - ${b.endTime})</strong>
                </div>
                <div class="grid-cell">
                    <span>Duration</span>
                    <strong>${b.durationHours} hrs</strong>
                </div>
                <div class="grid-cell">
                    <span>Payment Fee</span>
                    <strong>$${b.payment.toFixed(2)}</strong>
                </div>
                <div class="grid-cell">
                    <span>Booked By</span>
                    <strong>${b.bookedBy}</strong>
                </div>
            </div>
            <div class="booking-instructions-log">
                <i class="fa-solid fa-circle-info"></i> <strong>ServiceNow Instructions Field:</strong> ${b.instructions}
            </div>
            ${refundDetailsHTML}
            <div class="booking-item-actions">
                ${b.status === 'pending' ? `
                    <button class="btn btn-secondary btn-approve" data-id="${b.sys_id}"><i class="fa-solid fa-circle-check" style="color: var(--accent-green)"></i> Approve (Manager)</button>
                    <button class="btn btn-secondary btn-cancel" data-id="${b.sys_id}"><i class="fa-solid fa-ban" style="color: #e71d36"></i> Cancel Booking</button>
                ` : ''}
                ${b.status === 'approved' ? `
                    <button class="btn btn-secondary btn-cancel" data-id="${b.sys_id}"><i class="fa-solid fa-ban" style="color: #e71d36"></i> Cancel Booking</button>
                ` : ''}
                <button class="btn btn-secondary btn-delete" data-id="${b.sys_id}"><i class="fa-solid fa-trash"></i> Delete Log</button>
            </div>
        `;
        // Event Handlers for buttons
        const btnApprove = item.querySelector('.btn-approve');
        if (btnApprove) {
            btnApprove.addEventListener('click', () => {
                updateBookingStatus(b.sys_id, 'approved');
            });
        }
        const btnCancel = item.querySelector('.btn-cancel');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                cancelBookingWithBusinessRule(b.sys_id);
            });
        }
        const btnDelete = item.querySelector('.btn-delete');
        btnDelete.addEventListener('click', () => {
            deleteBooking(b.sys_id);
        });
        listContainer.appendChild(item);
    });
}
// Manager Approval Simulation
function updateBookingStatus(sysId, status) {
    bookings = bookings.map(b => {
        if (b.sys_id === sysId) {
            logAction(`[Manager Approval] Booking status updated to '${status}' (Sys ID: ${sysId})`, 'system');
            return { ...b, status: status, instructions: `Approved by Sports Hall Manager.` };
        }
        return b;
    });
    localStorage.setItem('sports_zone_bookings', JSON.stringify(bookings));
    renderBookings();
}
// Business Rule Cancellation Simulation
function cancelBookingWithBusinessRule(sysId) {
    bookings = bookings.map(b => {
        if (b.sys_id === sysId) {
            const originalPayment = b.payment;
            
            // SIMULATING BUSINESS RULE LOGIC:
            // "store the 10% cancellation charges and revert the balance amount (90%) in the particular field"
            const cancellationFee = originalPayment * 0.10;
            const refundAmount = originalPayment - cancellationFee;
            logAction(`[Business Rule Triggered] u_sports_hall_bookings: status changes to cancelled.`, 'system');
            logAction(`- Cancellation Fee (10%): $${cancellationFee.toFixed(2)} stored.`, 'system');
            logAction(`- Refund Balance (90%): $${refundAmount.toFixed(2)} mapped to u_refund_payment.`, 'system');
            return { 
                ...b, 
                status: 'cancelled', 
                refundPayment: refundAmount, 
                refundStatus: 'Refund Processed',
                instructions: `Cancelled by user. 10% penalty of $${cancellationFee.toFixed(2)} applied.` 
            };
        }
        return b;
    });
    localStorage.setItem('sports_zone_bookings', JSON.stringify(bookings));
    renderBookings();
}
// Delete Log completely
function deleteBooking(sysId) {
    bookings = bookings.filter(b => b.sys_id !== sysId);
    localStorage.setItem('sports_zone_bookings', JSON.stringify(bookings));
    logAction(`Record deleted from local DB (Sys ID: ${sysId})`, 'system');
    renderBookings();
}
// ServiceNow Scheduled Job Simulation
document.getElementById('btn-run-scheduled-job').addEventListener('click', () => {
    logAction(`[Scheduled Job Trigger] Running 'Sports Hall - 10 Min Reminder'...`, 'system');
    // Filter pending bookings with reminder unsent
    const pendingBookings = bookings.filter(b => b.status === 'pending' && b.reminder === false);
    if (pendingBookings.length === 0) {
        logAction(`- No pending bookings found with reminder = false. Job completed with 0 matches.`, 'warning');
        return;
    }
    let triggeredCount = 0;
    
    bookings = bookings.map(b => {
        if (b.status === 'pending' && b.reminder === false) {
            triggeredCount++;
            logAction(`[Event Log] Fired event 'sports.hall.reminder' for user: ${b.email} (Venue: ${b.hallName})`, 'event');
            
            const nowTime = new Date().toLocaleTimeString();
            return {
                ...b,
                reminder: true,
                instructions: `Reminder sent at ${nowTime}`
            };
        }
        return b;
    });
    localStorage.setItem('sports_zone_bookings', JSON.stringify(bookings));
    renderBookings();
    logAction(`Scheduled job finished execution. Sent ${triggeredCount} reminder event(s).`, 'system');
});
// Initialize Portal page
logAction('Portal interface active. Ready for facility booking simulations.', 'system');
renderBookings();

