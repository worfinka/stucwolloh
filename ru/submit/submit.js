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
            // 1. Собираем данные в FormData (для отправки файлов)
            const payload = new FormData(FORM); // берём все поля из формы

            // 2. Отправляем на Worker
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                body: payload, // Content-Type выставится автоматически (multipart/form-data)
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('✅ Рассказ успешно отправлен на рассмотрение! Спасибо!', 'success');
                FORM.reset();
                // Сброс капчи (если есть)
                if (window.hcaptcha) window.hcaptcha.reset();
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

})();
