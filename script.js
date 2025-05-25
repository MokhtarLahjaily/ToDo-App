class TodoApp {
    constructor() {
        this.tasks = this.loadTasks();
        this.currentFilter = 'all';
        this.editingTaskId = null;
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderTasks();
        this.updateStats();
    }

    bindEvents() {
        const taskInput = document.getElementById('taskInput');
        const addBtn = document.getElementById('addBtn');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const searchInput = document.getElementById('searchInput');

        addBtn.addEventListener('click', () => this.addTask());
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTask();
        });
        taskInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.editingTaskId) {
                this.cancelEditing();
            }
        });

        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderTasks();
        });

        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        const categorySelect = document.getElementById('categorySelect');
        const text = taskInput.value.trim();

        if (!text) {
            taskInput.focus();
            return;
        }

        if (this.editingTaskId) {
            const task = this.tasks.find(t => t.id === this.editingTaskId);
            if (task) {
                task.text = text;
                task.priority = prioritySelect.value;
                task.category = categorySelect.value;
                task.updatedAt = new Date().toLocaleString('fr-FR');
            }
            this.editingTaskId = null;
            document.getElementById('addBtn').textContent = 'Ajouter';
            document.getElementById('addBtn').classList.remove('editing');
        } else {
            const task = {
                id: Date.now(),
                text: text,
                completed: false,
                priority: prioritySelect.value,
                category: categorySelect.value,
                createdAt: new Date().toLocaleString('fr-FR')
            };
            this.tasks.unshift(task);
        }

        this.saveTasks();
        this.renderTasks();
        this.updateStats();

        taskInput.value = '';
        prioritySelect.value = 'low';
        categorySelect.value = 'general';
        taskInput.focus();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    deleteTask(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            this.tasks = this.tasks.filter(t => t.id !== id);
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        
        this.renderTasks();
    }

    getFilteredTasks() {
        let filteredTasks = this.tasks;

        // Apply search filter
        if (this.searchQuery) {
            filteredTasks = filteredTasks.filter(task => 
                task.text.toLowerCase().includes(this.searchQuery)
            );
        }

        // Apply category and status filters
        switch (this.currentFilter) {
            case 'completed':
                filteredTasks = filteredTasks.filter(task => task.completed);
                break;
            case 'pending':
                filteredTasks = filteredTasks.filter(task => !task.completed);
                break;
            case 'high':
                filteredTasks = filteredTasks.filter(task => task.priority === 'high');
                break;
            case 'today':
                const today = new Date().toLocaleDateString('fr-FR');
                filteredTasks = filteredTasks.filter(task => {
                    const taskDate = new Date(task.createdAt).toLocaleDateString('fr-FR');
                    return taskDate === today;
                });
                break;
        }

        return filteredTasks;
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            this.editingTaskId = id;
            const taskInput = document.getElementById('taskInput');
            const prioritySelect = document.getElementById('prioritySelect');
            const categorySelect = document.getElementById('categorySelect');
            const addBtn = document.getElementById('addBtn');
            
            taskInput.value = task.text;
            prioritySelect.value = task.priority;
            categorySelect.value = task.category;
            addBtn.textContent = 'Modifier';
            addBtn.classList.add('editing');
            taskInput.focus();
        }
    }

    cancelEditing() {
        this.editingTaskId = null;
        const taskInput = document.getElementById('taskInput');
        const prioritySelect = document.getElementById('prioritySelect');
        const addBtn = document.getElementById('addBtn');
        
        taskInput.value = '';
        prioritySelect.value = 'low';
        addBtn.textContent = 'Ajouter';
        addBtn.classList.remove('editing');
        taskInput.focus();
    }

    renderTasks() {
        const tasksList = document.getElementById('tasksList');
        const filteredTasks = this.getFilteredTasks();

        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <p>${this.getEmptyMessage()}</p>
                </div>
            `;
            return;
        }

        tasksList.innerHTML = filteredTasks.map(task => `
            <div class="task-item ${task.completed ? 'completed' : ''} ${task.priority}-priority">
                <input type="checkbox" class="task-checkbox" 
                       ${task.completed ? 'checked' : ''} 
                       onchange="app.toggleTask(${task.id})">
                <div class="task-text ${task.completed ? 'completed' : ''}">${task.text}</div>
                <span class="task-category category-${task.category}">
                    ${this.getCategoryLabel(task.category)}
                </span>
                <span class="task-priority priority-${task.priority}">
                    ${this.getPriorityLabel(task.priority)}
                </span>
                <span class="task-date">${task.updatedAt || task.createdAt}</span>
                <div class="task-actions">
                    <button class="edit-btn" onclick="app.editTask(${task.id})">✎</button>
                    <button class="delete-btn" onclick="app.deleteTask(${task.id})">×</button>
                </div>
            </div>
        `).join('');
    }

    getPriorityLabel(priority) {
        const labels = {
            'low': 'Faible',
            'medium': 'Moyenne',
            'high': 'Élevée'
        };
        return labels[priority] || priority;
    }

    getCategoryLabel(category) {
        const labels = {
            'general': 'Général',
            'travail': 'Travail',
            'personnel': 'Personnel',
            'courses': 'Courses',
            'sante': 'Santé'
        };
        return labels[category] || category;
    }

    getEmptyMessage() {
        if (this.searchQuery) {
            return 'Aucune tâche ne correspond à votre recherche.';
        }
        const messages = {
            'all': 'Aucune tâche pour le moment. Ajoutez votre première tâche !',
            'completed': 'Aucune tâche terminée.',
            'pending': 'Aucune tâche en cours. Bon travail !',
            'high': 'Aucune tâche de priorité élevée.',
            'today': 'Aucune tâche pour aujourd\'hui.'
        };
        return messages[this.currentFilter] || 'Aucune tâche trouvée.';
    }

    updateStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;

        document.getElementById('totalTasks').textContent = total;
        document.getElementById('completedTasks').textContent = completed;
        document.getElementById('pendingTasks').textContent = pending;
    }

    saveTasks() {
        try {
            localStorage.setItem('todoTasks', JSON.stringify(this.tasks));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde des tâches:', error);
        }
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('todoTasks');
            return saved ? JSON.parse(saved) : this.getDefaultTasks();
        } catch (error) {
            console.error('Erreur lors du chargement des tâches:', error);
            return this.getDefaultTasks();
        }
    }

    getDefaultTasks() {
        return [
            {
                id: 1,
                text: "Bienvenue dans votre application ToDo !",
                completed: false,
                priority: "medium",
                createdAt: new Date().toLocaleString('fr-FR')
            },
            {
                id: 2,
                text: "Cliquez sur cette case pour marquer comme terminé",
                completed: false,
                priority: "low",
                createdAt: new Date().toLocaleString('fr-FR')
            }
        ];
    }
}

// Initialisation de l'application
const app = new TodoApp();

// Ajout d'animations et d'effets visuels
document.addEventListener('DOMContentLoaded', function() {
    // Animation d'entrée pour les éléments
    const elements = document.querySelectorAll('.container > *');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        setTimeout(() => {
            element.style.transition = 'all 0.5s ease';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, index * 100);
    });
}); 