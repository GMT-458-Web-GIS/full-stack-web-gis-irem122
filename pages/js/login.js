import { login, register } from "./auth.js";

const email = document.getElementById("email");
const password = document.getElementById("password");
const error = document.getElementById("error");

document.getElementById("login").onclick = async () => {
  try {
    await login(email.value, password.value);
    window.location.href = "../../index.html";
  } catch (e) {
    error.innerText = e.message;
  }
};

document.getElementById("register").onclick = async () => {
  try {
    await register(email.value, password.value);
    window.location.href = "../../index.html";
  } catch (e) {
    error.innerText = e.message;
  }
};


