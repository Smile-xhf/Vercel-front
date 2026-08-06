// ============ 导航栏：滚动后显示 ============
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > window.innerHeight * 0.5) {
        navbar.classList.add('visible');
    } else {
        navbar.classList.remove('visible');
    }
});

// 导航链接平滑滚动
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            const offset = targetId === '#hero' ? 0 : 70;
            const top = targetSection.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// ============ 知识库渲染 ============
const knowledgeGrid = document.getElementById('knowledgeGrid');
const postDetail = document.getElementById('postDetail');
const postDetailContent = document.getElementById('postDetailContent');
const postDetailTitle = document.getElementById('postDetailTitle');
const backBtn = document.getElementById('backBtn');
const tocList = document.getElementById('tocList');
const postToc = document.getElementById('postToc');
const tocToggle = document.getElementById('tocToggle');

let currentCategory = null;
let scrollSpyObserver = null;

// 渲染分类卡片
function renderCategories() {
    knowledgeGrid.innerHTML = knowledgeCategories.map(cat => `
        <div class="category-card" data-category="${cat.id}" style="--card-color: ${cat.color}">
            <div class="category-icon"><i class="${cat.icon}"></i></div>
            <h3 class="category-title">${cat.title}</h3>
            <p class="category-desc">${cat.description}</p>
            <div class="category-meta">
                <span class="post-count">
                    <span class="count-num">${cat.posts.length}</span> 篇文章
                </span>
                <span class="view-detail">
                    查看详情 <i class="fas fa-arrow-right"></i>
                </span>
            </div>
        </div>
    `).join('');

    // 绑定点击事件
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const categoryId = card.dataset.category;
            openCategory(categoryId);
        });
    });
}

// 打开分类详情
function openCategory(categoryId) {
    const category = knowledgeCategories.find(c => c.id === categoryId);
    if (!category) return;

    currentCategory = category;
    postDetailTitle.textContent = category.title;

    // 生成目录
    tocList.innerHTML = category.posts.map((post, index) => `
        <li class="toc-item">
            <a class="toc-link" href="#post-${index}" data-index="${index}">
                <span class="toc-index">${index + 1}</span>
                <span class="toc-text">${post.title}</span>
            </a>
        </li>
    `).join('');

    // 生成文章内容
    postDetailContent.innerHTML = category.posts.map((post, index) => `
        <article class="post-item" id="post-${index}">
            <div class="post-header">
                <h3 class="post-title">${post.title}</h3>
                <span class="post-date">
                    <i class="far fa-calendar"></i> ${post.date}
                </span>
            </div>
            <div class="post-body">${post.content}</div>
            ${post.images && post.images.length > 0 ? `
                <div class="post-images">
                    ${post.images.map(src => `
                        <div class="post-image">
                            <img src="${src}" alt="${post.title}" loading="lazy">
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </article>
    `).join('');

    postDetail.classList.add('open');
    document.body.style.overflow = 'hidden';

    // 重置 TOC 状态
    postToc.classList.remove('open');
    document.querySelectorAll('.toc-link').forEach(link => link.classList.remove('active'));

    // 绑定目录点击事件
    document.querySelectorAll('.toc-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const index = link.dataset.index;
            const target = document.getElementById(`post-${index}`);
            if (target) {
                const contentEl = postDetailContent;
                const contentRect = contentEl.getBoundingClientRect();
                const targetRect = target.getBoundingClientRect();
                const scrollTop = contentEl.scrollTop + (targetRect.top - contentRect.top) - 20;
                contentEl.scrollTo({ top: scrollTop, behavior: 'smooth' });
            }
            // 移动端点击后关闭目录
            if (window.innerWidth <= 968) {
                postToc.classList.remove('open');
            }
        });
    });

    // 设置滚动监听，高亮当前阅读的文章
    setupScrollSpy();
}

// 滚动高亮当前阅读文章
function setupScrollSpy() {
    if (scrollSpyObserver) {
        scrollSpyObserver.disconnect();
    }

    const postItems = postDetailContent.querySelectorAll('.post-item');
    const tocLinks = document.querySelectorAll('.toc-link');

    scrollSpyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                const index = id.replace('post-', '');

                tocLinks.forEach(link => link.classList.remove('active'));
                const activeLink = document.querySelector(`.toc-link[data-index="${index}"]`);
                if (activeLink) {
                    activeLink.classList.add('active');
                    // 滚动目录视图使当前项可见
                    const tocListEl = document.getElementById('tocList');
                    const linkRect = activeLink.getBoundingClientRect();
                    const listRect = tocListEl.getBoundingClientRect();
                    if (linkRect.top < listRect.top || linkRect.bottom > listRect.bottom) {
                        activeLink.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
            }
        });
    }, {
        root: postDetailContent,
        rootMargin: '-30% 0px -60% 0px',
        threshold: 0
    });

    postItems.forEach(item => scrollSpyObserver.observe(item));
}

// 关闭分类详情
function closeCategory() {
    postDetail.classList.remove('open');
    document.body.style.overflow = '';
    currentCategory = null;
    if (scrollSpyObserver) {
        scrollSpyObserver.disconnect();
        scrollSpyObserver = null;
    }
}

backBtn.addEventListener('click', closeCategory);

// 移动端目录切换
tocToggle.addEventListener('click', () => {
    postToc.classList.toggle('open');
});

// ESC 键关闭
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && postDetail.classList.contains('open')) {
        closeCategory();
    }
});

// ============ 留言板 ============
const STORAGE_KEY = 'personal_website_messages';
const MAX_NAME_LENGTH = 20;
const MAX_MSG_LENGTH = 200;

const guestNameInput = document.getElementById('guestName');
const guestMessageInput = document.getElementById('guestMessage');
const nameCountEl = document.getElementById('nameCount');
const msgCountEl = document.getElementById('msgCount');
const formTip = document.getElementById('formTip');
const submitBtn = document.getElementById('submitBtn');
const messagesContainer = document.getElementById('messagesContainer');
const emptyState = document.getElementById('emptyState');
const messageCountEl = document.getElementById('messageCount');

// 字数统计
guestNameInput.addEventListener('input', () => {
    const len = guestNameInput.value.length;
    nameCountEl.textContent = len;
});

guestMessageInput.addEventListener('input', () => {
    const len = guestMessageInput.value.length;
    msgCountEl.textContent = len;
    updateFormTip();
});

// 更新表单提示
function updateFormTip() {
    const msgLen = guestMessageInput.value.length;
    if (msgLen > MAX_MSG_LENGTH) {
        formTip.textContent = `留言不能超过 ${MAX_MSG_LENGTH} 字`;
        formTip.className = 'form-tip error';
    } else if (msgLen > 0 && msgLen >= MAX_MSG_LENGTH * 0.9) {
        formTip.textContent = `字数接近上限，还可输入 ${MAX_MSG_LENGTH - msgLen} 字`;
        formTip.className = 'form-tip';
    } else if (msgLen > 0) {
        formTip.textContent = '留言符合要求，可以发布 ✨';
        formTip.className = 'form-tip success';
    } else {
        formTip.textContent = '';
        formTip.className = 'form-tip';
    }
}

// 加载留言
function loadMessages() {
    const messages = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    renderMessages(messages);
}

// 渲染留言
function renderMessages(messages) {
    if (messages.length === 0) {
        emptyState.style.display = 'block';
        messageCountEl.textContent = '(0)';
        return;
    }
    
    emptyState.style.display = 'none';
    messageCountEl.textContent = `(${messages.length})`;
    
    // 按时间倒序显示
    const sorted = [...messages].sort((a, b) => b.time - a.time);
    
    messagesContainer.innerHTML = sorted.map(msg => `
        <div class="message-item">
            <div class="message-header">
                <span class="message-author">${escapeHtml(msg.name)}</span>
                <span class="message-time">${formatTime(msg.time)}</span>
            </div>
            <div class="message-content">${escapeHtml(msg.content)}</div>
        </div>
    `).join('');
}

// 发布留言
submitBtn.addEventListener('click', () => {
    const name = guestNameInput.value.trim();
    const content = guestMessageInput.value.trim();
    
    // 验证
    if (!name) {
        showTip('请输入你的昵称', 'error');
        return;
    }
    if (name.length > MAX_NAME_LENGTH) {
        showTip(`昵称不能超过 ${MAX_NAME_LENGTH} 字`, 'error');
        return;
    }
    if (!content) {
        showTip('请输入留言内容', 'error');
        return;
    }
    if (content.length > MAX_MSG_LENGTH) {
        showTip(`留言不能超过 ${MAX_MSG_LENGTH} 字`, 'error');
        return;
    }
    
    // 保存留言（满 50 条自动清空）
    const MAX_MESSAGES = 50;
    const messages = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    if (messages.length >= MAX_MESSAGES) {
        // 达到上限，自动清空后再添加
        localStorage.removeItem(STORAGE_KEY);
        showTip('留言已满，已自动清空历史留言 ✨', 'success');
    }
    
    const currentMessages = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    currentMessages.push({
        name: name,
        content: content,
        time: Date.now()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentMessages));
    
    // 清空表单
    guestNameInput.value = '';
    guestMessageInput.value = '';
    nameCountEl.textContent = '0';
    msgCountEl.textContent = '0';
    formTip.textContent = '';
    formTip.className = 'form-tip';
    
    // 重新渲染
    loadMessages();
    
    // 成功提示
    submitBtn.innerHTML = '<i class="fas fa-check"></i> 发布成功！';
    submitBtn.disabled = true;
    setTimeout(() => {
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 发布留言';
        submitBtn.disabled = false;
    }, 2000);
});

// 显示临时提示
function showTip(message, type) {
    formTip.textContent = message;
    formTip.className = `form-tip ${type}`;
    setTimeout(() => {
        if (formTip.textContent === message) {
            formTip.textContent = '';
            formTip.className = 'form-tip';
        }
    }, 3000);
}

// 格式化时间
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`;
    
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// HTML 转义，防止 XSS
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============ 初始化 ============
document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    loadMessages();
    console.log('%c欢迎来到我的个人网站！', 'color: #667eea; font-size: 20px; font-weight: bold;');
    console.log('%c感谢您的访问 👋', 'color: #764ba2; font-size: 14px;');
});