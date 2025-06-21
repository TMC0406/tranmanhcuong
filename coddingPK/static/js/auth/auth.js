// Auth related functions and variables
let userName = "";
let isLoginMode = true; // true = đăng nhập, false = đăng ký

// Khởi tạo các handler cho đăng nhập và đăng ký
function initAuthHandlers() {
  // Thiết lập chế độ hiển thị ban đầu
  updateAuthUIMode();
  
  // Nút chuyển đổi giữa đăng nhập và đăng ký
  const toggleBtn = document.getElementById("toggle-auth-mode");
  if (toggleBtn) {
    toggleBtn.onclick = (e) => {
      e.preventDefault();
      isLoginMode = !isLoginMode;
      updateAuthUIMode();
    };
  }
  
  // Đăng nhập / Đăng ký với email và mật khẩu
  const authBtn = document.getElementById("auth-btn");
  if (authBtn) {
    authBtn.onclick = () => {
      const email = document.getElementById("email-input").value.trim();
      const password = document.getElementById("password-input").value;
      const name = document.getElementById("username-input").value.trim();
      
      // Kiểm tra các trường bắt buộc
      if (!email) return alert("Vui lòng nhập email!");
      if (!password) return alert("Vui lòng nhập mật khẩu!");
      
      if (isLoginMode) {
        // Đăng nhập
        emailPasswordLogin(email, password);
      } else {
        // Đăng ký
        if (!name) return alert("Vui lòng nhập tên!");
        emailPasswordRegister(email, password, name);
      }
    };
  }

  // Đăng nhập Google
  const googleLoginBtn = document.getElementById("google-login-btn");
  if (googleLoginBtn) {
    googleLoginBtn.onclick = googleLogin;
  }

  // Add flag to avoid duplicate auth handling on initialization
  window.authInitialized = window.authInitialized || false;
  
  // Only set up auth state change listener after initial auth check
  firebase.auth().onAuthStateChanged(user => {
    // Skip during initial page load since checkAuthAndShowPanel handles it
    if (window.authInitialized) {
      if (user && !userName) {
        userName = user.displayName || user.email || "Người chơi";
        // Nếu đã đăng nhập, chuyển thẳng đến character selection
        showPanel("character");
      }
    } else {
      // Mark as initialized after first auth check
      window.authInitialized = true;
    }
  });
}

// Cập nhật UI theo chế độ đăng nhập hoặc đăng ký
function updateAuthUIMode() {
  const authTitle = document.getElementById("auth-title");
  const authBtn = document.getElementById("auth-btn");
  const toggleText = document.getElementById("login-text");
  const toggleBtn = document.getElementById("toggle-auth-mode");
  const usernameInput = document.getElementById("username-input");
  
  if (isLoginMode) {
    // Chế độ đăng nhập
    authTitle.textContent = "Đăng nhập";
    authBtn.textContent = "Đăng nhập";
    toggleText.textContent = "Chưa có tài khoản?";
    toggleBtn.textContent = "Đăng ký ngay";
    usernameInput.style.display = "none";
  } else {
    // Chế độ đăng ký
    authTitle.textContent = "Đăng ký";
    authBtn.textContent = "Đăng ký";
    toggleText.textContent = "Đã có tài khoản?";
    toggleBtn.textContent = "Đăng nhập ngay";
    usernameInput.style.display = "block";
  }
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
      // Reset các trường nhập khi đăng xuất
      if (document.getElementById("email-input")) {
        document.getElementById("email-input").value = "";
      }
      if (document.getElementById("password-input")) {
        document.getElementById("password-input").value = "";
      }
      if (document.getElementById("username-input")) {
        document.getElementById("username-input").value = "";
      }
      // Chuyển về chế độ đăng nhập
      isLoginMode = true;
      updateAuthUIMode();
      showPanel("login");
    })
    .catch(err => {
      console.error("Lỗi khi đăng xuất:", err);
    });
}

// Kiểm tra trạng thái đăng nhập
function checkAuthState(callback) {
  // Add a timeout to ensure callback is always called even if Firebase is slow
  let authResolved = false;
  
  // Set a timeout to prevent hanging if Firebase is slow
  const authTimeout = setTimeout(() => {
    if (!authResolved) {
      console.warn("Auth state check timed out");
      authResolved = true;
      if (callback) callback(false, null);
    }
  }, 3000);
  
  // Check Firebase authentication state
  firebase.auth().onAuthStateChanged(user => {
    // Clear the timeout since we got a response
    clearTimeout(authTimeout);
    
    if (!authResolved) {
      authResolved = true;
      if (user) {
        // Update the global userName
        userName = user.displayName || user.email || "Người chơi";
        
        // Check if user has extra data in database
        const userRef = firebase.database().ref('users/' + user.uid);
        userRef.once('value')
          .then(snapshot => {
            const userData = snapshot.val();
            if (userData && userData.name) {
              userName = userData.name;
            }
            if (callback) callback(true, userName);
          })
          .catch(err => {
            console.error("Error fetching user data:", err);
            if (callback) callback(true, userName);
          });
      } else {
        if (callback) callback(false, null);
      }
    }
  }, error => {
    // Handle any errors in the auth state observer
    console.error("Auth state check error:", error);
    clearTimeout(authTimeout);
    if (!authResolved) {
      authResolved = true;
      if (callback) callback(false, null);
    }
  });
}

// Lấy tên người dùng hiện tại
function getCurrentUserName() {
  return userName;
}

// Đăng ký tài khoản mới với email và mật khẩu
function emailPasswordRegister(email, password, name) {
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Đăng ký thành công
      const user = userCredential.user;
      
      // Lưu tên người dùng
      userName = name;
      
      // Cập nhật thông tin hiển thị
      user.updateProfile({
        displayName: name
      }).then(() => {
        // Lưu thông tin người dùng vào database
        const userRef = firebase.database().ref('users/' + user.uid);
        userRef.set({
          name: name,
          email: email,
          lastLogin: new Date().toISOString()
        });
        
        // Chuyển đến trang chọn nhân vật
        showPanel("character");
      });
    })
    .catch((error) => {
      console.error("Lỗi đăng ký:", error);
      let errorMessage;
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Email này đã được sử dụng.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Email không hợp lệ.";
          break;
        case 'auth/weak-password':
          errorMessage = "Mật khẩu quá yếu, hãy sử dụng ít nhất 6 ký tự.";
          break;
        default:
          errorMessage = "Đăng ký không thành công: " + error.message;
      }
      alert(errorMessage);
    });
}

// Đăng nhập với email và mật khẩu
function emailPasswordLogin(email, password) {
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Đăng nhập thành công
      const user = userCredential.user;
      userName = user.displayName || email.split('@')[0] || "Người chơi";
      
      // Cập nhật thời gian đăng nhập
      const userRef = firebase.database().ref('users/' + user.uid);
      userRef.update({
        lastLogin: new Date().toISOString()
      });
      
      // Chuyển đến trang chọn nhân vật
      showPanel("character");
    })
    .catch((error) => {
      console.error("Lỗi đăng nhập:", error);
      let errorMessage;
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = "Email hoặc mật khẩu không đúng.";
          break;
        case 'auth/invalid-email':
          errorMessage = "Email không hợp lệ.";
          break;
        case 'auth/user-disabled':
          errorMessage = "Tài khoản đã bị vô hiệu hóa.";
          break;
        default:
          errorMessage = "Đăng nhập không thành công: " + error.message;
      }
      alert(errorMessage);
    });
}

// Export functions for use in other files
window.googleLogin = googleLogin;
window.emailPasswordLogin = emailPasswordLogin;
window.emailPasswordRegister = emailPasswordRegister;
window.logout = logout;
window.checkAuthState = checkAuthState;
window.getCurrentUserName = getCurrentUserName;
window.initAuthHandlers = initAuthHandlers;
window.updateAuthUIMode = updateAuthUIMode;
