# Purple Bean Agro – B2B Coffee & Chicory Web Platform

A modern, fully responsive B2B product catalogue and inquiry platform built using **React.js**, **Tailwind CSS**, **Framer Motion**, **React Router**, **JSON Server**, and **EmailJS**.  
This project replicates real-world workflows used by manufacturers and exporters to showcase products, handle inquiries, and manage product listings.

---

## 🚀 Overview

The Purple Bean Agro web application provides an interactive experience for importers, distributors, wholesalers, and private-label brands. It includes:

- Advanced product filtering  
- Category-based browsing  
- Product detail modal  
- Contact and inquiry systems  
- A full Admin Panel with CRUD features  

The backend is simulated using **JSON Server**, enabling seamless product data management and admin authentication.

---

## ✨ Key Features

### 🛒 Product Catalogue
- Multi-level filtering (category → subcategory → sub-subcategory)
- Global search bar
- Product detail modal containing:
  - High-quality images  
  - Features  
  - Specifications  
  - Request Quote button  

### 🎨 Modern & Responsive UI
- Built with React.js + Tailwind CSS  
- Smooth animations (Framer Motion)  
- Fully responsive layout  
- Clean and structured UX  

### 📩 Integrated Communication Tools
- EmailJS contact form  
- WhatsApp quick-chat integration  
- Cal.com scheduling support  

### 🔐 Admin Panel (CMS System)
- Admin login with session handling  
- Add new products  
- Edit product details  
- Upload product images  
- Delete outdated products  
- Full CRUD operations via JSON Server  

---

## 🧱 Tech Stack

**Frontend:**  
React.js, Vite, Tailwind CSS, React Router, Framer Motion  

**Backend Simulation:**  
JSON Server  

**APIs & Integrations:**  
EmailJS, WhatsApp API, Cal.com  

**Tools:**  
Git, VS Code  

---

## 📂 Project Structure

PUPRLEBEANSITE/
│── public/
│── server/
│   └── db.json
│── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx


## ⚙️ Installation & Setup

### **Install Dependencies**
```bash
npm install

json-server --watch server/db.json --port 5000

npm run dev

