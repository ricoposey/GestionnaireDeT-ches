document.addEventListener('DOMContentLoaded', function() {
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('new-task');
    const dueDateInput = document.getElementById('due-date');
    const reminderInput = document.getElementById('reminder');
    const repeatInput = document.getElementById('repeat');
    const taskIdInput = document.getElementById('task-id');
    const addTaskButton = document.getElementById('add-task-button');
    const updateTaskButton = document.getElementById('update-task-button');
    const categorySelect = document.getElementById('category');
    const prioritySelect = document.getElementById('priority');

    const currentDate = new Date();
    const dateString = currentDate.toLocaleDateString('fr-FR');
    document.getElementById('date-jour').textContent = dateString;

    // Charger les tâches au démarrage
    loadTasks();
    showReminders();
    startRepeatingAlerts();
    
    // Initialiser le calendrier au démarrage
    initializeCalendar();

    taskForm.addEventListener('submit', function(e) {
        e.preventDefault();
    
        // Validation du champ "Nouvelle tâche"
        const taskInputValue = taskInput.value.trim();
        if (taskInputValue === '') {
            alert('Veuillez saisir une tâche avant d\'ajouter.');
            return;
        }
        if (taskInputValue.length > 100) {
            alert('La tâche ne peut pas dépasser 100 caractères.');
            return;
        }
    
        // Validation de la date d'échéance
        const dueDateValue = dueDateInput.value;
        if (dueDateValue === '') {
            alert('Veuillez sélectionner une date d\'échéance.');
            return;
        }
    
        const currentDate = new Date();
        const dueDate = new Date(dueDateValue);
    
        if (dueDate < currentDate.setHours(0, 0, 0, 0)) { // Comparer à la date du jour (sans heure)
            alert('La date d\'échéance ne peut pas être dans le passé.');
            return;
        }
    
        // Validation de la catégorie
        const categoryValue = categorySelect.value;
        if (categoryValue === '') {
            alert('Veuillez sélectionner une catégorie.');
            return;
        }
    
        // Validation de la priorité
        const priorityValue = prioritySelect.value;
        if (priorityValue === '') {
            alert('Veuillez sélectionner une priorité.');
            return;
        }
    
        // Récupération des autres valeurs (rappel, répétition)
        const reminderValue = reminderInput.checked;
        const repeatValue = repeatInput.checked;
        const taskId = taskIdInput.value;
    
        // Si un ID de tâche existe, mettre à jour la tâche, sinon, ajouter une nouvelle tâche
        if (taskId) {
            updateTask(taskId, taskInputValue, dueDateValue, reminderValue, repeatValue, priorityValue, categoryValue);
        } else {
            const newTaskId = generateUniqueId();
            const taskItem = createTaskElement(taskInputValue, dueDateValue, reminderValue, repeatValue, categoryValue, priorityValue, newTaskId, true);
            document.getElementById('task-list').appendChild(taskItem);
            saveTask(taskInputValue, dueDateValue, reminderValue, repeatValue, priorityValue, categoryValue, newTaskId);
        }
    
        // Réinitialisation du formulaire après ajout ou mise à jour
        taskForm.reset();
        taskIdInput.value = '';
        categorySelect.value = '';
        addTaskButton.style.display = 'block';
        updateTaskButton.style.display = 'none';
    
        // Affichage d'un feedback
        alert('Tâche ajoutée/mise à jour avec succès!');
    });
    
    document.getElementById('task-list').addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('delete-button')) {
            const taskId = event.target.dataset.taskId;
            if (taskId) {
                // Confirmation avant suppression
                if (confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
                    // Suppression de l'élément du DOM immédiatement
                    const taskElement = event.target.parentNode.parentNode;
                    taskElement.remove();
    
                    // Suppression de la tâche dans le localStorage
                    deleteTaskAndUpdateStorage(taskId);
                }
            }
        }

        if (event.target && event.target.classList.contains('edit-button')) {
            const taskId = event.target.dataset.taskId;
            const task = JSON.parse(localStorage.getItem('tasks')).find(t => t.id === taskId);
            if (task) {
                taskInput.value = task.task;
                dueDateInput.value = task.dueDate;
                reminderInput.checked = task.reminder;
                repeatInput.checked = task.repeat;
                categorySelect.value = task.category;
                prioritySelect.value = task.priority;
                taskIdInput.value = taskId;

                addTaskButton.style.display = 'none';
                updateTaskButton.style.display = 'block';
            }
        }
    });

    const menuItems = document.querySelectorAll('.menu li');
    menuItems.forEach(function(item) {
        item.addEventListener('click', function() {
            const sectionTitle = document.getElementById('section-title');
            sectionTitle.textContent = this.textContent;

            document.querySelectorAll('.content > div').forEach(function(div) {
                div.style.display = 'none';
            });

            if (this.id === 'menu-item-liste') {
                document.getElementById('task-list').style.display = 'block';
                document.getElementById('priority-task-list').style.display = 'none';
                document.getElementById('calendar').style.display = 'none';
                document.getElementById('accueil').style.display = 'none';
            } else if (this.id === 'menu-item-prioritaire') {
                document.getElementById('task-list').style.display = 'none';
                document.getElementById('priority-task-list').style.display = 'block';
                document.getElementById('calendar').style.display = 'none';
                document.getElementById('accueil').style.display = 'none';
                loadPriorityTasks();
            } else if (this.id === 'menu-item-calendrier') {
                document.getElementById('task-list').style.display = 'none';
                document.getElementById('priority-task-list').style.display = 'none';
                document.getElementById('calendar').style.display = 'block';
                document.getElementById('accueil').style.display = 'none';
                initializeCalendar();
            } else if (this.id === 'menu-item-aujourd-hui') {
                document.getElementById('accueil').style.display = 'block';
                document.getElementById('task-list').style.display = 'none';
                document.getElementById('priority-task-list').style.display = 'none';
                document.getElementById('calendar').style.display = 'none';
            } else {
                document.getElementById('task-list').style.display = 'none';
                document.getElementById('priority-task-list').style.display = 'none';
                document.getElementById('calendar').style.display = 'none';
                document.getElementById('accueil').style.display = 'none';
            }
        });
    });

    function initializeCalendar() {
        const calendarEl = document.getElementById('calendar');
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const events = tasks.map(task => ({
            title: task.task,
            start: task.dueDate
        }));
    
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: events
        });
    
        // Forcer la mise à jour du calendrier uniquement lorsque visible
        if (calendarEl.offsetParent !== null) {
            calendar.render();
        }
    }

    function saveTask(task, dueDate, reminder, repeat, priority, category, taskId) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.push({ id: taskId, task, dueDate, reminder, repeat, priority, category });
        localStorage.setItem('tasks', JSON.stringify(tasks));
        initializeCalendar(); // Actualiser le calendrier après ajout de la tâche
    }

    function deleteTaskAndUpdateStorage(taskId) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks = tasks.filter(task => task.id !== taskId);
        
        // Mise à jour du localStorage
        localStorage.setItem('tasks', JSON.stringify(tasks));
    
        // Actualiser le calendrier après suppression de la tâche
        initializeCalendar();
    }

    function updateTask(taskId, task, dueDate, reminder, repeat, priority, category) {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks = tasks.map(t => t.id === taskId ? { id: taskId, task, dueDate, reminder, repeat, priority, category } : t);
        localStorage.setItem('tasks', JSON.stringify(tasks));

        const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.innerHTML = 
                `<p>Tâche : ${task}</p>
                <p>Date d'échéance : ${dueDate}</p>
                <p>Rappel : ${reminder ? 'Oui' : 'Non'}</p>
                <p>Répéter : ${repeat ? 'Oui' : 'Non'}</p>
                <p>Catégorie : ${category}</p>
                <p>Priorité : ${priority === 'high' ? 'Urgente' : priority}</p>`;
            taskElement.appendChild(createTaskButtons(taskId));
        }

        initializeCalendar(); // Actualiser le calendrier après la mise à jour de la tâche
    }

    function loadTasks() {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.forEach(task => {
            const taskItem = createTaskElement(task.task, task.dueDate, task.reminder, task.repeat, task.category, task.priority, task.id, true);
            document.getElementById('task-list').appendChild(taskItem);
        });
    }

    function playNotificationSound() {
        const audio = new Audio('path_to_your_sound_file.mp3');
        audio.play();
    }
    

    function showReminders() {
        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        const soundEnabled = document.getElementById('notification-sound').checked;

        tasks.forEach(task => {
            if (task.reminder && task.dueDate === currentDate.toISOString().split('T')[0]) {
                if (Notification.permission === 'granted') {
                    new Notification('Rappel de tâche', {
                        body: `Tâche : ${task.task} - Échéance : ${task.dueDate}`
                    });
                    if (soundEnabled) {
                        playNotificationSound();
                    }
                }
            }
        });
    }

    function startRepeatingAlerts() {
        setInterval(() => {
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const now = new Date();
            tasks.forEach(task => {
                if (task.repeat) {
                    const lastAlert = new Date(localStorage.getItem(`lastAlert_${task.id}`) || 0);
                    if (now - lastAlert >= 5 * 60 * 1000) {
                        alert(`Rappel de répétition de la tâche: ${task.task}`);
                        localStorage.setItem(`lastAlert_${task.id}`, now.toISOString());
                    }
                }
            });
        }, 5 * 60 * 1000);
    }

    function loadPriorityTasks() {
        const priorityTaskList = document.getElementById('priority-task-list');
        priorityTaskList.innerHTML = ''; // Vider la liste avant de la remplir

        let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.filter(task => task.priority === 'high').forEach(task => {
            const taskItem = createTaskElement(task.task, task.dueDate, task.reminder, task.repeat, task.category, task.priority, task.id, false);
            priorityTaskList.appendChild(taskItem);
        });
    }

    function createTaskElement(task, dueDate, reminder, repeat, category, priority, id, appendButtons) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task-item');
        taskElement.dataset.taskId = id;

        const priorityText = (priority === 'high') ? 'Urgente' : priority;

        taskElement.innerHTML = 
            `<p>Tâche : ${task}</p>
            <p>Date d'échéance : ${dueDate}</p>
            <p>Rappel : ${reminder ? 'Oui' : 'Non'}</p>
            <p>Répéter : ${repeat ? 'Oui' : 'Non'}</p>
            <p>Catégorie : ${category}</p>
            <p>Priorité : ${priorityText}</p>`;

        if (appendButtons) {
            taskElement.appendChild(createTaskButtons(id));
        }

        return taskElement;
    }

    function createTaskButtons(taskId) {
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Supprimer';
        deleteButton.classList.add('delete-button');
        deleteButton.dataset.taskId = taskId;

        const editButton = document.createElement('button');
        editButton.textContent = 'Modifier';
        editButton.classList.add('edit-button');
        editButton.dataset.taskId = taskId;

        const buttonContainer = document.createElement('div');
        buttonContainer.appendChild(deleteButton);
        buttonContainer.appendChild(editButton);

        return buttonContainer;
    }

    function generateUniqueId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
});

// Gérer le menu hamburger
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.querySelector('.hamburger-menu');
    const menu = document.querySelector('.menu ul');

    hamburger.addEventListener('click', () => {
        menu.classList.toggle('active');
    });
});

document.getElementById('menu-item-calendrier').addEventListener('click', function() {
    setTimeout(() => {
        initializeCalendar();
    }, 200);  // Assure un délai suffisant pour que le conteneur du calendrier soit bien rendu
});
