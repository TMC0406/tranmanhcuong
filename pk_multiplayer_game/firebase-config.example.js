// Đây là file mẫu. Sao chép file này thành firebase-config.js và điền thông tin của bạn
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  databaseURL: "https://your-app.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
