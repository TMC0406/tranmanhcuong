let userName = "";
let roomId = null;
let playerId = null;
let playerRef = null;
let x = 0, y = 0, hp = 100, energy = 0, direction = "right";
let keys = {}, bullets = [];

// Ẩn/hiện UI
function showPanel(panel) {
  document.getElementById("login-panel").style.display = panel === "login" ? "block" : "none";
  document.getElementById("room-panel").style.display = panel === "room" ? "block" : "none";
  document.getElementById("game-ui").style.display = panel === "game" ? "block" : "none";
}
showPanel("login");

// Đăng nhập
const loginBtn = document.getElementById("login-btn");
loginBtn.onclick = () => {
  const name = document.getElementById("username-input").value.trim();
  if (!name) return alert("Vui lòng nhập tên!");
  userName = name;
  showPanel("room");
  loadRoomList();
};

// Tạo phòng mới với obstacle random
const createRoomBtn = document.getElementById("create-room-btn");
createRoomBtn.onclick = () => {
  const newRoomId = "room-" + Math.floor(Math.random() * 100000);
  // Sinh 2-4 obstacle random, đảm bảo không sát nhau (cách nhau ít nhất 30px)
  const obstacles = [];
  const numObs = 2 + Math.floor(Math.random() * 3);
  let tries = 0;
  while (obstacles.length < numObs && tries < 1000) {
    tries++;
    const w = 40 + Math.floor(Math.random() * 60);
    const h = 40 + Math.floor(Math.random() * 60);
    const x = Math.floor(Math.random() * 600) + 50;
    const y = Math.floor(Math.random() * 300) + 50;
    // Không sát obstacle khác (cách nhau ít nhất 30px)
    let overlap = false;
    for (const o of obstacles) {
      if (
        x + w + 30 > o.x && x < o.x + o.w + 30 &&
        y + h + 30 > o.y && y < o.y + o.h + 30
      ) {
        overlap = true;
        break;
      }
    }
    if (!overlap) obstacles.push({ x, y, w, h });
  }
  db.ref(`rooms/${newRoomId}`).set({ created: Date.now(), obstacles });
  joinRoom(newRoomId);
};

// Hiển thị danh sách phòng
function loadRoomList() {
  const listDiv = document.getElementById("room-list");
  listDiv.innerHTML = "Đang tải...";
  db.ref("rooms").once("value", snap => {
    const rooms = [];
    snap.forEach(r => {
      if (r.key && r.key.startsWith("room-")) rooms.push(r.key);
    });
    if (rooms.length === 0) listDiv.innerHTML = "Không có phòng nào.";
    else listDiv.innerHTML = rooms.map(r => `<div>${r} <button onclick=\"joinRoom('${r}')\">Tham gia</button></div>`).join("");
  });
}

// Tham gia phòng
// Đăng ký listener xóa phòng khi không còn ai trong phòng
function setupRoomAutoCleanup(roomId) {
  const playersRef = db.ref(`rooms/${roomId}/players`);
  playersRef.on('value', snap => {
    if (snap.numChildren() === 0) {
      // Đợi 500ms để đảm bảo onDisconnect đã thực thi
      setTimeout(() => {
        playersRef.once('value', s2 => {
          if (s2.numChildren() === 0) {
            db.ref(`rooms/${roomId}`).remove();
          }
        });
      }, 500);
    }
  });
}

window.joinRoom = function(rid) {
  roomId = rid;
  playerId = "player-" + Math.floor(Math.random() * 10000);
  x = Math.floor(Math.random() * 700);
  y = 0;
  hp = 100;
  energy = 0;
  direction = "right";
  playerRef = db.ref(`rooms/${roomId}/players/${playerId}`);
  playerRef.set({ x, y, hp, energy, name: userName, attacking: false, skill_ready: false, direction });
  playerRef.onDisconnect().remove();
  setupRoomAutoCleanup(roomId); // Đảm bảo luôn có listener tự động xóa phòng
  showPanel("game");
  // Đăng ký lại listener cho players và bullets khi vào phòng mới
  if (window._playersListener) window._playersListener.off();
  if (window._bulletsListener) window._bulletsListener.off();
  window._playersListener = db.ref(`rooms/${roomId}/players`);
  window._bulletsListener = db.ref(`rooms/${roomId}/bullets`);
  window._playersListener.on("value", renderPlayers);
  window._bulletsListener.on("value", bulletsListener);
  if (!window._gameStarted) { window._gameStarted = true; gameLoop(); }
  setupKeyListeners();
  listenObstacles();
};

function renderPlayers(snap) {
  const container = document.getElementById("game-container");
  // KHÔNG xóa container.innerHTML ở đây nữa!
  // Xóa chỉ các player cũ
  const oldPlayers = container.querySelectorAll('.player, .enemy');
  oldPlayers.forEach(p => p.remove());
  let currentPlayer = null;
  snap.forEach(p => {
    const data = p.val();
    let dirClass = data.direction === "left" ? " left" : " right";
    const div = document.createElement("div");
    div.className = (p.key === playerId ? "player" : "enemy") + (data.moving ? " moving" : "") + dirClass;
    div.id = p.key === playerId ? "player" : "";
    div.style.left = data.x + "px";
    div.style.bottom = data.y + "px";
    // Thêm các phần tử con để tạo hình người
    const head = document.createElement("div");
    head.className = "head";
    const eyeL = document.createElement("div");
    eyeL.className = "eye left";
    const eyeR = document.createElement("div");
    eyeR.className = "eye right";
    const body = document.createElement("div");
    body.className = "body";
    const armL = document.createElement("div");
    armL.className = "arm left";
    const gunL = document.createElement("div");
    gunL.className = "gun";
    armL.appendChild(gunL);
    const armR = document.createElement("div");
    armR.className = "arm right";
    const gunR = document.createElement("div");
    gunR.className = "gun";
    armR.appendChild(gunR);
    const legL = document.createElement("div");
    legL.className = "leg left";
    const legR = document.createElement("div");
    legR.className = "leg right";
    head.appendChild(eyeL);
    head.appendChild(eyeR);
    div.appendChild(head);
    div.appendChild(body);
    div.appendChild(armL);
    div.appendChild(armR);
    div.appendChild(legL);
    div.appendChild(legR);
    // Thêm thanh máu và năng lượng phía trên nhân vật
    const barWrap = document.createElement("div");
    barWrap.style.position = "absolute";
    barWrap.style.left = "-5px";
    barWrap.style.bottom = "54px";
    barWrap.style.width = "60px";
    barWrap.style.height = "16px";
    barWrap.style.pointerEvents = "none";
    // Thanh máu
    const hpBar = document.createElement("div");
    hpBar.style.height = "7px";
    hpBar.style.width = Math.max(0, Math.min(1, data.hp/100)) * 50 + "px";
    hpBar.style.background = "#f00";
    hpBar.style.border = "1px solid #fff3";
    hpBar.style.borderRadius = "4px";
    hpBar.style.marginBottom = "2px";
    // Thanh năng lượng
    const mnBar = document.createElement("div");
    mnBar.style.height = "5px";
    mnBar.style.width = Math.max(0, Math.min(1, (data.energy||0)/3)) * 50 + "px";
    mnBar.style.background = "#09f";
    mnBar.style.border = "1px solid #fff3";
    mnBar.style.borderRadius = "4px";
    barWrap.appendChild(hpBar);
    barWrap.appendChild(mnBar);
    div.appendChild(barWrap);
    container.appendChild(div);
    if (p.key === playerId) currentPlayer = data;
  });
}

function bulletsListener(snap) {
  bullets = [];
  snap.forEach(b => {
    const data = b.val();
    data._key = b.key;
    bullets.push(data);
  });
}

// Lưu obstacles hiện tại
let obstacles = [];

// Render obstacle
function renderObstacles(obsArr) {
  const container = document.getElementById("game-container");
  if (!container) return;
  // Xóa obstacle cũ
  const oldObs = container.querySelectorAll('.obstacle');
  oldObs.forEach(o => o.remove());
  // Vẽ obstacle mới
  obsArr.forEach(o => {
    const el = document.createElement('div');
    el.className = 'obstacle';
    el.style.left = o.x + 'px';
    el.style.bottom = o.y + 'px';
    el.style.width = o.w + 'px';
    el.style.height = o.h + 'px';
    el.style.background = '#444';
    el.style.border = '2px solid #888';
    el.style.position = 'absolute';
    el.style.borderRadius = '8px';
    el.style.opacity = 0.85;
    container.appendChild(el);
  });
}

// Lắng nghe obstacle khi vào phòng
function listenObstacles() {
  if (!roomId) return;
  db.ref(`rooms/${roomId}/obstacles`).on('value', snap => {
    obstacles = snap.val() || [];
    renderObstacles(obstacles);
  });
}

// Đăng ký listener mặc định cho phòng đầu tiên nếu có
if (roomId && !window._playersListener) {
  window._playersListener = db.ref(`rooms/${roomId}/players`);
  window._playersListener.on("value", renderPlayers);
  window._bulletsListener = db.ref(`rooms/${roomId}/bullets`);
  window._bulletsListener.on("value", bulletsListener);
}

// Lắng nghe sự kiện nhấn và nhả phím (phải đăng ký lại sau khi vào phòng)
function setupKeyListeners() {
  window.onkeydown = e => {
    keys[e.key] = true;
    // Di chuyển cho mọi ngôn ngữ
    if (["a", "ArrowLeft", "ф", "Ф", "щ", "Щ"].includes(e.key)) direction = "left";
    if (["d", "ArrowRight", "в", "В"].includes(e.key)) direction = "right";
    if (["j", "0", "о", "О"].includes(e.key)) {
      attack();
      shoot();
    }
    if (["k", "1", "л", "Л"].includes(e.key)) useSkill();
  };
  window.onkeyup = e => {
    keys[e.key] = false;
  };
}

function gameLoop() {
  let moved = false;
  let nextX = x, nextY = y;
  // Di chuyển cho mọi ngôn ngữ
  if (keys["a"] || keys["ArrowLeft"] || keys["ф"] || keys["Ф"] || keys["щ"] || keys["Щ"]) { nextX -= 4; moved = true; direction = "left"; }
  if (keys["d"] || keys["ArrowRight"] || keys["в"] || keys["В"]) { nextX += 4; moved = true; direction = "right"; }
  if (keys["w"] || keys["ArrowUp"] || keys["ц"] || keys["Ц"]) { nextY += 4; moved = true; }
  if (keys["s"] || keys["ArrowDown"] || keys["ы"] || keys["Ы"]) { nextY -= 4; moved = true; }
  // Lấy kích thước động của game-container
  const container = document.getElementById("game-container");
  const maxX = container ? container.clientWidth - 50 : 750;
  const maxY = container ? container.clientHeight - 50 : 550;
  nextX = Math.max(0, Math.min(maxX, nextX));
  nextY = Math.max(0, Math.min(maxY, nextY));
  // Kiểm tra va chạm obstacle
  let blocked = false;
  for (const o of obstacles) {
    if (
      nextX + 40 > o.x && nextX < o.x + o.w &&
      nextY + 48 > o.y && nextY < o.y + o.h
    ) {
      blocked = true;
      break;
    }
  }
  if (moved && !blocked) {
    x = nextX;
    y = nextY;
    playerRef.update({ x, y, moving: true, direction });
  } else if (moved) {
    playerRef.update({ moving: true, direction });
  } else {
    playerRef.update({ moving: false, direction });
  }
  updateBullets();
  renderBullets();
  requestAnimationFrame(gameLoop);
}

function attack() {
  playerRef.update({ attacking: true });
  setTimeout(() => playerRef.update({ attacking: false }), 300);
  // Gọi checkHit nếu đã có định nghĩa
  if (typeof checkHit === 'function') checkHit();
}

// Thêm lại hàm checkHit nếu bị thiếu
function checkHit() {
  db.ref(`rooms/${roomId}/players`).once("value", snap => {
    snap.forEach(p => {
      if (p.key !== playerId && Math.abs(p.val().x - x) < 50) {
        db.ref(`rooms/${roomId}/players/${p.key}/hp`).transaction(hp => Math.max(0, hp - 10));
        playerRef.once("value", snap => {
          const e = (snap.val().energy || 0) + 1;
          playerRef.update({ energy: e, skill_ready: e >= 3 });
        });
      }
    });
  });
}

// Đẩy đạn lên Firebase thay vì lưu local
function shoot() {
  // Đạn thường
  const bullet = {
    x: direction === "right" ? x + 40 : x - 10,
    y: y + 20,
    dir: direction,
    owner: playerId,
    time: Date.now(),
    type: "normal" // Phân biệt loại đạn
  };
  db.ref(`rooms/${roomId}/bullets`).push(bullet);
  // Tăng năng lượng khi bắn thường
  playerRef.once("value", snap => {
    let e = (snap.val().energy || 0) + 0.6;
    if (e > 3) e = 3;
    playerRef.update({ energy: e, skill_ready: e >= 3 });
  });
}

// Bắn kỹ năng đặc biệt
function useSkill() {
  playerRef.once("value", snap => {
    const data = snap.val();
    if ((data.energy || 0) >= 3) {
      // Đạn đặc biệt
      const bullet = {
        x: direction === "right" ? x + 40 : x - 10,
        y: y + 20,
        dir: direction,
        owner: playerId,
        time: Date.now(),
        special: true // Đánh dấu là đạn đặc biệt
      };
      db.ref(`rooms/${roomId}/bullets`).push(bullet);
      playerRef.update({ energy: 0, skill_ready: false });
    }
  });
}

function updateBullets() {
  const speed = 10;
  bullets.forEach(b => {
    if (b.owner === playerId) {
      b.x += b.dir === "right" ? speed : -speed;
      // Kiểm tra va chạm obstacle
      let hitObs = false;
      // Cải thiện kiểm tra va chạm chướng ngại vật
      const bulletWidth = b.special ? 32 : 12;
      const bulletHeight = b.special ? 32 : 12;
      for (const o of obstacles) {
        if (
          b.x < o.x + o.w &&
          b.x + bulletWidth > o.x &&
          b.y < o.y + o.h &&
          b.y + bulletHeight > o.y
        ) {
          hitObs = true;
          break;
        }
      }
      if (hitObs) {
        db.ref(`rooms/${roomId}/bullets/${b._key}`).remove();
        bullets = bullets.filter(bullet => bullet._key !== b._key);
        return;
      }
      // Xóa đạn nếu ra khỏi màn hình
      if (b.x < 0 || b.x > (document.getElementById("game-container")?.clientWidth || 800)) {
        db.ref(`rooms/${roomId}/bullets/${b._key}`).remove();
        return;
      }
      // Kiểm tra va chạm với đối thủ
      db.ref(`rooms/${roomId}/players`).once("value", snap => {
        snap.forEach(p => {
          if (p.key !== playerId) {
            const data = p.val();
            // Đạn đặc biệt va chạm rộng hơn và mạnh hơn
            if (b.special) {
              if (Math.abs(b.x - data.x) < 60 && Math.abs(b.y - data.y) < 60) {
                db.ref(`rooms/${roomId}/players/${p.key}/hp`).transaction(hp => Math.max(0, hp - 40));
                db.ref(`rooms/${roomId}/bullets/${b._key}`).remove();
              }
            } else {
              if (Math.abs(b.x - data.x) < 30 && Math.abs(b.y - data.y) < 40) {
                db.ref(`rooms/${roomId}/players/${p.key}/hp`).transaction(hp => Math.max(0, hp - 15));
                db.ref(`rooms/${roomId}/bullets/${b._key}`).remove();
              }
            }
          }
        });
      });
      // Update vị trí đạn
      db.ref(`rooms/${roomId}/bullets/${b._key}`).update({ x: b.x, y: b.y });
    }
  });
}

function renderBullets() {
  const container = document.getElementById("game-container");
  if (!container) return;
  // Xóa đạn cũ
  const oldBullets = container.querySelectorAll('.bullet');
  oldBullets.forEach(b => b.remove());
  // Vẽ đạn mới
  bullets.forEach(b => {
    const el = document.createElement('div');
    if (b.special) {
      el.className = 'bullet special-bullet';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.boxShadow = '0 0 16px 8px #0af8';
      el.style.background = 'radial-gradient(circle, #0af 60%, #fff0 100%)';
    } else {
      el.className = 'bullet';
    }
    el.style.left = b.x + 'px';
    el.style.bottom = b.y + 'px';
    container.appendChild(el);
  });
}

db.ref(`rooms/${roomId}/players`).on("value", snap => {
  const container = document.getElementById("game-container");
  // container.innerHTML = "";
  // Xóa chỉ các player cũ
  const oldPlayers = container.querySelectorAll('.player, .enemy');
  oldPlayers.forEach(p => p.remove());
  let currentPlayer = null;
  snap.forEach(p => {
    const data = p.val();
    let dirClass = data.direction === "left" ? " left" : " right";
    const div = document.createElement("div");
    div.className = (p.key === playerId ? "player" : "enemy") + (data.moving ? " moving" : "") + dirClass;
    div.id = p.key === playerId ? "player" : "";
    div.style.left = data.x + "px";
    div.style.bottom = data.y + "px";
    // Thêm các phần tử con để tạo hình người
    const head = document.createElement("div");
    head.className = "head";
    const eyeL = document.createElement("div");
    eyeL.className = "eye left";
    const eyeR = document.createElement("div");
    eyeR.className = "eye right";
    const body = document.createElement("div");
    body.className = "body";
    const armL = document.createElement("div");
    armL.className = "arm left";
    const gunL = document.createElement("div");
    gunL.className = "gun";
    armL.appendChild(gunL);
    const armR = document.createElement("div");
    armR.className = "arm right";
    const gunR = document.createElement("div");
    gunR.className = "gun";
    armR.appendChild(gunR);
    const legL = document.createElement("div");
    legL.className = "leg left";
    const legR = document.createElement("div");
    legR.className = "leg right";
    head.appendChild(eyeL);
    head.appendChild(eyeR);
    div.appendChild(head);
    div.appendChild(body);
    div.appendChild(armL);
    div.appendChild(armR);
    div.appendChild(legL);
    div.appendChild(legR);
    // Thêm thanh máu và năng lượng phía trên nhân vật
    const barWrap = document.createElement("div");
    barWrap.style.position = "absolute";
    barWrap.style.left = "-5px";
    barWrap.style.bottom = "54px";
    barWrap.style.width = "60px";
    barWrap.style.height = "16px";
    barWrap.style.pointerEvents = "none";
    // Thanh máu
    const hpBar = document.createElement("div");
    hpBar.style.height = "7px";
    hpBar.style.width = Math.max(0, Math.min(1, data.hp/100)) * 50 + "px";
    hpBar.style.background = "#f00";
    hpBar.style.border = "1px solid #fff3";
    hpBar.style.borderRadius = "4px";
    hpBar.style.marginBottom = "2px";
    // Thanh năng lượng
    const mnBar = document.createElement("div");
    mnBar.style.height = "5px";
    mnBar.style.width = Math.max(0, Math.min(1, (data.energy||0)/3)) * 50 + "px";
    mnBar.style.background = "#09f";
    mnBar.style.border = "1px solid #fff3";
    mnBar.style.borderRadius = "4px";
    barWrap.appendChild(hpBar);
    barWrap.appendChild(mnBar);
    div.appendChild(barWrap);
    container.appendChild(div);
    if (p.key === playerId) currentPlayer = data;
  });
});

// Thêm đăng nhập Google Firebase
function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      userName = result.user.displayName || result.user.email || "Người chơi";
      showPanel("room");
      loadRoomList();
    })
    .catch(err => {
      console.log('Google login error:', err);
      alert("Đăng nhập Google thất bại!");
    });
}

// Thêm nút Google vào login-panel
const googleBtn = document.createElement("button");
googleBtn.innerText = "Đăng nhập với Google";
googleBtn.onclick = googleLogin;
document.getElementById("login-panel").appendChild(googleBtn);

// Tự động nhận diện đăng nhập Google nếu đã đăng nhập trước đó
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    userName = user.displayName || user.email || "Người chơi";
    showPanel("room");
    loadRoomList();
  } else {
    showPanel("login");
  }
});