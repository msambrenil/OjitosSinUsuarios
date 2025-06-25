// frontend/src/views/settingsView.js

export function renderSettingsView() {
    const viewContainer = document.createElement('div');
    viewContainer.innerHTML = `
        <h2>Configuración del Showroom</h2>
        <form id="settingsForm">
            <md-outlined-text-field label="Nombre del Sitio" name="siteName" id="siteName"></md-outlined-text-field>
            <md-outlined-text-field label="Color Primario (Hex)" name="brandColorPrimary" id="brandColorPrimary"></md-outlined-text-field>
            <md-outlined-text-field label="URL del Logo" name="logoUrl" id="logoUrl"></md-outlined-text-field>
            <md-outlined-text-field label="Información de Contacto" name="contactInfo" id="contactInfo"></md-outlined-text-field>
            <md-outlined-text-field label="Instagram (URL)" name="socialInstagram" id="socialInstagram"></md-outlined-text-field>
            <md-outlined-text-field label="TikTok (URL)" name="socialTikTok" id="socialTikTok"></md-outlined-text-field>
            <md-outlined-text-field label="WhatsApp (Link o Número)" name="socialWhatsApp" id="socialWhatsApp"></md-outlined-text-field>
            <md-outlined-text-field label="Link Feria Online" name="feriaOnlineLink" id="feriaOnlineLink"></md-outlined-text-field>
            <md-outlined-text-field label="Dirección del Showroom" name="showroomAddress" id="showroomAddress"></md-outlined-text-field>

            <div style="display: flex; align-items: center; margin-top: 16px; margin-bottom: 16px;">
                <label for="isFeriaModeActive" style="margin-right: 8px;">Modo Feria Activo:</label>
                <md-switch id="isFeriaModeActive" name="isFeriaModeActive"></md-switch>
            </div>

            <md-filled-button type="submit">Guardar Cambios</md-filled-button>
        </form>
        <div id="settingsMessage" style="margin-top: 16px;"></div>
    `;

    const form = viewContainer.querySelector('#settingsForm');
    const messageDiv = viewContainer.querySelector('#settingsMessage');

    // Cargar datos actuales
    fetch('/api/config')
        .then(response => response.json())
        .then(data => {
            form.elements.siteName.value = data.siteName || '';
            form.elements.brandColorPrimary.value = data.brandColorPrimary || '';
            form.elements.logoUrl.value = data.logoUrl || '';
            form.elements.contactInfo.value = data.contactInfo || '';
            form.elements.socialInstagram.value = data.socialInstagram || '';
            form.elements.socialTikTok.value = data.socialTikTok || '';
            form.elements.socialWhatsApp.value = data.socialWhatsApp || '';
            form.elements.feriaOnlineLink.value = data.feriaOnlineLink || '';
            form.elements.showroomAddress.value = data.showroomAddress || '';
            form.elements.isFeriaModeActive.selected = data.isFeriaModeActive || false;
            // En M3 switch, 'selected' es el atributo para el estado on/off
        })
        .catch(error => {
            console.error('Error cargando configuración:', error);
            messageDiv.textContent = 'Error al cargar la configuración.';
            messageDiv.style.color = 'red';
        });

    // Guardar cambios
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        messageDiv.textContent = 'Guardando...';
        messageDiv.style.color = 'inherit';

        const formData = new FormData(form);
        const dataToSave = {};
        formData.forEach((value, key) => {
            dataToSave[key] = value;
        });
        // El switch no se incluye automáticamente en FormData si no tiene 'value' cuando está 'on'.
        // Así que lo tomamos directamente por su estado 'selected'.
        dataToSave.isFeriaModeActive = form.elements.isFeriaModeActive.selected;


        fetch('/api/config', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSave),
        })
        .then(response => response.json())
        .then(result => {
            messageDiv.textContent = result.message || 'Configuración guardada.';
            messageDiv.style.color = 'green';
        })
        .catch(error => {
            console.error('Error guardando configuración:', error);
            messageDiv.textContent = 'Error al guardar la configuración.';
            messageDiv.style.color = 'red';
        });
    });

    return viewContainer;
}
