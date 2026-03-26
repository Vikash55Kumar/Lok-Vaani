SIH Project

---
![WhatsApp Image 2025-10-28 at 1 49 17 PM (1)](https://github.com/user-attachments/assets/c91c1390-05d2-4716-8f18-31f66f81065e)

# 🌐 Lok-Vaani  
*A voice-enabled public grievance & feedback platform*

Lok-Vaani is an AI-powered platform designed to help citizens register grievances, suggestions, or feedback in their **own local language and voice**.  
The platform processes audio input, converts it to text, analyzes sentiment/intent, and forwards it to relevant authorities or dashboards.

This project was developed under **Smart India Hackathon (SIH)**.

---

## 🎯 Features

| Feature | Description |
|--------|-------------|
| 🎤 **Voice Input Support** | Citizens can speak instead of typing. |
| 🌍 **Multi-Language Support** | Works with various Indian languages. |
| 🤖 **AI Speech Recognition** | Converts speech to text using ML models. |
| 🧠 **NLP Intent + Sentiment Detection** | Understands category & urgency. |
| 🗂️ **Complaint Categorization** | Automatically classifies grievance type. |
| 🖥️ **User-Friendly Web Interface** | Simple UI for public access. |
| 🔒 **Secure Backend API** | Reliable and scalable service layer. |

---

## 🏗️ Project Structure
Lok-Vaani/
│
├── ai_models/ # Speech-to-Text / NLP Models (Python)
├── backend/ # Backend REST APIs (TypeScript / Node.js / Express)
└── frontend/ # Web UI (React with TypeScript)


## 🖼️ Screenshots

### **Home Page**

<img width="1920" height="1080" alt="Screenshot (3)" src="https://github.com/user-attachments/assets/d5bd1f5a-6e6a-4ab1-9ab9-1bccb5091eeb" />

### **Analytics Dashboard Overview**

<img width="1920" height="1080" alt="Screenshot (7)" src="https://github.com/user-attachments/assets/c28ece6f-f25c-4a14-a73d-e3775c58e1a9" />

### **Stakeholder Participation Insights**

<img width="1920" height="1080" alt="Screenshot (4)" src="https://github.com/user-attachments/assets/403d56ea-c14d-46ec-b8ca-1464386077ed" />

### **Sentiment Trend & Charts**

<img width="1920" height="1080" alt="Screenshot (5)" src="https://github.com/user-attachments/assets/fcf1df6a-132b-4d8f-a321-e51e9f5bf130" />

### **Policy Drafts Page**

<img width="1920" height="1080" alt="Screenshot (7)" src="https://github.com/user-attachments/assets/6623c5d1-30f6-494e-bca3-bac17bea5eca" />


---


## 🧠 Tech Stack

| Layer | Technologies |
|------|--------------|
| Frontend | React, TypeScript, Tailwind / CSS |
| Backend | Node.js, Express, TypeScript |
| AI Models | Python, Speech-to-Text, NLP Models |
| Database (optional) | MongoDB / PostgreSQL (based on implementation) |

---

## ⚙️ Setup Instructions

# Clone the Repository
git clone [(https://github.com/Vikash55Kumar/Lok-Vaani.git)](https://github.com/Vikash55Kumar/Lok-Vaani.git)

cd Lok-Vaani

# Setup Frontend
cd frontend

npm install

npm run dev 

# Setup Backend
cd ../backend

npm install

npm run dev 

# (Optional) Setup AI Service - only if you are using model
cd ../ai_models/model2
pip install -r requirements.txt
python app.py


---

🚀 How It Works

1. User uploads a comment.

2. AI model analyze it.

3. NLP model detects grievance category + sentiment.

4. Backend stores and routes the issue.

5. Authority dashboard views & responds to requests.

---

🤝 Contributors

| Name     | Role                               |
| -------- | ---------------------------------- |
| Team SIH | Development, Model Training, UI/UX |
| Mentors  | Guidance & Review                  |







