import { db } from "./firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  getDoc,
  doc,
  deleteDoc
}
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
}
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import { auth }
from "./firebase.js";

onAuthStateChanged(auth, (firebaseUser) => {

    const role =
    localStorage.getItem("currentRole");

    // Only check Firebase Auth for admins
    if(
        role === "admin" &&
        !firebaseUser
    ){

        window.location.href =
        "admin-login.html";

    }

});
// ======================================  
// HELPERS  
// ======================================  
  
function getUsers(){  
    return JSON.parse(localStorage.getItem("users")) || [];  
}  
  
async function saveUser(user){
    await addDoc(collection(db, "users"), user);
}
  
function getMembers(){  
    return JSON.parse(localStorage.getItem("members")) || [];  
}  
  
function saveMembers(data){  
    localStorage.setItem("members",JSON.stringify(data));  
}  
  
function getRequests(){  
    return JSON.parse(localStorage.getItem("membershipRequests")) || [];  
}  
  
function saveRequests(data){  
    localStorage.setItem("membershipRequests",JSON.stringify(data));  
}  
  
function getTransactions(){  
    return JSON.parse(localStorage.getItem("transactions")) || [];  
}  
  
function saveTransactions(data){  
    localStorage.setItem("transactions",JSON.stringify(data));  
}  
  
// ======================================  
// MEMBER ID GENERATOR  
// ======================================  
  
function generateMemberID(){  
  
    let members = getMembers();  
  
    let number = members.length + 1;  
  
    return "TCSS/2026/" +  
    String(number).padStart(3,"0");  
  
}  
  async function createAccount(){

  let firstName = document.getElementById("firstName").value;
  let secondName = document.getElementById("secondName").value;
  let phone = document.getElementById("phone").value;
  let username = document.getElementById("newUsername").value;
  let password = document.getElementById("newPassword").value;
  let confirm = document.getElementById("confirmPassword").value;

  if(!firstName || !secondName || !phone || !username || !password){
    alert("Fill all fields");
    return;
  }

  if(password !== confirm){
    alert("Passwords do not match");
    return;
  }

  // check if username exists
  const q = query(
    collection(db, "users"),
    where("username", "==", username)
  );

  const snapshot = await getDocs(q);

  if(!snapshot.empty){
    alert("Username already exists");
    return;
  }

  await addDoc(collection(db, "users"), {
    firstName,
    secondName,
    phone,
    username,
    password,
    role: "user",
    created: new Date().toLocaleString()
  });

  alert("Account Created Successfully");

  window.location.href = "user-login.html";
}
async function userLogin(){

  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;

  const q = query(
    collection(db, "users"),
    where("username", "==", username),
    where("password", "==", password)
  );

  const snapshot = await getDocs(q);

  if(snapshot.empty){
    alert("Invalid Login");
    return;
  }

  const user = snapshot.docs[0].data();

  localStorage.setItem("currentUser", username);
  localStorage.setItem("currentRole", user.role);

  window.location.href = "dashboard.html";
}

//=========================================
//ADMIN LOGIN 
//=======================================

async function adminLogin(){

    const email =
    document.getElementById(
        "adminUsername"
    ).value.trim();

    const password =
    document.getElementById(
        "adminPassword"
    ).value.trim();

    if(!email || !password){

        alert(
            "Please enter email and password"
        );

        return;

    }

    try{

        await signInWithEmailAndPassword(
            auth,
            email,
            password
        );

        localStorage.setItem(
            "currentUser",
            email
        );

        localStorage.setItem(
            "currentRole",
            "admin"
        );

        alert(
            "Admin Login Successful"
        );

        window.location.href =
        "dashboard.html";

    }
    catch(error){

        alert(
            "Login Failed: " +
            error.message
        );

    }

}
// ======================================  
// APPLY FOR MEMBERSHIP  
// ======================================  
  
async function applyForMembership(){

  let username = localStorage.getItem("currentUser");

  if(!username){
    alert("Login first");
    return;
  }

  const q = query(
    collection(db, "membershipRequests"),
    where("username", "==", username)
  );

  const snapshot = await getDocs(q);

  if(!snapshot.empty){
    alert("Already applied");
    return;
  }

  await addDoc(collection(db, "membershipRequests"), {
    username,
    date: new Date().toLocaleString(),
    status: "pending"
  });

  alert("Application submitted");
}
export async function approveMembership(username){

  // get user
  const userQuery = query(
    collection(db, "users"),
    where("username", "==", username)
  );

  const userSnap = await getDocs(userQuery);

  if(userSnap.empty) return;

  const userData = userSnap.docs[0].data();
  const userRef = userSnap.docs[0].ref;

  // create member
  const memberID = "TCSS/2026/" + Date.now();

  await addDoc(collection(db, "members"), {
    id: memberID,
    firstName: userData.firstName,
    secondName: userData.secondName,
    phone: userData.phone,
    username: userData.username,
    balance: 0,
    joined: new Date().toLocaleString()
  });

  // update user role
  await updateDoc(userRef, {
    role: "member"
  });

  // delete request
  const reqQuery = query(
    collection(db, "membershipRequests"),
    where("username", "==", username)
  );

  const reqSnap = await getDocs(reqQuery);

  reqSnap.forEach(async (r) => {
    await deleteDoc(r.ref);
  });

  alert("Member Approved ✅");
}
export async function rejectMembership(username){
  const q = query(
    collection(db, "membershipRequests"),
    where("username", "==", username)
  );

  const snap = await getDocs(q);

  snap.forEach(async (docItem) => {
    await deleteDoc(docItem.ref);
  });

  alert("Application Rejected ❌");
}
// ======================================  
// MEMBER LOOKUP  
// ======================================  
  
function getMemberByUsername(username){  
  
    let members =  
    getMembers();  
  
    return members.find(  
        m=>m.username===username  
    );  
  
}  
export async function deposit(memberID, amount){

  const q = query(
    collection(db, "members"),
    where("id", "==", memberID)
  );

  const snapshot = await getDocs(q);

  if(snapshot.empty) return;

  const docRef = snapshot.docs[0].ref;
  const data = snapshot.docs[0].data();

  let newBalance =
    Number(data.balance) + Number(amount);

  await updateDoc(docRef, {
    balance: newBalance
  });

  await recordTransaction(memberID, "DEPOSIT", amount);
}
export async function withdraw(memberID, amount){
  const q = query(
    collection(db, "members"),
    where("id", "==", memberID)
  );

  const snap = await getDocs(q);

  if(snap.empty) return;

  const docRef = snap.docs[0].ref;
  const data = snap.docs[0].data();

  if(Number(data.balance) < Number(amount)){
    alert("Insufficient Balance");
    return;
  }

  let newBalance =
    Number(data.balance) - Number(amount);

  await updateDoc(docRef, {
    balance: newBalance
  });

  await recordTransaction(memberID, "WITHDRAW", amount);
}
// ======================================  
// LOGOUT  
// ======================================  
 async function logout(){

    await signOut(auth);

    localStorage.removeItem("currentUser");
    localStorage.removeItem("currentRole");

    window.location.href = "admin-login.html";

  
}
async function loginUser(){

    let username =
    document.getElementById("username").value;

    let password =
    document.getElementById("password").value;

    const q = query(
        collection(db,"users"),
        where("username","==",username),
        where("password","==",password)
    );

    const snapshot = await getDocs(q);

    if(snapshot.empty){

        alert("Invalid username or password");
        return;

    }

    const user =
    snapshot.docs[0].data();

    localStorage.setItem(
        "currentUser",
        user.username
    );

    localStorage.setItem(
        "currentRole",
        user.role
    );

    alert("Login Successful");

    window.location.href =
    "dashboard.html";

}




function deleteTransaction(transactionID){

    if(localStorage.getItem("currentRole") !== "admin"){
        alert("Only admin can delete transactions");
        return;
    }

    if(confirm("Delete this transaction?")){

        let transactions =
        JSON.parse(localStorage.getItem("transactions")) || [];

        transactions =
        transactions.filter(
            t => t.id !== transactionID
        );

        localStorage.setItem(
            "transactions",
            JSON.stringify(transactions)
        );

        alert("Transaction deleted");

        loadTransactions();
    }
}


function togglePassword(){

    let password =
    document.getElementById("newPassword");

    if(!password){
        console.log("newPassword not found");
        return;
    }

    if(password.type === "password"){
        password.type = "text";
    }else{
        password.type = "password";
    }

}

export async function recordTransaction(
    memberID,
    type,
    amount
){

    await addDoc(
        collection(db,"transactions"),
        {
            memberID: memberID,
            type: type,
            amount: Number(amount),
            date: new Date().toLocaleString()
        }
    );

}
function updateClock() {

    const now = new Date();
    const hour = now.getHours();

    let greeting = "";
    let greetingColor = "#ffffff";
    let cardBackground = "";

    if (hour >= 5 && hour < 12) {
        greeting = "🌞 GOOD MORNING";
        greetingColor = "#FFF176";
        cardBackground = "linear-gradient(135deg,#FFD54F,#FF9800)";
    }
    else if (hour >= 12 && hour < 17) {
        greeting = "☀️ GOOD AFTERNOON";
        greetingColor = "#FFFFFF";
        cardBackground = "linear-gradient(135deg,#87CEEB,#2196F3)";
    }
    else if (hour >= 17 && hour < 21) {
        greeting = "🌇 GOOD EVENING";
        greetingColor = "#FFEB3B";
        cardBackground = "linear-gradient(135deg,#FF6F00,#E65100)";
    }
    else if (hour >= 21) {
        greeting = "🌙 GOOD NIGHT";
        greetingColor = "#90CAF9";
        cardBackground = "linear-gradient(135deg,#1A237E,#000000)";
    }
    else {
        greeting = "🌌 GOOD MIDNIGHT";
        greetingColor = "#90CAF9";
        cardBackground = "linear-gradient(135deg,#000428,#004E92)";
    }

    const weekdays = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY"
    ];

    const months = [
        "JANUARY",
        "FEBRUARY",
        "MARCH",
        "APRIL",
        "MAY",
        "JUNE",
        "JULY",
        "AUGUST",
        "SEPTEMBER",
        "OCTOBER",
        "NOVEMBER",
        "DECEMBER"
    ];

    const holidays = {

        "01-01":"🎉 New Year's Day",
        "02-14":"❤️ Valentine's Day",
        "03-08":"🌸 International Women's Day",
        "04-22":"🌍 Earth Day",
        "05-01":"👷 Labour Day",
        "06-03":"🙏 Uganda Martyrs Day",
        "06-05":"🌿 World Environment Day",
        "06-16":"👦 Day of the African Child",
        "07-18":"🕊 Nelson Mandela International Day",
        "08-12":"🎓 International Youth Day",
        "09-21":"☮ International Day of Peace",
        "10-10":"🇺🇬 Uganda Independence Day",
        "10-16":"🌾 World Food Day",
        "11-20":"👶 World Children's Day",
        "12-01":"🎗 World AIDS Day",
        "12-25":"🎄 Christmas Day",
        "12-26":"🎁 Boxing Day"

    };

    const dayName = weekdays[now.getDay()];
    const day = String(now.getDate()).padStart(2, "0");
    const month = months[now.getMonth()];
    const year = now.getFullYear();

    const time = now.toLocaleTimeString("en-GB", {
        hour12: false
    });

    const holidayKey =
        String(now.getMonth() + 1).padStart(2, "0")
        + "-"
        + String(now.getDate()).padStart(2, "0");

    const holiday = holidays[holidayKey] || "";

    const card = document.getElementById("liveClockCard");
    const clock = document.getElementById("liveClock");

    if (card) {

        card.style.background = cardBackground;
        card.style.padding = "30px";
        card.style.borderRadius = "0 0 20px 20px";
        card.style.textAlign = "center";
        card.style.boxShadow = "0 5px 20px rgba(0,0,0,.3)";
        card.style.transition = "all .8s ease";

    }

    if (clock) {

        clock.innerHTML = `

        <div style="
        font-size:30px;
        font-weight:900;
        color:${greetingColor};
        text-shadow:2px 2px 6px rgba(0,0,0,.4);
        margin-bottom:20px;
        ">
        ${greeting}
        </div>

        <div style="
        font-size:20px;
        font-weight:700;
        color:white;
        margin-bottom:20px;
        ">
        ${dayName}, ${day} ${month} ${year}
        </div>

        <div style="
        display:inline-block;
        padding:15px 25px;
        border-radius:15px;
        background:rgba(255,255,255,.15);
        backdrop-filter:blur(5px);
        box-shadow:0 0 15px rgba(0,0,0,.3);
        ">
            <span style="
            font-size:52px;
            font-weight:900;
            font-family:monospace;
            color:white;
            letter-spacing:3px;
            ">
            ${time}
            </span>
        </div>

        ${holiday ? `
        <div style="
        margin-top:20px;
        padding:12px;
        background:rgba(255,255,255,.15);
        border-radius:12px;
        font-size:15px;
        font-weight:bold;
        color:white;
        ">
        ${holiday}
        </div>
        ` : ""}

        `;

    }

}

updateClock();
setInterval(updateClock, 1000);

async function loadTodayHistory(){

    const historyBox =
    document.getElementById(
        "todayHistory"
    );

    if(!historyBox){
        return;
    }

    try{

        const response =
        await fetch(
            "https://history.muffinlabs.com/date"
        );

        const data =
        await response.json();

        const events =
        data.data.Events;

        if(events.length > 0){

            const randomEvent =
            events[
                Math.floor(
                    Math.random() *
                    events.length
                )
            ];

            historyBox.innerHTML =
            `📜 Today in History<br>
            ${randomEvent.year}: ${randomEvent.text}`;

        }

    }catch(error){

        historyBox.innerHTML =
        "📜 Today in History unavailable";

        console.error(error);

    }

}
loadTodayHistory();
window.togglePassword = togglePassword;
window.logout = logout;
window.userLogin = userLogin;
window.createAccount = createAccount;
window.adminLogin = adminLogin;
window.applyForMembership = applyForMembership;
