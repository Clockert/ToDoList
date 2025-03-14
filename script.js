// Select DOM elements
const todoInput = document.getElementById("todo-input");
const addBtn = document.getElementById("add-btn");
const todoList = document.getElementById("todo-list");

// Array to store todos
let todos = [];

// Function to render todos
function renderTodos() {
  todoList.innerHTML = "";

  // Sort todos: incomplete first, then completed
  const sortedTodos = todos.sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  sortedTodos.forEach((todo, index) => {
    const li = document.createElement("li");

    // Create checkbox instead of radio
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.className = "todo-checkbox";
    checkbox.addEventListener("change", () => toggleTodo(index));

    // Create text span
    const textSpan = document.createElement("span");
    textSpan.textContent = todo.text;
    if (todo.completed) {
      textSpan.classList.add("completed");
    }

    // Create delete button
    const deleteBtn = document.createElement("button");
    const iconSpan = document.createElement("span");
    iconSpan.innerHTML = `
      <span class="material-icons-outlined trash-closed">delete</span>
      <span class="material-icons trash-open">delete</span>
    `;
    deleteBtn.appendChild(iconSpan);
    deleteBtn.addEventListener("click", () => deleteTodo(index));

    // Append elements
    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(deleteBtn);
    todoList.appendChild(li);
  });
}

// Function to add a new todo
function addTodo() {
  const todoText = todoInput.value.trim();

  // Check if the input is not empty
  if (todoText !== "") {
    // Create a new todo object
    const newTodo = {
      id: Date.now(), // Unique ID using timestamp
      text: todoText,
      completed: false, // Add completed property
    };

    // Add the new todo to the todos array
    todos.push(newTodo);

    // Clear the input field
    todoInput.value = "";

    // Re-render the todo list
    renderTodos();
  } else {
    alert("Please enter a task!");
  }
}

// Function to delete a todo
function deleteTodo(index) {
  // Remove the todo from the todos array
  todos.splice(index, 1);

  // Re-render the todo list
  renderTodos();
}

// New function to toggle todo completion
function toggleTodo(index) {
  todos[index].completed = !todos[index].completed;
  renderTodos();
}

// Event listener for the Add button
addBtn.addEventListener("click", addTodo);

// Event listener for pressing Enter in the input field
todoInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    addTodo();
  }
});

// Initial render (in case there are any preloaded todos)
renderTodos();
