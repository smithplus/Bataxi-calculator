document.addEventListener('DOMContentLoaded', () => {
    updateCurrentTime();
    initializeRates(); // Inicializa tarifas en modo Offline por defecto

    setInterval(updateCurrentTime, 1000);

    // Añadir evento de input para calcular en vivo
    document.getElementById('distance').addEventListener('input', calculateFare);
});

function updateCurrentTime() {
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('currentTime').textContent = `Hora actual: ${formattedTime}`;
}

function initializeRates() {
    // Tarifa predeterminada para modo offline
    document.getElementById('startFare').textContent = `$1280.00`;
    document.getElementById('farePer200m').textContent = `$128.00`;
    updateFareType();
}

function toggleFetchMode() {
    const isFetchMode = document.getElementById('fetchMode').checked;

    if (isFetchMode) {
        fetchTaxiRates(); // Modo en vivo
    } else {
        initializeRates(); // Modo offline
    }
}

async function fetchTaxiRates() {
    try {
        const response = await fetch('https://buenosaires.gob.ar/infraestructura/movilidad/taxis/tarifas');
        const text = await response.text();

        // Expresiones regulares ajustadas para capturar valores con comas y puntos
        const startFareMatch = text.match(/al momento de iniciar el viaje y \$ (\d+\.\d+),/);
        const farePer200mMatch = text.match(/por cada 200 metros de recorrido o minuto de espera.*\$ (\d+\.\d+),/);

        if (startFareMatch && farePer200mMatch) {
            // Convertir los valores obtenidos a números
            const startFare = parseFloat(startFareMatch[1].replace('.', '').replace(',', '.'));
            const farePer200m = parseFloat(farePer200mMatch[1].replace('.', '').replace(',', '.'));

            // Mostrar los valores obtenidos
            document.getElementById('startFare').textContent = `$${startFare.toFixed(2)}`;
            document.getElementById('farePer200m').textContent = `$${farePer200m.toFixed(2)}`;

            updateFareType();
        } else {
            console.error('No se pudieron encontrar las tarifas en la página.');
        }
    } catch (error) {
        console.error('Error al consultar las tarifas:', error);
        alert('No se pudo obtener las tarifas en vivo. Volviendo a modo Offline.');
        document.getElementById('fetchMode').checked = false;
        initializeRates(); // Volver a modo Offline
    }
}

function updateFareType() {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();

    let fareType = 'Día';
    if (currentHour >= 22 || currentHour < 6) {
        fareType = 'Noche';
    }

    document.getElementById('fareType').textContent = fareType;
}

function calculateFare() {
    // Obtener valores actuales desde el DOM y convertir a número flotante correctamente
    const startFare = parseFloat(document.getElementById('startFare').textContent.replace('$', '').replace(',', ''));
    const farePer200m = parseFloat(document.getElementById('farePer200m').textContent.replace('$', '').replace(',', ''));
    const distance = parseFloat(document.getElementById('distance').value);

    if (isNaN(distance) || distance <= 0) {
        // Si el input no es válido, limpiar los resultados
        document.getElementById('initialCost').textContent = `$0.00`;
        document.getElementById('totalDistanceCost').textContent = `$0.00`;
        document.getElementById('totalFare').textContent = `$0.00`;
        return;
    }

    // Cálculo de costos
    const totalMeters = distance * 1000; // Convertir kilómetros a metros
    const numberOf200m = Math.ceil(totalMeters / 200); // Número de tramos de 200 metros
    let totalDistanceCost = numberOf200m * farePer200m; // Costo total por distancia

    // Verificar si es tarifa nocturna (entre las 22:00 y las 6:00)
    const currentHour = new Date().getHours();
    let finalStartFare = startFare;
    if (currentHour >= 22 || currentHour < 6) {
        finalStartFare *= 1.2; // Incremento del 20% en la tarifa inicial
        totalDistanceCost *= 1.2; // Incremento del 20% en la tarifa por distancia
    }

    const totalFare = finalStartFare + totalDistanceCost; // Costo total del viaje

    // Mostrar resultados
    document.getElementById('initialCost').textContent = `$${finalStartFare.toFixed(2)}`;
    document.getElementById('totalDistanceCost').textContent = `$${totalDistanceCost.toFixed(2)}`;
    document.getElementById('totalFare').textContent = `$${totalFare.toFixed(2)}`;
}