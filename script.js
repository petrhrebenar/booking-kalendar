// ====== NASTAVENÍ PRO AIRTABLE ======
// !!! VLOŽ SEM SVÉ ÚDAJE Z AIRTABLE !!!
const AIRTABLE_API_KEY = "patXJUnA9n4shEsWt.06015dff5f2770902945669b6f28e8271ad3a6a68ada79bfefe0ea1cc12730f7"; // Začíná na "pat..."
const AIRTABLE_BASE_ID = "appYNqXYyPHJb9DDl/tblM0fk8WD7nK8CtL";           // Začíná na "app..."
const AIRTABLE_TABLE_NAME = "Rezervace";

// Sestavení URL adresy pro API
const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;


// Reference na HTML elementy
const form = document.getElementById('booking-form');
const messageDiv = document.getElementById('message');
const loadingDiv = document.getElementById('loading');
const datumInput = document.getElementById('datum');
const vybraneDatumText = document.getElementById('vybrane-datum-text');

// Po načtení stránky spustíme načítání rezervací
document.addEventListener('DOMContentLoaded', () => {
    fetchBookings();
});

// Zcela nová funkce pro načtení rezervací z Airtable
async function fetchBookings() {
    loadingDiv.innerText = 'Načítám kalendář...';
    try {
        const response = await fetch(airtableUrl, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`
            }
        });
        if (!response.ok) throw new Error('Chyba při komunikaci s Airtable.');
        
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
        console.error('Nepodařilo se načíst rezervace:', error);
        loadingDiv.innerText = `Chyba: ${error.message}`;
    }
}

// Funkce pro odeslání formuláře do Airtable
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!datumInput.value) {
        showMessage('Prosím, vyber datum z kalendáře.', 'error');
        return;
    }
    
    const dataToSend = {
        fields: {
            jmeno: document.getElementById('jmeno').value,
            datumZacatku: document.getElementById('datum').value,
            pocetDni: parseInt(document.getElementById('pocetDni').value, 10),
            poznamka: document.getElementById('poznamka').value
        }
    };
    
    showMessage('Odesílám rezervaci...', 'info');

    try {
        const response = await fetch(airtableUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message);
        }

        showMessage('Rezervace úspěšně uložena.', 'success');
        form.reset();
        vybraneDatumText.textContent = 'zatím nevybráno';
        fetchBookings(); // Znovu načteme kalendář
    } catch (error) {
        showMessage(`Chyba: ${error.message}`, 'error');
    }
});


// Funkce pro kalendář a zprávy zůstávají stejné...
function initializeCalendar(disabledDates) { /* ... beze změny ... */ }
function showMessage(text, type) { /* ... beze změny ... */ }

// Vlož sem těla funkcí initializeCalendar a showMessage z našeho předchozího kódu
// (nebo je tam nech, pokud jsi je z `script.js` nesmazal)
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
                vybraneDatumText.style.fontWeight = 'bold';
            },
        },
    };
    const calendar = new VanillaCalendar('#calendar', options);
    calendar.init();
}
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
}
