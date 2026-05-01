// ============================================
// CONFIGURACIÓN DE FIREBASE
// ============================================
// Reemplaza esto con tus credenciales de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBh3DqZShOZPEwzkKdo8Z0FaTK7BwE1rrA",
    authDomain: "neo-barber-4f5eb.firebaseapp.com",
    projectId: "neo-barber-4f5eb",
    storageBucket: "neo-barber-4f5eb.firebasestorage.app",
    messagingSenderId: "397783682916",
    appId: "1:397783682916:web:eaf784f3aaf50eb740f471"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
// const analytics = getAnalytics(app); // Analytics opcional

// Obtener referencia a Firestore
const db = firebase.firestore();

// ============================================
// VARIABLES GLOBALES
// ============================================
let appointmentSelected = null;
const appointments = [];

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const userNameInput = document.getElementById('userName');
const userPhoneInput = document.getElementById('userPhone');
const timeSlots = document.querySelectorAll('.time-slot');
const appointmentsList = document.getElementById('appointmentsList');
const gridContainer = document.getElementById('gridContainer');

// ============================================
// FUNCIONES DE FIREBASE - GUARDAR CITA
// ============================================
async function saveAppointment() {
    const name = userNameInput.value.trim();
    const phone = userPhoneInput.value.trim();
    const time = appointmentSelected;

    // Validar que todos los campos estén completos
    if (!name) {
        alert('Por favor, ingresa tu nombre');
        return;
    }
    if (!phone) {
        alert('Por favor, ingresa tu número de celular');
        return;
    }
    if (!time) {
        alert('Por favor, selecciona una hora');
        return;
    }

    try {
        // Guardar cita en Firestore
        await db.collection('appointments').add({
            name: name,
            phone: phone,
            time: time,
            date: new Date().toLocaleDateString('es-ES'),
            timestamp: new Date(),
            status: 'confirmada'
        });

        // Mostrar mensaje de éxito
        alert(`¡Cita confirmada para ${name} a las ${time}!`);

        // Limpiar formulario
        userNameInput.value = '';
        userPhoneInput.value = '';
        appointmentSelected = null;

        // Recargar las citas
        loadAppointments();
        updateTimeSlots();

    } catch (error) {
        console.error('Error al guardar la cita:', error);
        alert('Ocurrió un error al guardar la cita. Intenta de nuevo.');
    }
}

// ============================================
// FUNCIONES DE FIREBASE - CARGAR CITAS
// ============================================
async function loadAppointments() {
    try {
        const today = new Date().toLocaleDateString('es-ES');
        const snapshot = await db.collection('appointments')
            .where('date', '==', today)
            .where('status', '==', 'confirmada')
            .get();

        appointments.length = 0; // Limpiar array

        snapshot.forEach(doc => {
            appointments.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Actualizar la UI
        displayAppointments();
        updateTimeSlots();

    } catch (error) {
        console.error('Error al cargar las citas:', error);
    }
}

// ============================================
// MOSTRAR CITAS EN LA UI
// ============================================
function displayAppointments() {
    appointmentsList.innerHTML = '';

    if (appointments.length === 0) {
        appointmentsList.innerHTML = '<li>No hay citas pendientes</li>';
        return;
    }

    appointments.forEach(apt => {
        const li = document.createElement('li');
        li.textContent = `${apt.name} ${apt.time}`;
        appointmentsList.appendChild(li);
    });
}

// ============================================
// ACTUALIZAR ESTADO DE SLOTS DE TIEMPO
// ============================================
function updateTimeSlots() {
    // Obtener las horas ocupadas
    const bookedTimes = appointments.map(apt => apt.time);

    // Actualizar cada slot
    timeSlots.forEach(slot => {
        const time = slot.getAttribute('data-time');

        if (bookedTimes.includes(time)) {
            slot.classList.remove('available');
            slot.classList.add('booked');
        } else {
            slot.classList.remove('booked');
            slot.classList.add('available');
        }
    });
}

// ============================================
// EVENTOS - CLICS EN SLOTS DE TIEMPO
// ============================================
timeSlots.forEach(slot => {
    slot.addEventListener('click', function() {
        // Solo permite seleccionar slots disponibles
        if (this.classList.contains('booked')) {
            alert('Esta hora no está disponible');
            return;
        }

        // Remover selección anterior
        timeSlots.forEach(s => s.style.borderStyle = 'solid');

        // Seleccionar nuevo slot
        this.style.borderStyle = 'double';
        this.style.borderWidth = '3px';
        appointmentSelected = this.getAttribute('data-time');
    });
});

// ============================================
// EVENTO - GUARDAR CITA AL PRESIONAR ENTER
// ============================================
userPhoneInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        saveAppointment();
    }
});

// ============================================
// AGREGAR BOTÓN DE GUARDAR
// ============================================
function addSaveButton() {
    const container = document.querySelector('.container');
    const button = document.createElement('button');
    button.id = 'saveBtn';
    button.textContent = 'CONFIRMAR CITA';
    button.style.marginTop = '20px';
    button.style.padding = '12px 30px';
    button.style.fontSize = '1rem';
    button.style.backgroundColor = '#ff8c00';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.fontWeight = 'bold';

    button.addEventListener('click', saveAppointment);
    button.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#e67e00';
    });
    button.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#ff8c00';
    });

    container.appendChild(button);
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicación Neo Barber iniciada');
    
    // Agregar botón de guardar
    addSaveButton();

    // Cargar citas de Firebase
    loadAppointments();

    // Actualizar citas cada 5 segundos (opcional)
    setInterval(loadAppointments, 5000);
});
