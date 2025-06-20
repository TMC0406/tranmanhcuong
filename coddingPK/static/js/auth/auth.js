// Auth related functions and variables
let userName = "";

// Khởi tạo các handler cho đăng nhập
function initAuthHandlers() {
  // Đăng nhập thường
  const loginBtn = document.getElementById("login-btn");
  if (loginBtn) {
    loginBtn.onclick = () => {
      const name = document.getElementById("username-input").value.trim();
      if (!name) return alert("Vui lòng nhập tên!");
      
      userName = name;
      showPanel("character");
    };
  }

  // Đăng nhập Google
  const googleLoginBtn = document.getElementById("google-login-btn");
  if (googleLoginBtn) {
    googleLoginBtn.onclick = googleLogin;
  }

  // Tự động nhận diện đăng nhập Google nếu đã đăng nhập trước đó
  firebase.auth().onAuthStateChanged(user => {
    if (user && !userName) {
      userName = user.displayName || user.email || "Người chơi";
      // Nếu đã đăng nhập Google, chuyển thẳng đến character selection
      showPanel("character");
    }
  });
}

// Đăng nhập Google Firebase
function googleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider)
    .then(result => {
      userName = result.user.displayName || result.user.email || "Người chơi";
      showPanel("character");
    })
    .catch(err => {
      console.log('Google login error:', err);
      alert("Đăng nhập Google thất bại!");
    });
}

// Đăng xuất
function logout() {
  firebase.auth().signOut()
    .then(() => {
      userName = "";
      showPanel("login");
    })
    .catch(err => {
      console.error("Lỗi khi đăng xuất:", err);
    });
}

// Kiểm tra trạng thái đăng nhập
function checkAuthState(callback) {
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      userName = user.displayName || user.email || "Người chơi";
      if (callback) callback(true, userName);
    } else {
      if (callback) callback(false, null);
    }
  });
}

// Lấy tên người dùng hiện tại
function getCurrentUserName() {
  return userName;
}

// Export functions for use in other files
window.googleLogin = googleLogin;
window.logout = logout;
window.checkAuthState = checkAuthState;
window.getCurrentUserName = getCurrentUserName;
window.initAuthHandlers = initAuthHandlers;
