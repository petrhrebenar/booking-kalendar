// !!! ZDE VLOŽ URL ADRESU SVÉ NASAZENÉ WEB APP Z GOOGLE APPS SCRIPT !!!
const googleWebAppUrl = 'https://script.google.com/macros/s/AKfycbztGuUsfCvtNl9A5BdgGlaGqRP0swqEiNTCCJWKDoztuICjLYKYU7Nyfnh_IiEXiYiz/exec';

const form = document.getElementById('booking-form');
const messageDiv = document.getElementById('message');
const loadingDiv = document.getElementById('loading');

// Po načtení stránky se pokusíme načíst existující rezervace
document.addEventListener('DOMContentLoaded', () => {
    fetchBookings();
});

// Funkce pro načtení rezervací z Google Sheets
async function fetchBookings() {
    try {
        const response = await fetch(googleWebAppUrl);
        if (!response.ok) throw new Error('Chyba při komunikaci se serverem.');
        
        const bookings = await response.json();
        console.log("Načtené rezervace:", bookings);
        // Zde by přišla logika pro vykreslení kalendáře a označení obsazených termínů
        // Prozatím jen vypneme načítací hlášku
        loadingDiv.style.display = 'none';
        
    } catch (error) {
        console.error('Nepodařilo se načíst rezervace:', error);
        loadingDiv.innerText = 'Chyba: Nepodařilo se načíst data z kalendáře.';
    }
}

// Funkce, která se spustí po odeslání formuláře
form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Zabráníme klasickému odeslání formuláře

    // Získáme data z formuláře
    const formData = new FormData(form);
    const dataToSend = {
        datumZacatku: formData.get('datum'), // V reálné aplikaci bychom datum vybírali z kalendáře
        pocetDni: formData.get('pocetDni'),
        jmeno: formData.get('jmeno'),
        poznamka: formData.get('poznamka')
    };

    // Jednoduchá simulace - prozatím si datum musíme vyplnit ručně
    if (!dataToSend.datumZacatku) {
        alert("Prosím, ručně vyplň datum ve formátu YYYY-MM-DD do pole 'Vybrané datum'. Kalendář doděláme příště!");
        document.getElementById('datum').readOnly = false; // Dočasně povolíme editaci
        return;
    }
    
    showMessage('Odesílám rezervaci...', 'info');

    try {
        const response = await fetch(googleWebAppUrl, {
            method: 'POST',
            body: JSON.stringify(dataToSend),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.status === "OK") {
            showMessage(result.message, 'success');
            form.reset();
        } else {
            throw new Error(result.message);
        }

    } catch (error) {
        console.error('Chyba při odesílání:', error);
        showMessage(`Chyba: ${error.message}`, 'error');
    }
});


function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type; // 'success' nebo 'error'
}