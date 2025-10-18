const addBtn = document.getElementById("add-btn");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const filterBtns = document.querySelectorAll(".filter-btn");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", e => {
  if (e.key === "Enter") addTask();
});

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".active").classList.remove("active");
    btn.classList.add("active");
    displayTasks(btn.dataset.filter);
  });
});

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return alert("Enter a task!");
  tasks.push({ text, completed: false });
  saveTasks();
  taskInput.value = "";
  displayTasks();
}

function displayTasks(filter = "all") {
  taskList.innerHTML = "";

  let filteredTasks = tasks.filter(task => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  filteredTasks.forEach((task, index) => {
    const li = document.createElement("li");
    li.classList.toggle("completed", task.completed);

    li.innerHTML = `
      <span>${task.text}</span>
      <div class="action-btns">
        <button onclick="toggleTask(${index})">✔</button>
        <button onclick="editTask(${index})">✏️</button>
        <button onclick="deleteTask(${index})">❌</button>
      </div>
    `;
    taskList.appendChild(li);
  });
}

function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();
  displayTasks(document.querySelector(".active").dataset.filter);
}

function editTask(index) {
  const newText = prompt("Edit your task:", tasks[index].text);
  if (newText !== null && newText.trim() !== "") {
    tasks[index].text = newText.trim();
    saveTasks();
    displayTasks(document.querySelector(".active").dataset.filter);
  }
}

function deleteTask(index) {
  if (confirm("Delete this task?")) {
    tasks.splice(index, 1);
    saveTasks();
    displayTasks(document.querySelector(".active").dataset.filter);
  }
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

displayTasks();
