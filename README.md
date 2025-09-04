# 📌 User Registration System with Dashboard & Reports

This project is a **User Registration & Management System** built using **Node.js, Express, MongoDB, and EJS**.  
It allows users to register and log in, while providing an **Admin Dashboard** to manage users and generate reports.

---

## ✨ Features

### 👤 User
- Register with **Full Name, Email, Password, Phone, Gender, DOB, Address**  
- Secure password hashing with **bcryptjs**  
- Login with email & password  
- View personal profile  
- Change password  

### 🛠️ Admin
- View **total users count**  
- See user list in **table format**  
- Search & filter users (by name, gender, date range)  
- Delete users  
- View detailed user profile  
- Export data as **CSV & PDF**  
- Reports & Analytics with **Chart.js**:
  - Users by Gender (Pie Chart)  
  - Users by Age Group (Bar Chart)  
  - Monthly Registrations (Line Chart)  

---

## 🗄️ Database Schema (MongoDB)

**Collection: `users`**

```json
{
  "fullName": "string",
  "email": "string (unique)",
  "password": "hashed string",
  "phone": "string",
  "gender": "Male/Female/Other",
  "dob": "Date",
  "address": "string",
  "role": "user/admin",
  "createdAt": "date"
}
```

---

## 🚀 Tech Stack

- **Frontend:** HTML, CSS, EJS, Bootstrap, Chart.js  
- **Backend:** Node.js, Express  
- **Database:** MongoDB (Mongoose ODM)  
- **Auth:** bcryptjs, express-session  
- **Export:** PDFKit, fast-csv  

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository:
```bash
git clone https://github.com/your-username/user-registration-app.git
cd user-registration-app
```

### 2️⃣ Install dependencies:
```bash
npm install
```

### 3️⃣ Create a `.env` file:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/userRegApp
SESSION_SECRET=somesecretvalue
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123
ADMIN_NAME=Admin
```

### 4️⃣ Seed Admin User:
```bash
node seedAdmin.js
```

### 5️⃣ Run the server:
```bash
npm start
```

App will run on 👉 **http://localhost:3000**
