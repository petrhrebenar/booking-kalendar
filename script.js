

// ====== NASTAVENÍ PRO AIRTABLE ======
// !!! VLOŽ SEM SVÉ ÚDAJE Z AIRTABLE !!!
const AIRTABLE_API_KEY = "patXJUnA9n4shEsWt.06015dff5f2770902945669b6f28e8271ad3a6a68ada79bfefe0ea1cc12730f7"; // Začíná na "pat..."
const AIRTABLE_BASE_ID = "appYNqXYyPHJb9DDl";           // Začíná na "app..."
const AIRTABLE_TABLE_NAME = "Rezervace";

const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

const form = document.getElementById('booking-form');
const messageDiv = document.getElementById('message');
const loadingDiv = document.getElementById('loading');
const datumInput = document.getElementById('datum');
const vybraneDatumText = document.getElementById('vybrane-datum-text');

document.addEventListener('DOMContentLoaded', fetchBookings);

async function fetchBookings() {
    loadingDiv.innerText = 'Načítám kalendář...';
    try {
        const response = await fetch(airtableUrl, { headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}` } });
        if (!response.ok) throw new Error(`Chyba při komunikaci s Airtable (stav: ${response.status})`);
        
        const data = await response.json();
        const bookings = data.records.map(record => record.fields);
        
        const disabledDates = [];
        bookings.forEach(booking => {
            if (!booking.datumZacatku || !booking.pocetDni) return;
            const startDate = new Date(booking.datumZacatku);
            const nights = parseInt(booking.pocetDni, 10);
            for (let i = 0; i < nights; i++) {
                const day = new Date(startDate);
                day.setDate(startDate.getDate() + i);
                disabledDates.push(day.toISOString().split('T')[0]); 
            }
        });
        loadingDiv.style.display = 'none';
        initializeCalendar(disabledDates);
    } catch (error) {
        loadingDiv.innerText = `Chyba: ${error.message}`;
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!datumInput.value) {
        showMessage('Prosím, vyber datum z kalendáře.', 'error');
        return;
    }
    const dataToSend = { fields: {
        jmeno: document.getElementById('jmeno').value,
        datumZacatku: document.getElementById('datum').value,
        pocetDni: parseInt(document.getElementById('pocetDni').value, 10),
        poznamka: document.getElementById('poznamka').value
    }};
    showMessage('Odesílám rezervaci...', 'info');
    try {
        const response = await fetch(airtableUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message);
        }
        showMessage('Rezervace úspěšně uložena.', 'success');
        form.reset();
        vybraneDatumText.textContent = 'zatím nevybráno';
        fetchBookings();
    } catch (error) {
        showMessage(`Chyba: ${error.message}`, 'error');
    }
});

function initializeCalendar(disabledDates) {
    const options = {
        settings: { lang: 'cs', visibility: { daysOutside: false, disabled: true } },
        dates: { disabled: disabledDates },
        actions: {
            clickDay(event, self) {
                const selectedDate = self.selectedDates[0];
                if (!selectedDate) return;
                datumInput.value = selectedDate;
                vybraneDatumText.textContent = new Date(selectedDate).toLocaleDateString('cs-CZ');
            },
        },
    };
    const calendarEl = document.getElementById('calendar');
    if (calendarEl.calendar) {
        calendarEl.calendar.destroy();
    }
    const calendar = new VanillaCalendar('#calendar', options);
    calendar.init();
    calendarEl.calendar = calendar;
}
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
}
