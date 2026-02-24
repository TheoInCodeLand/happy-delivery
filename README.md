<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=FF6B35&height=250&section=header&text=Happy-Deliveries&fontSize=70&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Real-Time%20Full-Stack%20Delivery%20Ecosystem&descAlignY=55&descAlign=50" alt="Hero Banner" width="100%"/>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React_Native_(Expo)-02569B?style=for-the-badge&logo=react&logoColor=white" alt="React Native" />
  <img src="https://img.shields.io/badge/Backend-Node.js_%7C_Express-43853D?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL_%2B_PostGIS-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Real--Time-Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" />
</p>

<h3><b>A scalable, multi-platform PERN stack ecosystem featuring a Customer App, Driver App, and Web Dashboard, engineered for real-time order tracking and geospatial data filtering.</b></h3>

<br>

<a href="#-the-business-case"><kbd> <br> 🎯 Business Case <br> </kbd></a> 
<a href="#-architectural-decisions"><kbd> <br> 🧠 Architecture <br> </kbd></a> 
<a href="#-setup--deployment"><kbd> <br> ⚙️ Quick Install <br> </kbd></a>

<br><br>

<h4><b>Engineered With</b></h4>
<a href="https://skillicons.dev">
  <img src="https://skillicons.dev/icons?i=react,nodejs,express,postgres,ts,js,html,css,git&perline=10" alt="Tech Stack Showcase" />
</a>

</div>

<br>

---

## 🎯 The Business Case

Most projects are simple CRUD applications. The objective here was to tackle the complexity of a **tri-sided marketplace** (Customers, Drivers, and Restaurants) where data must remain perfectly synchronized across three different interfaces in real-time.

<table align="center" width="100%">
  <tr>
    <td width="50%" align="center">
      <h3>❌ The Problem</h3>
      <p align="left">Food delivery platforms face high latency between order placement, restaurant acceptance, and driver dispatching, leading to cold food and poor user trust.</p>
    </td>
    <td width="50%" align="center">
      <h3>✅ The Solution</h3>
      <p align="left">A full-stack ecosystem leveraging WebSockets for instant driver dispatching and PostGIS spatial queries to dynamically route orders to the closest, fastest drivers.</p>
    </td>
  </tr>
</table>

<div align="center">
  <img src="https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1000&q=80" alt="Delivery Ecosystem Showcase" width="100%" />
  <p><i>Real-time delivery logistics in action.</i></p>
</div>

<br>

---

## 🏗️ Architectural Decisions

Application development is approached with a strict focus on the separation of concerns, scalability, and performance.

<table width="100%">
  <tr>
    <td width="15%" align="center">
      <img src="https://skillicons.dev/icons?i=postgres" width="60" alt="PostgreSQL"/>
    </td>
    <td>
      <b>1. PostgreSQL + PostGIS (Instead of MongoDB)</b><br>
      Location is everything in delivery. Calculating the exact distance between a driver and a restaurant in meters requires heavy geospatial math. By extending PostgreSQL with PostGIS, complex spatial queries (like finding "Fastest Near You") were offloaded directly to the database layer, drastically reducing Node.js memory overhead.
    </td>
  </tr>
  <tr>
    <td width="15%" align="center">
      <img src="https://skillicons.dev/icons?i=express" width="60" alt="Express"/>
    </td>
    <td>
      <b>2. Unified Modular Backend</b><br>
      To ensure robust maintainability, the backend strictly adheres to a <code>views/</code>, <code>routes/</code>, <code>public/</code>, and <code>database/</code> folder structure. This cleanly separates server-side rendering logic from RESTful API endpoints and database queries, allowing for highly secure, session-based Web Portals for managers alongside stateless APIs for mobile apps.
    </td>
  </tr>
  <tr>
    <td width="15%" align="center">
      <img src="https://skillicons.dev/icons?i=nodejs" width="60" alt="WebSockets"/>
    </td>
    <td>
      <b>3. Socket.io for Real-Time Dispatch</b><br>
      Drivers cannot be expected to constantly "pull-to-refresh" for new orders. A bidirectional WebSocket connection was implemented. When an order hits the database, the Node server instantly pushes a payload to the active driver pool, triggering native mobile alerts without expensive polling operations.
    </td>
  </tr>
</table>

<br>

---

## 🧠 Engineering Challenge Overcome

<table align="center" width="100%">
  <tr>
    <td width="20%" align="center">
      <img src="https://cdn-icons-png.flaticon.com/512/1006/1006363.png" width="100" alt="Bug Icon"/>
    </td>
    <td width="80%">
      <h3><b>The Challenge: Geospatial Type Casting Errors</b></h3>
      <p>While implementing the "Distance from Customer" feature, the backend crashed with: <code>cannot cast type point to geography</code>. Standard SQL <code>POINT(x, y)</code> structures fail to account for the curvature of the earth, making distance calculations inaccurate or impossible.</p>
      <hr>
      <h3><b>The Resolution</b></h3>
      <p>Advanced PostGIS documentation was utilized to rewrite the database schema and query logic. The command <code>ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography</code> was implemented within the Node.js database controllers. This explicitly cast the raw coordinates into standard GPS geography mapping (SRID 4326), allowing the server to calculate precise meter-by-meter distances for the mobile frontend seamlessly.</p>
    </td>
  </tr>
</table>

<br>

---

## ⚡ Core Ecosystem

<div align="center">
  <table width="100%">
    <tr>
      <td align="center" width="33%">
        <img src="https://cdn-icons-png.flaticon.com/512/3405/3405802.png" width="80" alt="Customer App"/><br><br>
        <b>Customer Expo App</b><br><br>
        Features a premium UI with Animated API transitions, live map tracking, and smart categorizations based on active location.
      </td>
      <td align="center" width="33%">
        <img src="https://cdn-icons-png.flaticon.com/512/2906/2906274.png" width="80" alt="Manager Portal"/><br><br>
        <b>Manager Web Portal</b><br><br>
        Session-authenticated EJS dashboard for restaurants to edit menus, apply discounts, and manage live incoming order statuses.
      </td>
      <td align="center" width="33%">
        <img src="https://cdn-icons-png.flaticon.com/512/1055/1055685.png" width="80" alt="Driver App"/><br><br>
        <b>Driver Courier App</b><br><br>
        Real-time order pinging via WebSockets, one-tap acceptance, and step-by-step delivery status progression.
      </td>
    </tr>
  </table>
</div>

<br>

---

## ⚙️ Setup & Deployment

<details>
<summary><b>🔥 Click to expand the step-by-step Installation Guide</b></summary>
<br>

Deploy the entire ecosystem locally. Ensure Node.js, Expo CLI, and PostgreSQL (with the PostGIS extension) are installed.

**1. Clone & Install Dependencies**
```bash
git clone [https://github.com/TheolnCodeLand/happy-deliveries.git](https://github.com/TheolnCodeLand/happy-deliveries.git)
cd happy-deliveries

# Install Backend dependencies
cd backend && npm install

# Install Frontend dependencies (in a separate terminal)
cd ../app && npm install
