/**
 * @typedef {Object} Todo
 * @property {number} id
 * @property {string} text
 * @property {boolean} completed
 * @property {number|null} parentId  // This is the key to flat structure
 */

class TodoManager {
  constructor() {
    this.todos = []; // Single flat array for all todos
    this.todoInput = document.getElementById("todo-input");
    this.todoList = document.getElementById("todo-list");
    this.addBtn = document.getElementById("add-btn");

    this.history = [];
    this.historyIndex = -1;

    this.totalCount = document.getElementById("total-count");
    this.completedCount = document.getElementById("completed-count");
    this.clearCompletedBtn = document.getElementById("clear-completed");
    this.searchTimeout = null;

    this.currentFilter = "all";
    this.initializeEventListeners();
    this.initializeKeyboardShortcuts();
    this.initializeFilters();
    this.render();
  }

  // Efficient helpers for accessing the flat structure
  /**
   * Gets all subtasks for a given todo
   * @param {number} parentId
   * @returns {Todo[]}
   */
  getSubtasks(parentId) {
    return this.todos.filter((todo) => todo.parentId === parentId);
  }

  /**
   * Gets all top-level todos
   * @returns {Todo[]}
   */
  getTopLevelTodos() {
    return this.todos.filter((todo) => todo.parentId === null);
  }

  createTodoElement(todo) {
    const li = document.createElement("li");
    li.dataset.id = todo.id;
    li.setAttribute("role", "listitem");
    li.innerHTML = this.createTodoTemplate(todo);
    this.attachEventListeners(li, todo);
    return li;
  }

  /**
   * Attaches event listeners to todo item elements
   * @param {HTMLElement} li - The list item element
   * @param {Todo} todo - The associated todo item
   */
  attachEventListeners(li, todo) {
    const checkbox = li.querySelector(".todo-checkbox");
    const deleteBtn = li.querySelector(".delete-btn");
    const addSubtaskBtn = li.querySelector(".add-subtask-btn");

    checkbox.addEventListener("change", () => this.toggleTodo(todo.id));
    deleteBtn.addEventListener("click", () => this.deleteTodo(todo.id));
    if (addSubtaskBtn) {
      addSubtaskBtn.addEventListener("click", () => this.addSubtask(todo.id));
    }
  }

  createTodoTemplate(todo) {
    const subtasks = this.getSubtasks(todo.id);
    return `
      <div class="todo-content">
        <input 
          type="checkbox" 
          class="todo-checkbox" 
          ${todo.completed ? "checked" : ""}
          aria-label="Mark task as ${
            todo.completed ? "incomplete" : "complete"
          }"
        >
        <span class="${todo.completed ? "completed" : ""}" role="text">${
      todo.text
    }</span>
        ${
          !todo.parentId
            ? `
          <button class="add-subtask-btn" aria-label="Add subtask">
            <span class="material-icons-outlined">add_task</span>
          </button>
        `
            : ""
        }
        <button class="delete-btn" aria-label="Delete task">
          <span>
            <span class="material-icons-outlined trash-closed" aria-hidden="true">delete</span>
            <span class="material-icons trash-open" aria-hidden="true">delete</span>
          </span>
        </button>
      </div>
      ${
        subtasks.length
          ? `
        <ul class="subtasks">
          ${subtasks
            .map(
              (subtask) => `
            <li data-id="${subtask.id}" role="listitem" class="subtask">
              ${this.createTodoTemplate(subtask)}
            </li>
          `
            )
            .join("")}
        </ul>
      `
          : ""
      }
    `;
  }

  addSubtask(parentId) {
    const text = prompt("Enter subtask:");
    if (!text?.trim()) return;

    const subtask = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      parentId,
    };

    this.todos.push(subtask);
    this.saveState();
    this.render();
  }

  deleteTodo(id) {
    if (confirm("Are you sure you want to delete this task?")) {
      // Remove the todo from the array
      this.todos = this.todos.filter(
        (todo) => todo.id !== id && todo.parentId !== id
      );

      // Re-render the list
      this.saveState();
      this.render();
    }
  }

  toggleTodo(id) {
    const todo = this.todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      // Toggle all subtasks
      this.todos
        .filter((t) => t.parentId === id)
        .forEach((subtask) => (subtask.completed = todo.completed));
      this.saveState();
      this.render();
    }
  }

  // Add undo/redo functionality
  saveState() {
    // Remove any future states if we're in the middle of the history
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(JSON.stringify(this.todos));
    this.historyIndex++;
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.todos = JSON.parse(this.history[this.historyIndex]);
      this.render();
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.todos = JSON.parse(this.history[this.historyIndex]);
      this.render();
    }
  }

  // Add keyboard shortcuts
  initializeKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        this.undo();
      }
      // Ctrl/Cmd + Y for redo
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        this.redo();
      }
      if (e.key === "Escape") {
        this.todoInput.blur();
      }
      if (e.key === "/" && !e.target.matches("input")) {
        e.preventDefault();
        this.todoInput.focus();
      }
    });
  }

  // Simplify the render function by removing async code
  render() {
    const fragment = document.createDocumentFragment();
    const filteredTodos = this.getFilteredTodos().sort((a, b) => {
      // Sort by completion status first
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Then by date
      return b.id - a.id;
    });

    this.todoList.innerHTML = "";

    if (filteredTodos.length === 0) {
      const emptyMessage = document.createElement("li");
      emptyMessage.className = "empty-message";
      emptyMessage.textContent = "No tasks found";
      fragment.appendChild(emptyMessage);
    } else {
      filteredTodos.forEach((todo) => {
        const li = this.createTodoElement(todo);
        fragment.appendChild(li);
      });
    }

    this.todoList.appendChild(fragment);
    this.updateCounts();
  }

  /**
   * Sets up event listeners for adding new todos
   */
  initializeEventListeners() {
    // Handle add button clicks
    this.addBtn.addEventListener("click", () => {
      try {
        this.addTodo(this.todoInput.value);
        this.todoInput.value = "";
      } catch (error) {
        alert(error.message);
      }
    });

    // Handle Enter key in input field
    this.todoInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        try {
          this.addTodo(this.todoInput.value);
          this.todoInput.value = "";
        } catch (error) {
          alert(error.message);
        }
      }
    });

    // Add search functionality
    this.todoInput.addEventListener("input", (e) => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.searchTodos(e.target.value);
      }, 300);
    });

    // Add clear completed functionality
    this.clearCompletedBtn.addEventListener("click", () => {
      this.clearCompleted();
    });
  }

  /**
   * Creates and adds a new top-level todo item
   * @param {string} text - Text content for the new todo
   * @throws {Error} If text is empty
   */
  addTodo(text) {
    if (!text?.trim()) {
      throw new Error("Todo text cannot be empty");
    }
    if (text.length > 100) {
      throw new Error("Todo text is too long (max 100 characters)");
    }

    const newTodo = {
      id: Date.now(),
      text: text.trim(),
      completed: false,
      parentId: null,
    };

    this.todos.push(newTodo);
    this.saveState();
    this.render();

    const newElement = document.querySelector(`li[data-id="${newTodo.id}"]`);
    if (newElement) {
      newElement.classList.add("todo-enter");
    }
  }

  updateCounts() {
    const total = this.todos.length;
    const completed = this.todos.filter((todo) => todo.completed).length;
    this.totalCount.textContent = total;
    this.completedCount.textContent = completed;
  }

  clearCompleted() {
    if (confirm("Are you sure you want to clear all completed tasks?")) {
      this.todos = this.todos.filter((todo) => !todo.completed);
      this.saveState();
      this.render();
    }
  }

  searchTodos(query) {
    if (!query) {
      this.render();
      return;
    }

    const searchResults = this.todos.filter((todo) =>
      todo.text.toLowerCase().includes(query.toLowerCase())
    );
    this.renderSearchResults(searchResults);
  }

  initializeFilters() {
    const filterBtns = document.querySelectorAll(".filter-btn");
    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentFilter = btn.dataset.filter;
        this.render();
      });
    });
  }

  getFilteredTodos() {
    const todos = this.getTopLevelTodos();
    switch (this.currentFilter) {
      case "active":
        return todos.filter((todo) => !todo.completed);
      case "completed":
        return todos.filter((todo) => todo.completed);
      default:
        return todos;
    }
  }
}

// Create an instance of TodoManager when the script loads
const todoApp = new TodoManager();
