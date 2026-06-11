(function () {
  const root = document.getElementById("comments");
  const list = document.getElementById("simple-comments-list");
  const form = document.getElementById("simple-comments-form");
  const status = document.getElementById("simple-comments-status");

  if (!root || !list || !form) return;

  const path = list.dataset.path || window.location.pathname;
  const api = "/api/comments";
  const formatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setStatus(message, isError) {
    status.textContent = message || "";
    status.classList.toggle("is-error", Boolean(isError));
  }

  function render(comments) {
    if (!comments.length) {
      list.innerHTML = '<p class="simple-comments-empty">暂无评论。</p>';
      return;
    }

    list.innerHTML = comments
      .map((comment) => {
        const date = comment.createdAt ? formatter.format(new Date(comment.createdAt)) : "";
        return `<article class="simple-comment">
          <header><strong>${escapeHtml(comment.name)}</strong><time>${escapeHtml(date)}</time></header>
          <p>${escapeHtml(comment.content).replace(/\n/g, "<br>")}</p>
        </article>`;
      })
      .join("");
  }

  async function loadComments() {
    setStatus("加载评论中...");
    try {
      const response = await fetch(`${api}?path=${encodeURIComponent(path)}`, {
        headers: { accept: "application/json" },
      });
      if (!response.ok) throw new Error("load failed");
      const data = await response.json();
      render(Array.isArray(data.comments) ? data.comments : []);
      setStatus("");
    } catch (error) {
      setStatus("评论加载失败。", true);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      path,
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      content: form.elements.content.value.trim(),
    };

    if (!payload.name || !payload.content) {
      setStatus("请填写昵称和评论内容。", true);
      return;
    }

    setStatus("提交中...");
    form.querySelector("button").disabled = true;
    try {
      const response = await fetch(api, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "submit failed");
      form.reset();
      render(Array.isArray(data.comments) ? data.comments : []);
      setStatus("已提交。");
    } catch (error) {
      setStatus(error.message || "提交失败。", true);
    } finally {
      form.querySelector("button").disabled = false;
    }
  });

  loadComments();
})();
