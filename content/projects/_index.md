---
title: "🚀 项目展示"
layout: "projects"
---

# 项目展示

这里展示了我在学生生涯中参与的各类项目，涵盖遥感、深度学习、工具开发等多个领域。

<div class="project-stats" id="project-stats">
  <span class="stat-item">📦 加载中...</span>
</div>

<div class="view-toggle">
  <button class="toggle-btn active" onclick="switchView('gallery')">🎨 Gallery</button>
  <button class="toggle-btn" onclick="switchView('list')">📋 List</button>
</div>

<div class="category-filter">
  <button class="filter-btn active" onclick="filterProjects('all')">全部</button>
  <button class="filter-btn" onclick="filterProjects('remote-sensing')">遥感</button>
  <button class="filter-btn" onclick="filterProjects('ai-deep-learning')">AI/深度学习</button>
  <button class="filter-btn" onclick="filterProjects('tools-platforms')">工具/平台</button>
  <button class="filter-btn" onclick="filterProjects('data-processing')">数据处理</button>
</div>

<div id="projects-gallery" class="projects-grid gallery-view"></div>
<div id="projects-list" class="projects-list list-view" style="display: none;"></div>

<div class="loading-spinner" id="loading">
  <div class="spinner"></div>
  <p>加载项目中...</p>
</div>

<script>
const API_BASE = 'https://api.spacetop.win/api';
let currentView = 'gallery';
let currentCategory = 'all';
let allProjects = [];

async function loadProjects() {
  try {
    const response = await fetch(`${API_BASE}/projects?limit=50`);
    const data = await response.json();
    allProjects = data.projects;
    
    document.getElementById('project-stats').innerHTML = 
      `<span class="stat-item">📦 共 ${data.total} 个项目</span>`;
    
    renderProjects(allProjects);
    document.getElementById('loading').style.display = 'none';
  } catch (error) {
    console.error('Failed to load projects:', error);
    document.getElementById('loading').innerHTML = 
      '<p style="color: #e74c3c;">加载失败，请刷新页面重试</p>';
  }
}

function renderProjects(projects) {
  const filtered = currentCategory === 'all' 
    ? projects 
    : projects.filter(p => p.category === currentCategory);
  
  renderGallery(filtered);
  renderList(filtered);
}

function renderGallery(projects) {
  const gallery = document.getElementById('projects-gallery');
  
  const categoryIcons = {
    'remote-sensing': '🛰️',
    'ai-deep-learning': '🤖',
    'tools-platforms': '🛠️',
    'data-processing': '📊',
    'other': '📁'
  };
  
  const styleClasses = {
    'academic': 'card-academic',
    'tech': 'card-tech'
  };
  
  gallery.innerHTML = projects.map(project => {
    const icon = categoryIcons[project.category] || '📁';
    const styleClass = styleClasses[project.style] || 'card-academic';
    const tags = JSON.parse(project.tags || '[]');
    const techStack = JSON.parse(project.tech_stack || '[]');
    
    return `
      <div class="project-card ${styleClass}" data-category="${project.category}" onclick="showProjectDetail('${project.slug}')">
        <div class="card-header">
          <span class="card-icon">${icon}</span>
          <h3 class="card-title">${project.title}</h3>
        </div>
        <p class="card-description">${project.description || '暂无描述'}</p>
        <div class="card-tags">
          ${tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <div class="card-links">
          ${project.github_url ? `<a href="${project.github_url}" target="_blank" class="link-btn" onclick="event.stopPropagation()">GitHub</a>` : ''}
          ${project.paper_url ? `<a href="${project.paper_url}" target="_blank" class="link-btn" onclick="event.stopPropagation()">Paper</a>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderList(projects) {
  const list = document.getElementById('projects-list');
  
  list.innerHTML = `
    <table class="projects-table">
      <thead>
        <tr>
          <th>项目名称</th>
          <th>类别</th>
          <th>描述</th>
          <th>链接</th>
        </tr>
      </thead>
      <tbody>
        ${projects.map(project => `
          <tr onclick="showProjectDetail('${project.slug}')">
            <td class="project-name">${project.title}</td>
            <td><span class="category-badge">${getCategoryName(project.category)}</span></td>
            <td class="project-desc">${(project.description || '').substring(0, 100)}${(project.description || '').length > 100 ? '...' : ''}</td>
            <td class="project-links">
              ${project.github_url ? `<a href="${project.github_url}" target="_blank" onclick="event.stopPropagation()">GitHub</a>` : ''}
              ${project.paper_url ? `<a href="${project.paper_url}" target="_blank" onclick="event.stopPropagation()">Paper</a>` : ''}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function getCategoryName(category) {
  const names = {
    'remote-sensing': '遥感',
    'ai-deep-learning': 'AI/深度学习',
    'tools-platforms': '工具/平台',
    'data-processing': '数据处理',
    'other': '其他'
  };
  return names[category] || category;
}

function switchView(view) {
  currentView = view;
  
  document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  document.getElementById('projects-gallery').style.display = view === 'gallery' ? 'grid' : 'none';
  document.getElementById('projects-list').style.display = view === 'list' ? 'block' : 'none';
}

function filterProjects(category) {
  currentCategory = category;
  
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  renderProjects(allProjects);
}

function showProjectDetail(slug) {
  window.location.href = `/projects/${slug}`;
}

document.addEventListener('DOMContentLoaded', loadProjects);
</script>
