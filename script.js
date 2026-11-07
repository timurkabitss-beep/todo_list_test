(function () {
    'use strict';

    var STORAGE_KEY = 'todo-tasks-v1';

    var form = document.getElementById('add-form');
    var input = document.getElementById('task-input');
    var listEl = document.getElementById('task-list');
    var emptyEl = document.getElementById('empty');
    var counterEl = document.getElementById('counter');
    var filtersEl = document.getElementById('filters');
    var clearBtn = document.getElementById('clear-done');

    var tasks = load();
    var filter = 'all';

    // ---------- Хранилище ----------
    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            var data = raw ? JSON.parse(raw) : [];
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

    function save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        } catch (e) { /* хранилище недоступно — работаем в памяти */ }
    }

    // ---------- Действия ----------
    function addTask(text) {
        tasks.unshift({ id: Date.now() + Math.random(), text: text, done: false });
        save();
        render();
    }

    function toggleTask(id) {
        tasks.forEach(function (t) { if (t.id === id) t.done = !t.done; });
        save();
        render();
    }

    function deleteTask(id) {
        tasks = tasks.filter(function (t) { return t.id !== id; });
        save();
        render();
    }

    function clearDone() {
        var count = tasks.filter(function (t) { return t.done; }).length;
        if (!count) return;
        if (!confirm('Удалить выполненные задачи (' + count + ')?')) return;
        tasks = tasks.filter(function (t) { return !t.done; });
        save();
        render();
    }

    function startEdit(task, textEl) {
        var field = document.createElement('input');
        field.type = 'text';
        field.className = 'edit-input';
        field.maxLength = 120;
        field.value = task.text;
        field.setAttribute('aria-label', 'Редактировать задачу');
        textEl.replaceWith(field);
        field.focus();
        field.select();

        var finished = false;
        function finish(saveChanges) {
            if (finished) return;
            finished = true;
            var value = field.value.trim();
            if (saveChanges && value && value !== task.text) {
                task.text = value;
                save();
            }
            render();
        }
        field.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') finish(true);
            if (e.key === 'Escape') finish(false);
        });
        field.addEventListener('blur', function () { finish(true); });
    }

    // ---------- Отрисовка ----------
    function createItem(task) {
        var li = document.createElement('li');
        li.className = 'item' + (task.done ? ' done' : '');

        var label = document.createElement('label');
        label.className = 'check';
        var cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = task.done;
        cb.setAttribute('aria-label', 'Выполнено: ' + task.text);
        cb.addEventListener('change', function () { toggleTask(task.id); });
        var box = document.createElement('span');
        label.appendChild(cb);
        label.appendChild(box);

        var text = document.createElement('span');
        text.className = 'text';
        text.textContent = task.text; // textContent защищает от XSS
        text.title = 'Двойной клик — редактировать';
        text.addEventListener('dblclick', function () { startEdit(task, text); });

        var edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'edit';
        edit.innerHTML = '&#9998;';
        edit.setAttribute('aria-label', 'Редактировать задачу: ' + task.text);
        edit.addEventListener('click', function () { startEdit(task, text); });

        var del = document.createElement('button');
        del.type = 'button';
        del.className = 'del';
        del.innerHTML = '&times;';
        del.setAttribute('aria-label', 'Удалить задачу: ' + task.text);
        del.addEventListener('click', function () { deleteTask(task.id); });

        li.appendChild(label);
        li.appendChild(text);
        li.appendChild(edit);
        li.appendChild(del);
        return li;
    }

    function render() {
        var visible = tasks.filter(function (t) {
            if (filter === 'active') return !t.done;
            if (filter === 'done') return t.done;
            return true;
        });

        listEl.textContent = '';
        visible.forEach(function (t) { listEl.appendChild(createItem(t)); });

        var left = tasks.filter(function (t) { return !t.done; }).length;
        counterEl.textContent = tasks.length ? 'Осталось: ' + left + ' из ' + tasks.length : '';

        var msg = '';
        if (!tasks.length) msg = 'Задач пока нет. Добавьте первую выше.';
        else if (!visible.length) msg = filter === 'done' ? 'Выполненных задач пока нет.' : 'Все задачи выполнены.';
        emptyEl.textContent = msg;
        emptyEl.hidden = !msg;

        clearBtn.hidden = !tasks.some(function (t) { return t.done; });
    }

    // ---------- События ----------
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var value = input.value.trim();
        if (!value) { input.focus(); return; }
        addTask(value);
        input.value = '';
        input.focus();
    });

    filtersEl.addEventListener('click', function (e) {
        var btn = e.target.closest('button[data-filter]');
        if (!btn) return;
        filter = btn.dataset.filter;
        Array.prototype.forEach.call(filtersEl.children, function (b) {
            b.classList.toggle('is-active', b === btn);
        });
        render();
    });

    clearBtn.addEventListener('click', clearDone);

    render();
})();