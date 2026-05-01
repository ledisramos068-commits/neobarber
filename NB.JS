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

// Obtener referencia a Firestore
const db = firebase.firestore();

// ============================================
// VARIABLES GLOBALES
// ============================================
let appointmentSelected = null;
const appointments = [];
let isAdmin = false;
const ADMIN_PIN = "1234";

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

    // Referencias a elementos del botón
    const btn = document.getElementById('acceptBtn');
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('loader');

    // Validaciones
    if (!name || !phone || !time) {
        alert('Por favor, completa todos los campos y selecciona una hora');
        return;
    }

    try {
        // --- ACTIVAR LOADING ---
        btn.disabled = true;       // Deshabilitar clic
        btnText.style.display = "none"; // Ocultar texto
        loader.style.display = "inline-block"; // Mostrar spinner

        // Guardar cita en Firestore
        await db.collection('appointments').add({
            name: name,
            phone: phone,
            time: time,
            date: new Date().toLocaleDateString('es-ES'),
            timestamp: new Date(),
            status: 'confirmada'
        });

        alert(`¡Cita confirmada para ${name} a las ${time}!`);

        // Limpiar formulario
        userNameInput.value = '';
        userPhoneInput.value = '';
        appointmentSelected = null;
        
        // Recargar datos
        loadAppointments();

    } catch (error) {
        console.error('Error al guardar:', error);
        alert('Ocurrió un error. Intenta de nuevo.');
    } finally {
        // --- DESACTIVAR LOADING ---
        // Este bloque siempre se ejecuta, salga bien o mal el proceso
        btn.disabled = false;
        btnText.style.display = "inline-block";
        loader.style.display = "none";
        
        // Limpiar selección visual (de tu código original)
        timeSlots.forEach(slot => {
            slot.classList.remove('selected');
            slot.style.borderStyle = 'solid';
            slot.style.borderWidth = '1px';
        });
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

    // Añadir clase admin al contenedor si isAdmin es true
    if (isAdmin) {
        appointmentsList.classList.add('admin-mode');
    } else {
        appointmentsList.classList.remove('admin-mode');
    }

    appointments.forEach(apt => {
        const li = document.createElement('li');
        // El botón siempre se crea, pero el CSS lo oculta si no es admin
        li.innerHTML = `${apt.name} ${apt.time} <button class="delete-btn" onclick="deleteAppointment('${apt.id}')">X</button>`;
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
            slot.classList.remove('available', 'selected');
            slot.classList.add('booked');
            // Si este slot estaba seleccionado, quitar selección
            if (appointmentSelected === time) {
                appointmentSelected = null;
            }
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
        timeSlots.forEach(s => {
            s.classList.remove('selected');
            s.style.borderStyle = 'solid';
            s.style.borderWidth = '1px';
        });

        // Seleccionar nuevo slot
        this.classList.add('selected');
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
    
    // Conectar botón de aceptar cita
    const acceptBtn = document.getElementById('acceptBtn');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', saveAppointment);
    }

    // Truco: Clic en el título para activar modo admin
    const title = document.querySelector('h1');
    const pendingSection = document.querySelector('.pending-section'); // Seleccionamos la sección

    if (title) {
        title.style.cursor = 'pointer';
        title.addEventListener('click', function() {
            const pass = prompt("Introduce el PIN de administrador:");
            if (pass === ADMIN_PIN) {
                isAdmin = !isAdmin;
                
                // Toggle de clase para mostrar/ocultar botones de borrar
                if (isAdmin) {
                    pendingSection.classList.add('admin-mode-active');
                } else {
                    pendingSection.classList.remove('admin-mode-active');
                }
                
                alert(isAdmin ? "Modo Administrador Activo" : "Modo Administrador Desactivado");
                displayAppointments(); // Refresca la lista para mostrar/ocultar botones
            } else {
                alert("PIN Incorrecto");
            }
        });
    }

    loadAppointments();
    setInterval(loadAppointments, 5000);
});

// ============================================
// FUNCIÓN PARA ELIMINAR CITA
// ============================================
async function deleteAppointment(docId) {
    if (confirm("¿Marcar como terminada o eliminar?")) {
        try {
            await db.collection('appointments').doc(docId).delete();
            alert("Cita eliminada");
            loadAppointments(); // Recargar lista
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    }
}

// ============================================
// FUNCIÓN PARA BORRAR TODA LA AGENDA
// ============================================
async function deleteAllAppointments() {
    if (confirm("¿ESTÁS SEGURO? Esto borrará todas las citas de la lista.")) {
        try {
            const today = new Date().toLocaleDateString('es-ES');
            const snapshot = await db.collection('appointments')
                .where('date', '==', today)
                .get();

            if (snapshot.empty) {
                alert("No hay citas para borrar.");
                return;
            }

            // Borrar cada documento encontrado
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            alert("¡Agenda de hoy limpiada con éxito!");
            loadAppointments(); // Recargar la lista y los slots
        } catch (error) {
            console.error("Error al borrar todo:", error);
            alert("Hubo un error al intentar vaciar la agenda.");
        }
    }
}

// Hacer la función accesible globalmente
window.deleteAllAppointments = deleteAllAppointments;
