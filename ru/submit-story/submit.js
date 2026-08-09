(function() {
    'use strict';

    const FORM = document.getElementById('submit-form');
    const SUBMIT_BTN = document.getElementById('submit-btn');
    const MESSAGE = document.getElementById('form-message');

    // Адрес вашего Worker (НЕ адрес бота!)
    const WORKER_URL = 'https://stucwollohformhandler.dobronom13.workers.dev/';

    // ===== Вспомогательные функции =====

    function showMessage(text, type = 'info') {
        MESSAGE.textContent = text;
        MESSAGE.className = 'form-message ' + type;
        MESSAGE.style.display = 'block';
    }

    function clearMessage() {
        MESSAGE.style.display = 'none';
        MESSAGE.className = 'form-message';
        MESSAGE.textContent = '';
    }

    function setLoading(loading) {
        SUBMIT_BTN.disabled = loading;
        SUBMIT_BTN.textContent = loading ? 'Отправка...' : 'Отправить рассказ';
    }

    // ===== Основная отправка =====

    async function handleSubmit(e) {
        e.preventDefault();
        clearMessage();
        setLoading(true);

        try {
            // 1. Собираем данные в FormData
            const payload = new FormData(FORM);

            // 2. Отправляем на Worker
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                body: payload,
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('✅ Рассказ успешно отправлен на рассмотрение! Спасибо!', 'success');
                FORM.reset();
                if (window.hcaptcha) window.hcaptcha.reset();
                // Сброс цвета на дефолтный
                const colorPicker = document.getElementById('accent_color');
                const colorHex = document.getElementById('accent_color_hex');
                if (colorPicker) colorPicker.value = '#6BCB77';
                if (colorHex) colorHex.value = '#6BCB77';
            } else {
                const errMsg = result.error || `Ошибка ${response.status}`;
                showMessage(`❌ Ошибка: ${errMsg}`, 'error');
            }

        } catch (err) {
            showMessage(`❌ ${err.message || 'Произошла ошибка'}`, 'error');
        } finally {
            setLoading(false);
        }
    }

    // ===== Инициализация =====

    FORM.addEventListener('submit', handleSubmit);

    // Год в футере
    document.addEventListener('DOMContentLoaded', () => {
        const yearSpan = document.getElementById('copyright-year');
        if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    });

    // Синхронизация цветового пикера и текстового поля HEX
    const colorPicker = document.getElementById('accent_color');
    const colorHexInput = document.getElementById('accent_color_hex');
    if (colorPicker && colorHexInput) {
        colorPicker.addEventListener('input', function() {
            colorHexInput.value = this.value;
        });
        colorHexInput.addEventListener('input', function() {
            if (/^#[0-9a-fA-F]{6}$/.test(this.value)) {
                colorPicker.value = this.value;
            }
        });
    }

})();
