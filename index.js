document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        document.getElementById('credentials').style.display = 'none';
    }, 60000);

    document.getElementById('loginForm').addEventListener('submit', function(event) {
        event.preventDefault();
        
        var username = document.getElementById('usernameInput').value;
        var password = document.getElementById('passwordInput').value;
        var correctUsername = document.getElementById('username').textContent;
        var correctPassword = document.getElementById('password').textContent;

        if (username === correctUsername && password === correctPassword) {
            window.location.href = 'app.html';
        } else {
            alert('Identifiant ou mot de passe incorrect.');
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        // Afficher la date actuelle
        var currentDate = new Date();
        var dateString = currentDate.toLocaleDateString('fr-FR');
        document.getElementById('date-jour').textContent = dateString;
    
        // Charger les tâches depuis le stockage local lors du chargement de la page
        loadTasks();
    
        // Gérer le clic sur le bouton "Ajouter"
        document.getElementById('task-form').addEventListener('submit', function(e) {
            e.preventDefault();
    
            var taskInput = document.getElementById('new-task').value.trim();
            if (taskInput === '') {
                alert('Veuillez saisir une tâche avant d\'ajouter.');
                return;
            }
    
            var dueDateInput = document.getElementById('due-date').value;
            var reminderInput = document.getElementById('reminder').checked;
            var repeatInput = document.getElementById('repeat').checked;
    
            // Créer un identifiant unique pour la tâche
            var taskId = generateUniqueId();
    
            // Créer l'élément de tâche avec le bouton de suppression
            var taskItem = createTaskElement(taskInput, dueDateInput, reminderInput, repeatInput, taskId);
            
            // Ajouter l'élément de tâche à la section .content
            document.querySelector('.content').appendChild(taskItem);
    
            // Enregistrer la tâche dans le stockage local
            saveTask(taskInput, dueDateInput, reminderInput, repeatInput, taskId);
            
            // Réinitialiser le formulaire
            document.getElementById('task-form').reset();
        });
    
        // Gérer le clic sur le bouton "Supprimer"
        document.querySelector('.content').addEventListener('click', function(event) {
            if (event.target && event.target.classList.contains('delete-button')) {
                var taskId = event.target.dataset.taskId;
                if (taskId) {
                    deleteTaskAndUpdateStorage(taskId);
                    event.target.parentNode.remove(); // Supprimer l'élément de tâche du DOM
                }
            }
        });
    
        // Gérer le changement de section dans le menu
        var menuItems = document.querySelectorAll('.menu li');
        menuItems.forEach(function(item) {
            item.addEventListener('click', function() {
                var sectionTitle = document.getElementById('section-title');
                sectionTitle.textContent = this.textContent;
            });
        });
    });
    
    // Fonction pour enregistrer une tâche dans le stockage local
    function saveTask(task, dueDate, reminder, repeat, taskId) {
        var tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        tasks.push({ id: taskId, task: task, dueDate: dueDate, reminder: reminder, repeat: repeat });
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Fonction pour charger les tâches depuis le stockage local
    function loadTasks() {
        var tasks = JSON.parse(localStorage.getItem('tasks'));
        if (tasks) {
            tasks.forEach(function(task) {
                // Créer l'élément de tâche avec le bouton de suppression
                var taskItem = createTaskElement(task.task, task.dueDate, task.reminder, task.repeat, task.id);
                
                // Ajouter l'élément de tâche à la section .content
                document.querySelector('.content').appendChild(taskItem);
            });
        }
    }
    
    // Fonction pour créer un élément de tâche avec bouton de suppression
    function createTaskElement(task, dueDate, reminder, repeat, taskId) {
        var taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        taskItem.dataset.taskId = taskId; // Définir l'identifiant unique de la tâche
        taskItem.innerHTML = `
            <p>Tâche : ${task}</p>
            <p>Date d'échéance : ${dueDate}</p>
            <p>Rappel : ${reminder ? 'Oui' : 'Non'}</p>
            <p>Répéter : ${repeat ? 'Oui' : 'Non'}</p>
        `;
    
        var deleteButton = document.createElement('button');
        deleteButton.textContent = 'Supprimer';
        deleteButton.classList.add('delete-button');
        deleteButton.dataset.taskId = taskId; // Définir l'identifiant unique de la tâche pour le bouton de suppression
    
        taskItem.appendChild(deleteButton);
    
        return taskItem;
    }
    
    // Fonction pour générer un identifiant unique
    function generateUniqueId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Nouvelle fonction pour supprimer une tâche et mettre à jour le stockage local
    function deleteTaskAndUpdateStorage(taskId) {
        var tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        var updatedTasks = tasks.filter(function(task) {
            return task.id !== taskId;
        });
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    }
    
});
