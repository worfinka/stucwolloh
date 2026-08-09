(function() {
    'use strict';

    const FORM = document.getElementById('submit-form');
    const SUBMIT_BTN = document.getElementById('submit-btn');
    const MESSAGE = document.getElementById('form-message');

    const WORKER_URL = 'https://stucwollohformhandler.dobronom13.workers.dev/';

    // Элементы поиска
    const searchInput = document.getElementById('story-search');
    const storyIdInput = document.getElementById('story-id');
    const suggestionsDiv = document.getElementById('suggestions');

    let allStories = [];
    let selectedStoryId = null;

    // ===== Загрузка stories.json =====
    async function loadStories() {
        try {
            const res = await fetch('/content/ru/stories.json');
            if (!res.ok) throw new Error('Не удалось загрузить список историй');
            const data = await res.json();
            allStories = data.stories || [];
        } catch (err) {
            console.error(err);
            // Не показываем ошибку пользователю, но поиск не будет работать
        }
    }

    // ===== Поиск и отображение подсказок =====
    function searchStories(query) {
        if (!query || query.length < 2) {
            suggestionsDiv.classList.remove('active');
            return;
        }
        const q = query.toLowerCase();
        const results = allStories
            .filter(s => s.title.toLowerCase().includes(q))
            .slice(0, 8);

        if (results.length === 0) {
            suggestionsDiv.classList.remove('active');
            return;
        }

        // Рендерим подсказки
        let html = '';
        results.forEach(s => {
            html += `
                <div class="suggestion-item" data-id="${s.id}" data-title="${s.title}" data-author="${s.author || ''}">
                    <div class="suggestion-title">${s.title}</div>
                    <div class="suggestion-author">${s.author || 'Автор неизвестен'}</div>
                </div>
            `;
        });
        suggestionsDiv.innerHTML = html;
        suggestionsDiv.classList.add('active');
    }

    // Обработчик клика по подсказке
    suggestionsDiv.addEventListener('click', function(e) {
        const item = e.target.closest('.suggestion-item');
        if (!item) return;
        const id = item.dataset.id;
        const title = item.dataset.title;
        const author = item.dataset.author || '';
        searchInput.value = title + ' — ' + author;
        storyIdInput.value = id;
        selectedStoryId = id;
        suggestionsDiv.classList.remove('active');
        // Убираем фокус, чтобы список закрылся
        searchInput.blur();
    });

    // Закрытие списка при потере фокуса
    searchInput.addEventListener('blur', function() {
        setTimeout(() => {
            suggestionsDiv.classList.remove('active');
        }, 200);
    });

    // Ввод в поле поиска
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        if (query === '') {
            suggestionsDiv.classList.remove('active');
            storyIdInput.value = '';
            selectedStoryId = null;
            return;
        }
        searchStories(query);
    });

    // Предотвращаем отправку формы, если не выбрана история
    // Валидация будет в handleSubmit

    // ===== Загрузка файла и отображение имени =====
    const fileInput = document.getElementById('photo-file');
    const fileNameDisplay = document.getElementById('file-name');

    fileInput.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            const file = this.files[0];
            if (file.size > 5 * 1024 * 1024) {
                showMessage('❌ Файл превышает 5 МБ', 'error');
                this.value = '';
                fileNameDisplay.textContent = '';
                return;
            }
            fileNameDisplay.textContent = '📎 ' + file.name + ' (' + (file.size / 1024).toFixed(0) + ' КБ)';
        } else {
            fileNameDisplay.textContent = '';
        }
    });

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
        SUBMIT_BTN.textContent = loading ? 'Отправка...' : 'Отправить фото';
    }

    // ===== Основная отправка =====

    async function handleSubmit(e) {
        e.preventDefault();
        clearMessage();
        setLoading(true);

        try {
            // Проверка капчи (она будет в FormData, но Worker проверит)
            // Проверяем, выбрана ли история
            const storyId = storyIdInput.value.trim();
            if (!storyId) {
                showMessage('❌ Пожалуйста, выберите историю из списка', 'error');
                setLoading(false);
                return;
            }

            // Проверяем, что файл выбран
            const file = fileInput.files[0];
            if (!file) {
                showMessage('❌ Выберите файл изображения', 'error');
                setLoading(false);
                return;
            }

            // Создаём FormData
            const payload = new FormData();
            payload.append('story_id', storyId);
            payload.append('author', document.getElementById('photo-author').value.trim() || 'Неизвестен');
            payload.append('image', file);
            // hCaptcha токен будет добавлен автоматически, т.к. форма содержит элемент h-captcha

            // Отправляем на Worker
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                body: payload,
            });

            const result = await response.json();

            if (response.ok) {
                showMessage('✅ Фото отправлено на рассмотрение!', 'success');
                FORM.reset();
                fileNameDisplay.textContent = '';
                storyIdInput.value = '';
                selectedStoryId = null;
                searchInput.value = '';
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

    document.addEventListener('DOMContentLoaded', () => {
        const yearSpan = document.getElementById('copyright-year');
        if (yearSpan) yearSpan.textContent = new Date().getFullYear();
        loadStories();
    });

})();
