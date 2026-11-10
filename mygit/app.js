/**
 * Car-Sharing Daily Task Manager
 * Pure Vanilla JavaScript Implementation
 * Dual-Mode: Automatically syncs with Backend REST API if server is running,
 * and seamlessly falls back to LocalStorage when offline or running locally via file://
 */

// Category Definitions & Metadata
const CATEGORIES = {
  chat: { label: '채팅', icon: '💬', className: 'chat' },
  mypage: { label: '마이페이지', icon: '👤', className: 'mypage' },
  payment: { label: '결제수단', icon: '💳', className: 'payment' }
};

const STORAGE_KEY = 'carshare_daily_tasks';

// Default initial tasks if user has no saved data
const DEFAULT_TASKS = [
  {
    id: 1,
    text: '사고 접수 실시간 채팅 상담 봇 알림 테스트',
    category: 'chat',
    completed: true,
    createdAt: Date.now() - 3600000
  },
  {
    id: 2,
    text: '신규 가입자 운전면허 진위확인 API 연동 심사',
    category: 'mypage',
    completed: false,
    createdAt: Date.now() - 1800000
  },
  {
    id: 3,
    text: '하이패스 주행 요금 미납 건 재승인 로직 점검',
    category: 'payment',
    completed: false,
    createdAt: Date.now()
  }
];

// App State
let tasks = [];
let currentFilter = 'all';
let editingTaskId = null;
let isBackendConnected = false;

// DOM Elements
const todayDateEl = document.getElementById('todayDate');
const progressBarFillEl = document.getElementById('progressBarFill');
const progressStatEl = document.getElementById('progressStat');
const progressMessageEl = document.getElementById('progressMessage');

const taskForm = document.getElementById('taskForm');
const categorySelect = document.getElementById('categorySelect');
const taskInput = document.getElementById('taskInput');

const filterTabs = document.getElementById('filterTabs');
const countAllEl = document.getElementById('countAll');
const countChatEl = document.getElementById('countChat');
const countMypageEl = document.getElementById('countMypage');
const countPaymentEl = document.getElementById('countPayment');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

const taskListEl = document.getElementById('taskList');
const emptyStateEl = document.getElementById('emptyState');

// Modal Elements
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editCategorySelect = document.getElementById('editCategorySelect');
const editTaskInput = document.getElementById('editTaskInput');
const cancelEditBtn = document.getElementById('cancelEditBtn');

/**
 * Initialize Application
 */
async function init() {
  renderTodayDate();
  setupEventListeners();
  await loadTasks();
}

/**
 * Format and display today's date in Korean
 */
function renderTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const date = String(now.getDate()).padStart(2, '0');
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[now.getDay()];

  if (todayDateEl) {
    todayDateEl.textContent = `${year}. ${month}. ${date} (${dayName})`;
  }
}

/**
 * Load tasks: Tries Backend REST API first, then falls back to LocalStorage
 */
async function loadTasks() {
  if (window.location.protocol.startsWith('http')) {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        tasks = await response.json();
        isBackendConnected = true;
        saveToLocalStorageBackup();
        render();
        return;
      }
    } catch (err) {
      console.warn('Backend API connection failed, falling back to LocalStorage:', err);
    }
  }

  // Fallback to LocalStorage
  isBackendConnected = false;
  loadFromLocalStorage();
  render();
}

/**
 * LocalStorage Loader
 */
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      tasks = JSON.parse(saved);
    } else {
      tasks = [...DEFAULT_TASKS];
      saveToLocalStorageBackup();
    }
  } catch (err) {
    console.error('Failed to load tasks from localStorage:', err);
    tasks = [];
  }
}

/**
 * Save current tasks to LocalStorage backup
 */
function saveToLocalStorageBackup() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage:', err);
  }
}

/**
 * Event Listeners Registration
 */
function setupEventListeners() {
  // Add new task
  taskForm.addEventListener('submit', handleAddTask);

  // Filter tabs
  filterTabs.addEventListener('click', handleFilterChange);

  // Clear completed tasks
  clearCompletedBtn.addEventListener('click', handleClearCompleted);

  // Edit modal
  editForm.addEventListener('submit', handleSaveEdit);
  cancelEditBtn.addEventListener('click', closeEditModal);
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });

  // Keyboard shortcut: ESC to close modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && editModal.classList.contains('active')) {
      closeEditModal();
    }
  });
}

/**
 * Add Task Handler (Optimistic UI with Backend Sync)
 */
async function handleAddTask(e) {
  e.preventDefault();
  const text = taskInput.value.trim();
  const category = categorySelect.value;

  if (!text) return;

  const newTask = {
    id: Date.now(),
    text,
    category,
    completed: false,
    createdAt: Date.now()
  };

  tasks.unshift(newTask); // Optimistic UI update
  saveToLocalStorageBackup();
  render();

  taskInput.value = '';
  taskInput.focus();

  // Sync with Backend API if connected
  if (isBackendConnected) {
    try {
      await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });
    } catch (err) {
      console.warn('Backend sync failed on add task:', err);
    }
  }
}

/**
 * Toggle Task Completion
 */
async function toggleTask(id) {
  let updatedTask = null;

  tasks = tasks.map(task => {
    if (task.id === id) {
      updatedTask = { ...task, completed: !task.completed };
      return updatedTask;
    }
    return task;
  });

  saveToLocalStorageBackup();
  render();

  // Sync with Backend API
  if (isBackendConnected && updatedTask) {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: updatedTask.completed })
      });
    } catch (err) {
      console.warn('Backend sync failed on toggle task:', err);
    }
  }
}

/**
 * Delete Task
 */
async function deleteTask(id) {
  const target = tasks.find(t => t.id === id);
  if (!target) return;

  if (confirm(`'${target.text}' 업무를 삭제하시겠습니까?`)) {
    tasks = tasks.filter(task => task.id !== id);
    saveToLocalStorageBackup();
    render();

    // Sync with Backend API
    if (isBackendConnected) {
      try {
        await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Backend sync failed on delete task:', err);
      }
    }
  }
}

/**
 * Open Edit Modal
 */
function openEditModal(id) {
  const target = tasks.find(t => t.id === id);
  if (!target) return;

  editingTaskId = id;
  editTaskInput.value = target.text;
  editCategorySelect.value = target.category;

  editModal.classList.add('active');
  editModal.setAttribute('aria-hidden', 'false');
  editTaskInput.focus();
}

/**
 * Close Edit Modal
 */
function closeEditModal() {
  editingTaskId = null;
  editModal.classList.remove('active');
  editModal.setAttribute('aria-hidden', 'true');
}

/**
 * Save Edited Task
 */
async function handleSaveEdit(e) {
  e.preventDefault();
  if (!editingTaskId) return;

  const newText = editTaskInput.value.trim();
  const newCategory = editCategorySelect.value;

  if (!newText) {
    alert('내용을 입력해주세요.');
    return;
  }

  let updatedTask = null;

  tasks = tasks.map(task => {
    if (task.id === editingTaskId) {
      updatedTask = {
        ...task,
        text: newText,
        category: newCategory
      };
      return updatedTask;
    }
    return task;
  });

  saveToLocalStorageBackup();
  closeEditModal();
  render();

  // Sync with Backend API
  if (isBackendConnected && updatedTask) {
    try {
      await fetch(`/api/tasks/${editingTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText, category: newCategory })
      });
    } catch (err) {
      console.warn('Backend sync failed on edit task:', err);
    }
  }
}

/**
 * Filter change handler
 */
function handleFilterChange(e) {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;

  const filter = btn.dataset.filter;
  if (!filter) return;

  currentFilter = filter;

  // Update active tab style
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  render();
}

/**
 * Clear All Completed Tasks
 */
async function handleClearCompleted() {
  const completedCount = tasks.filter(t => t.completed).length;
  if (completedCount === 0) {
    alert('완료된 항목이 없습니다.');
    return;
  }

  if (confirm(`완료된 ${completedCount}개의 업무를 목록에서 정리하시겠습니까?`)) {
    tasks = tasks.filter(task => !task.completed);
    saveToLocalStorageBackup();
    render();

    // Sync with Backend API
    if (isBackendConnected) {
      try {
        await fetch('/api/tasks/completed', { method: 'DELETE' });
      } catch (err) {
        console.warn('Backend sync failed on clear completed:', err);
      }
    }
  }
}

/**
 * Calculate and Update Progress Bar
 */
function updateProgress() {
  const total = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  // Update Progress Bar
  progressBarFillEl.style.width = `${percentage}%`;
  progressStatEl.textContent = `${completedCount}/${total} 완료 (${percentage}%)`;

  // Dynamic Messages & Styles
  if (percentage === 100 && total > 0) {
    progressBarFillEl.classList.add('complete');
    progressMessageEl.textContent = '🎉 오늘 카쉐어링 업무를 100% 모두 완수했습니다! 완벽해요!';
  } else {
    progressBarFillEl.classList.remove('complete');
    if (total === 0) {
      progressMessageEl.textContent = '오늘 처리할 카쉐어링 업무를 등록해보세요!';
    } else if (percentage === 0) {
      progressMessageEl.textContent = '아직 완료된 업무가 없습니다. 첫 업무를 시작해보세요! 🚗';
    } else if (percentage < 50) {
      progressMessageEl.textContent = '차근차근 진행 중입니다. 오늘도 힘내세요! 💪';
    } else {
      progressMessageEl.textContent = '절반 이상 달성! 목표 달성이 눈앞입니다! 🚀';
    }
  }
}

/**
 * Update Category Count Badges
 */
function updateBadges() {
  const countAll = tasks.length;
  const countChat = tasks.filter(t => t.category === 'chat').length;
  const countMypage = tasks.filter(t => t.category === 'mypage').length;
  const countPayment = tasks.filter(t => t.category === 'payment').length;

  countAllEl.textContent = countAll;
  countChatEl.textContent = countChat;
  countMypageEl.textContent = countMypage;
  countPaymentEl.textContent = countPayment;
}

/**
 * Render Task List
 */
function renderTaskList() {
  // Filter items
  const filteredTasks = tasks.filter(task => {
    if (currentFilter === 'all') return true;
    return task.category === currentFilter;
  });

  // Empty state handling
  if (filteredTasks.length === 0) {
    emptyStateEl.classList.add('show');
    taskListEl.innerHTML = '';
    return;
  } else {
    emptyStateEl.classList.remove('show');
  }

  // Render items
  taskListEl.innerHTML = filteredTasks.map(task => {
    const categoryInfo = CATEGORIES[task.category] || { label: '기타', icon: '📌', className: 'chat' };
    const isChecked = task.completed ? 'checked' : '';
    const itemClass = task.completed ? 'task-item completed' : 'task-item';

    return `
      <li class="${itemClass}" data-id="${task.id}">
        <input 
          type="checkbox" 
          class="task-checkbox" 
          ${isChecked} 
          aria-label="완료 체크"
          onchange="toggleTask(${task.id})"
        />
        <span class="category-badge ${categoryInfo.className}">
          ${categoryInfo.icon} ${categoryInfo.label}
        </span>
        <div class="task-content">
          <span class="task-text" onclick="toggleTask(${task.id})">${escapeHtml(task.text)}</span>
        </div>
        <div class="task-actions">
          <button 
            type="button" 
            class="btn-icon-action edit" 
            title="수정" 
            onclick="openEditModal(${task.id})"
          >
            ✏️
          </button>
          <button 
            type="button" 
            class="btn-icon-action delete" 
            title="삭제" 
            onclick="deleteTask(${task.id})"
          >
            🗑️
          </button>
        </div>
      </li>
    `;
  }).join('');
}

/**
 * Utility: Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Main Render Trigger
 */
function render() {
  updateProgress();
  updateBadges();
  renderTaskList();
}

// Global exposure for inline HTML event handlers
window.toggleTask = toggleTask;
window.deleteTask = deleteTask;
window.openEditModal = openEditModal;

// Run when DOM is ready
document.addEventListener('DOMContentLoaded', init);
