// Global Variables
let studyList = JSON.parse(localStorage.getItem('studyList')) || [];
let totalHours = 0;
let completedHours = 0;
let pomodoroInterval;
let timeLeft = 25 * 60;
let dailyGoal = parseInt(localStorage.getItem('dailyGoal')) || 6;
let isDarkMode = localStorage.getItem('isDarkMode') === 'true';
let studyData = JSON.parse(localStorage.getItem('studyData')) || [];
let analyticsChart;

// Load saved data on page load
window.onload = () => {
  renderStudyList();
  updateProgress();
  updateDarkMode();
  document.getElementById('dailyGoal').value = dailyGoal;
  initChart();
  showDailyAnalytics(); // Default to daily view
};

// Add a topic to the study list
function addTopic() {
  const topicInput = document.getElementById('topicInput');
  const hoursInput = document.getElementById('hoursInput');
  const priorityInput = document.getElementById('priorityInput');

  const topic = topicInput.value.trim();
  const hours = parseFloat(hoursInput.value.trim());
  const priority = priorityInput.value;

  if (!topic || isNaN(hours) || hours <= 0) {
    alert('Please enter a valid topic and hours.');
    return;
  }

  studyList.push({ topic, hours, priority, completed: false });
  saveToLocalStorage();
  renderStudyList();
  updateProgress();

  topicInput.value = '';
  hoursInput.value = '';
}

// Render the study list
function renderStudyList(list = studyList) {
  const studyListElement = document.getElementById('studyList');
  studyListElement.innerHTML = list
    .map(
      (item, index) => `
      <li class="${item.completed ? 'completed' : ''} ${item.priority}">
        <span>${item.topic} (${item.hours} hours) - ${item.priority}</span>
        <div>
          <button onclick="editTopic(${index})">✏️ Edit</button>
          <button onclick="deleteTopic(${index})">🗑️ Delete</button>
          <button onclick="completeTopic(${index})">${item.completed ? 'Undo' : 'Done'}</button>
        </div>
      </li>
    `
    )
    .join('');
}

// Mark a topic as completed or undo
function completeTopic(index) {
  studyList[index].completed = !studyList[index].completed;
  if (studyList[index].completed) {
    updateStudyData(studyList[index].hours);
  }
  saveToLocalStorage();
  renderStudyList();
  updateProgress();
}

// Edit a topic
function editTopic(index) {
  const topic = studyList[index];
  const newTopic = prompt('Edit topic:', topic.topic);
  const newHours = prompt('Edit hours:', topic.hours);
  const newPriority = prompt('Edit priority (High, Medium, Low):', topic.priority);

  if (newTopic && newHours && newPriority) {
    studyList[index] = {
      ...topic,
      topic: newTopic,
      hours: parseFloat(newHours),
      priority: newPriority,
    };
    saveToLocalStorage();
    renderStudyList();
  }
}

// Delete a topic
function deleteTopic(index) {
  if (confirm('Are you sure you want to delete this task?')) {
    studyList.splice(index, 1);
    saveToLocalStorage();
    renderStudyList();
  }
}

// Filter tasks
function filterTasks(filter) {
  const filteredList = studyList.filter((item) => {
    if (filter === 'completed') return item.completed;
    if (filter === 'all') return true;
    return item.priority === filter;
  });
  renderStudyList(filteredList);
}

// Update progress bar and totals
function updateProgress() {
  totalHours = studyList.reduce((sum, item) => sum + item.hours, 0);
  completedHours = studyList.reduce((sum, item) => (item.completed ? sum + item.hours : sum), 0);

  document.getElementById('totalHours').textContent = totalHours;
  document.getElementById('completedHours').textContent = completedHours;

  const progressFill = document.getElementById('progressFill');
  progressFill.style.width = totalHours === 0 ? '0%' : `${(completedHours / totalHours) * 100}%`;

  // Check daily goal
  dailyGoal = parseInt(document.getElementById('dailyGoal').value) || 6;
  localStorage.setItem('dailyGoal', dailyGoal);

  if (completedHours >= dailyGoal) {
    celebrate();
    showNotification('🎉 Congratulations! You’ve achieved your daily goal!');
  }
}

// Save study list to local storage
function saveToLocalStorage() {
  localStorage.setItem('studyList', JSON.stringify(studyList));
}

// Pomodoro Timer
function startPomodoro() {
  if (pomodoroInterval) clearInterval(pomodoroInterval);

  const workDuration = parseInt(document.getElementById('workDuration').value) || 25;
  timeLeft = workDuration * 60;

  pomodoroInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft < 0) {
      clearInterval(pomodoroInterval);
      showNotification('Time’s up! Take a break.');
      playSound();
      return;
    }
    updateTimerDisplay();
  }, 1000);
}

function resetPomodoro() {
  clearInterval(pomodoroInterval);
  const workDuration = parseInt(document.getElementById('workDuration').value) || 25;
  timeLeft = workDuration * 60;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById('time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Dark Mode Toggle
document.getElementById('darkModeToggle').addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  updateDarkMode();
  localStorage.setItem('isDarkMode', isDarkMode);
});

function updateDarkMode() {
  document.body.classList.toggle('dark-mode', isDarkMode);
}

// Export Data
function exportData() {
  const data = JSON.stringify(studyList);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'study-plan.json';
  a.click();
}

// Import Data
function importData(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    studyList = JSON.parse(e.target.result);
    saveToLocalStorage();
    renderStudyList();
    updateProgress();
  };
  reader.readAsText(file);
}

// Notifications
function showNotification(message) {
  if (Notification.permission === 'granted') {
    new Notification(message);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(message);
      }
    });
  }
}

// Sound Effects
function playSound() {
  const audio = document.getElementById('timerSound');
  audio.play();
}

// Confetti Animation
function celebrate() {
  const confettiSettings = { target: 'confettiCanvas', max: 150 };
  const confetti = new ConfettiGenerator(confettiSettings);
  confetti.render();
  setTimeout(() => confetti.clear(), 5000); // Stop after 5 seconds
}

// Analytics (Chart.js)
function initChart() {
  const ctx = document.getElementById('analyticsChart').getContext('2d');
  analyticsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Study Hours',
          data: [],
          backgroundColor: '#28a745',
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function updateChart(labels, data) {
  analyticsChart.data.labels = labels;
  analyticsChart.data.datasets[0].data = data;
  analyticsChart.update();
}

function showDailyAnalytics() {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const labels = daysOfWeek;
  const data = Array(7).fill(0);

  studyData.forEach((entry) => {
    const entryDate = new Date(entry.date);
    const dayOfWeek = entryDate.getDay();
    data[dayOfWeek] += entry.hours;
  });

  updateChart(labels, data);
}

function showWeeklyAnalytics() {
  const now = new Date();
  const labels = [];
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    labels.push(date.toLocaleDateString());

    const dayData = studyData.find((entry) => entry.date === date.toLocaleDateString());
    data.push(dayData ? dayData.hours : 0);
  }

  updateChart(labels, data);
}

function showMonthlyAnalytics() {
  const now = new Date();
  const labels = [];
  const data = [];

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), i, 1);
    labels.push(date.toLocaleString('default', { month: 'short' }));

    const monthData = studyData.filter((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === i && entryDate.getFullYear() === now.getFullYear();
    });

    data.push(monthData.reduce((sum, entry) => sum + entry.hours, 0));
  }

  updateChart(labels, data);
}

// Function to log study hours by date
function logStudyHours(hours) {
  const today = new Date().toLocaleDateString();
  const entry = studyData.find((entry) => entry.date === today);

  if (entry) {
    entry.hours += hours;
  } else {
    studyData.push({ date: today, hours });
  }

  localStorage.setItem('studyData', JSON.stringify(studyData));
}

// Call this function whenever a task is marked as completed
function updateStudyData(hours) {
  logStudyHours(hours);
  updateAnalytics();
}

function updateAnalytics() {
  showDailyAnalytics();
}