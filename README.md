<<<<<<< HEAD
# 💰 Expense Tracker Backend

A backend service for managing and tracking expenses, built using Node.js and Express.js. This repository is the backend component of the Expense Tracker application.

---

## 🚀 Features

### 🔐 User Authentication
- Secure authentication with `bcryptjs` for password hashing.
- Token-based authentication using `jsonwebtoken`.
- Google OAuth login using `google-auth-library`.

### 🧾 Expense Management
- Add, update, and delete expense records.
- Retrieve expense data for individual users.

### 🗃️ Database
- MongoDB integration using `mongoose` for schema modeling and querying.

### 📧 Email Notifications
- Send transactional emails via `nodemailer`.

### ⚙️ Environment Configuration
- Manage sensitive environment variables with `dotenv`.

### 🌐 CORS Support
- Enable CORS for safe communication between frontend and backend.

---

## 🛠️ Installation

1. **Clone the repository**  
```bash
git clone https://github.com/Expense-Tracker-ETA/ETA-BACKEND.git
```

2. **Navigate into the project directory**  
```bash
cd ETA-BACKEND
```

3. **Install dependencies**  
```bash
npm install
```

4. **Environment Setup**  
Create a `.env` file in the root directory and add the following variables:

```env
PORT=5000
MONGO_URI=<your_mongo_database_uri>
JWT_SECRET=<your_jwt_secret>
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
EMAIL_USER=<your_email_address>
EMAIL_PASS=<your_email_password>
```

5. **Start the server**  
```bash
npm start
```

The backend will run on `http://localhost:5000` by default.

---

## 📡 API Endpoints

### 🔐 Authentication
- `POST /auth/login` – User login
- `POST /auth/register` – User registration
- `POST /auth/google` – Google OAuth login

### 💸 Expenses
- `GET /expenses` – Retrieve all expenses for the logged-in user
- `POST /expenses` – Add a new expense
- `PUT /expenses/:id` – Update an expense by ID
- `DELETE /expenses/:id` – Delete an expense by ID

### 📬 Other
- `POST /email/send` – Send email notifications

---

## 📦 Dependencies

- `bcryptjs`: Password hashing  
- `cors`: Cross-Origin Resource Sharing  
- `dotenv`: Environment variable management  
- `express`: Web framework  
- `google-auth-library`: Google OAuth integration  
- `jsonwebtoken`: JWT authentication  
- `mongoose`: MongoDB object modeling  
- `nodemailer`: Sending emails

---

## 📁 Project Structure

```
ETA-BACKEND/
├── server.js           # Entry point of the application
├── routes/             # API route definitions
├── models/             # Mongoose models
├── controllers/        # Business logic
├── middlewares/        # Auth and validation middleware
├── utils/              # Helper functions
├── .env.example        # Sample environment config
└── package.json        # Project metadata
```

---

## 🤝 Contributing

1. Fork the repo  
2. Create a new branch:  
```bash
git checkout -b feature/your-feature-name
```
3. Commit your changes:  
```bash
git commit -m "Add your message"
```
4. Push to your branch:  
```bash
git push origin feature/your-feature-name
```
5. Open a pull request

---

## 📜 License

This project does not currently include a license. Add one to specify usage rights.
=======
# Expenses_Tracker
>>>>>>> EXP-105-Register-page
