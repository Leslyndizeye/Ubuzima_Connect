# Ubuzima Connect: AI-Powered Clinical Advisory System
**Student:** Ndizeye Lesly  
**Course:** Mission Capstone 
**Track:** FullStack & Machine Learning  

---

##  Video Demonstration
**[INSERT LINK TO YOUR VIDEO DEMO HERE - e.g., Loom or YouTube]**  
*(This video demonstrates the UI, the AI inference engine, and the code structure.)*

---

##  1. Project Description
**Ubuzima Connect** is a Clinical Decision Support System (CDSS) designed to address the critical shortage of radiologists in Rwanda (currently only 17 serving 14 million people). 

The system utilizes **Deep Learning (ResNet-50)** to detect Tuberculosis and Pneumonia in Chest X-rays with high sensitivity. Unlike standard "Black Box" AI, Ubuzima Connect features **Grad-CAM Explainability** (Heatmaps) to build clinician trust and integrates directly with the **DHIS2** national health reporting framework to prevent data silos.

### **Key Features:**
*   **Advisory AI:** Acts as a second opinion, not a replacement.
*   **Local Calibration:** Trained on Global South proxy data (VinDr-CXR) to mitigate distribution shift bias.
*   **Interoperability:** Automated JSON reporting to DHIS2.

---

## 🛠 2. Technology Stack & Tools
*   **Frontend:** React (Vite), TypeScript, Tailwind CSS.
*   **Backend:** Python, FastAPI.
*   **AI/ML:** PyTorch, torchvision, ResNet-50 (Transfer Learning).
*   **Database:** MongoDB (For flexible diagnostic logs).
*   **Auth:** Firebase.
*   **Deployment:** Vercel (Frontend), Render (Backend).

---

## 📂 3. Repository Structure
This repository contains the source code for the MVP:

*   `/src` & `/components`: The React Frontend logic and UI components.
*   `/backend` *(Note: If backend is in a separate repo, link it here)*: Contains the FastAPI server and PyTorch inference logic.
*   `/notebooks`: Contains the Jupyter Notebooks used for EDA and Model Training on the VinDr dataset.
*   `/designs`: Contains system architecture diagrams and UI mockups.

---

## 💻 4. Setup & Installation
Follow these steps to run the project locally.

### **Prerequisites**
*   Node.js (v16+)
*   Python (v3.9+)

### **Frontend Setup**
```bash
# 1. Clone the repository
git clone https://github.com/[YOUR-USERNAME]/Ubuzima_Connect.git

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev
