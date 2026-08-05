(function() {
    'use strict';

    // Конфигурация
    const WORDS_PER_PAGE = 4000;
    const JSON_URL = '/content/ru/stories.json';

    // DOM-элементы
    const container = document.getElementById('stories-container');
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    // Состояние
    let allStories = [];
    let pages = [];
    let currentPage = 0;

    // ———— Вспомогательные функции ————

    function getStoryType(wordCount) {
        if (wordCount === 100) return 'Драббл';
        if (wordCount <= 50) return 'Мини-сага / Дриббл';
        if (wordCount < 100) return 'Микро-фикшн';
        if (wordCount <= 750) return 'Садден-фикшн';
        if (wordCount <= 1500) return 'Флэш-фикшн';
        return 'Короткий рассказ';
    }

    function stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // Формирует HTML-карточку одной истории
    function renderStoryCard(story) {
        const type = getStoryType(story.word_count || 0);
        const excerpt = story.excerpt || stripHtml(story.content).slice(0, 300) + '…';
        const tagsHtml = (story.tags || []).map(t => `<span class="story-card-tag">${t}</span>`).join('');
        const reviewHtml = story.editorial_review
            ? `<div class="story-card-review">${story.editorial_review}</div>`
            : '';

        return `
            <div class="story-card">
                <div class="story-card-author">
                    <a href="/ru/library?author=${encodeURIComponent(story.author)}">${story.author}</a>
                </div>
                <!-- авторское био пока не используется, оставляем место -->
                <div class="story-card-bio"></div>
                <h2 class="story-card-title">
                    <a href="${story.url || '/stories/ru/' + story.id + '/'}">${story.title}</a>
                </h2>
                <div class="story-card-type">${type}</div>
                <div class="story-card-text">${excerpt}</div>
                ${tagsHtml ? `<div class="story-card-tags">${tagsHtml}</div>` : ''}
                ${reviewHtml}
            </div>
        `;
    }

    // ———— Пагинация ————

    function buildPages(stories) {
        const pages = [];
        let currentPageStories = [];
        let currentWordSum = 0;

        for (const story of stories) {
            const words = story.word_count || 0;
            // Если добавить эту историю, превысит лимит?
            if (currentWordSum + words > WORDS_PER_PAGE && currentPageStories.length > 0) {
                // Сохраняем текущую страницу и начинаем новую
                pages.push(currentPageStories);
                currentPageStories = [];
                currentWordSum = 0;
            }
            currentPageStories.push(story);
            currentWordSum += words;
        }
        // Последняя страница
        if (currentPageStories.length > 0) {
            pages.push(currentPageStories);
        }
        return pages;
    }

    function renderPage(pageIndex) {
        if (!pages.length || pageIndex < 0 || pageIndex >= pages.length) return;

        const stories = pages[pageIndex];
        container.innerHTML = stories.map(renderStoryCard).join('');

        // Обновляем информацию о странице
        pageInfo.textContent = `Страница ${pageIndex + 1} из ${pages.length}`;

        // Кнопки
        prevBtn.disabled = pageIndex === 0;
        nextBtn.disabled = pageIndex === pages.length - 1;
    }

    function goToPage(delta) {
        const newPage = currentPage + delta;
        if (newPage < 0 || newPage >= pages.length) return;
        currentPage = newPage;
        renderPage(currentPage);
        // Прокрутка к началу списка (плавно)
        document.querySelector('.library-layout').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ———— Загрузка данных ————

    async function loadStories() {
        try {
            const response = await fetch(JSON_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            // Ожидаем массив stories
            let stories = data.stories || [];

            // Исключаем 18+
            stories = stories.filter(s => !s.age_rating);

            // Сортируем от новых к старым (по дате)
            stories.sort((a, b) => new Date(b.date) - new Date(a.date));

            allStories = stories;
            pages = buildPages(stories);
            currentPage = 0;
            renderPage(currentPage);

            // Вешаем обработчики кнопок
            prevBtn.addEventListener('click', () => goToPage(-1));
            nextBtn.addEventListener('click', () => goToPage(1));

        } catch (error) {
            console.error('Ошибка загрузки библиотеки:', error);
            container.innerHTML = `<p style="color: #8a8a8a; text-align: center;">Не удалось загрузить рассказы. Попробуйте позже.</p>`;
            pageInfo.textContent = '';
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    }

    // ———— Год в футере ————
    function setCopyrightYear() {
        const el = document.getElementById('copyright-year');
        if (el) el.textContent = new Date().getFullYear();
    }

    // ———— Старт ————
    document.addEventListener('DOMContentLoaded', () => {
        setCopyrightYear();
        loadStories();
    });

})();
