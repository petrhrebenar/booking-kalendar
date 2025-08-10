// !!! ZDE VLOŽ URL ADRESU SVÉ NASAZENÉ WEB APP Z GOOGLE APPS SCRIPT !!!
const googleWebAppUrl = 'https://script.google.com/macros/s/AKfycbxqVUB40EVaiWfQHpH0LxykZGL_Oq2NQZnKg27iJYiT2wvgim3vihLrA8KlkRIFOhaa/exec';

// Reference na HTML elementy, se kterými budeme pracovat
const form = document.getElementById('booking-form');
const messageDiv = document.getElementById('message');
const loadingDiv = document.getElementById('loading');
const datumInput = document.getElementById('datum');
const vybraneDatumText = document.getElementById('vybrane-datum-text');

// Po načtení stránky spustíme načítání rezervací
document.addEventListener('DOMContentLoaded', () => {
    fetchBookings();
});

/**
 * Funkce pro načtení rezervací a následné vytvoření kalendáře.
 */
async function fetchBookings() {
    try {
        const response = await fetch(googleWebAppUrl);
        if (!response.ok) throw new Error('Chyba při komunikaci se serverem.');
        
        const bookings = await response.json();
        
        // Zpracujeme rezervace a vytvoříme pole všech obsazených dnů
        const disabledDates = [];
        bookings.forEach(booking => {
            const startDate = new Date(booking.datumZacatku);
            const nights = parseInt(booking.pocetDni, 10);
            
            // Přidáme všechny dny rezervace do pole neaktivních dat
            for (let i = 0; i < nights; i++) {
                const day = new Date(startDate);
                day.setDate(startDate.getDate() + i);
                // Formát YYYY-MM-DD
                disabledDates.push(day.toISOString().split('T')[0]); 
            }
        });

        // Schováme načítací hlášku
        loadingDiv.style.display = 'none';
        
        // Nyní, když máme obsazená data, vytvoříme kalendář
        initializeCalendar(disabledDates);
        
    } catch (error) {
        console.error('Nepodařilo se načíst rezervace:', error);
        loadingDiv.innerText = 'Chyba: Nepodařilo se načíst data z kalendáře.';
    }
}

/**
 * Funkce, která vytvoří a nastaví interaktivní kalendář.
 * @param {string[]} disabledDates - Pole dat ve formátu 'YYYY-MM-DD', která mají být neaktivní.
 */
function initializeCalendar(disabledDates) {
    const options = {
        // Nastavení jazyka a formátování
        settings: {
            lang: 'cs', // Čeština
            visibility: {
                // Zobrazíme pouze dny v aktuálním měsíci a zakážeme minulé dny
                daysOutside: false,
                disabled: true, 
            },
        },
        // Data, která mají být zakázaná
        dates: {
            disabled: disabledDates,
        },
        // Co se stane, když uživatel klikne na den
        actions: {
            clickDay(event, self) {
                // Získáme datum, na které bylo kliknuto
                const selectedDate = self.selectedDates[0];
                if (!selectedDate) return;

                // Uložíme datum do skrytého pole ve formuláři
                datumInput.value = selectedDate;
                
                // Zobrazíme datum uživateli
                vybraneDatumText.textContent = new Date(selectedDate).toLocaleDateString('cs-CZ');
                vybraneDatumText.style.fontWeight = 'bold';
            },
        },
    };

    // Vytvoříme novou instanci kalendáře a inicializujeme ji
    const calendar = new VanillaCalendar('#calendar', options);
    calendar.init();
}


// Funkce pro odeslání formuláře zůstává téměř stejná
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const dataToSend = {
        datumZacatku: formData.get('datum'),
        pocetDni: formData.get('pocetDni'),
        jmeno: formData.get('jmeno'),
        poznamka: formData.get('poznamka')
    };

    // Zkontrolujeme, zda bylo vybráno datum
    if (!dataToSend.datumZacatku) {
        showMessage('Prosím, vyber datum z kalendáře.', 'error');
        return;
    }
    
    showMessage('Odesílám rezervaci...', 'info');

    try {
        const response = await fetch(googleWebAppUrl, {
            method: 'POST',
            body: JSON.stringify(dataToSend),
        });
        const result = await response.json();

        if (result.status === "OK") {
            showMessage(result.message, 'success');
            form.reset();
            vybraneDatumText.textContent = 'zatím nevybráno';
            vybraneDatumText.style.fontWeight = 'normal';
            // Po úspěšné rezervaci znovu načteme kalendář s aktualizovanými daty
            fetchBookings();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        showMessage(`Chyba: ${error.message}`, 'error');
    }
});

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
}
