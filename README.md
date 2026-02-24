<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=FF6B35&height=200&section=header&text=Happy-Deliveries&fontSize=70&fontColor=ffffff&animation=fadeIn&fontAlignY=35&desc=Real-Time%20Full-Stack%20Delivery%20Ecosystem&descAlignY=55&descAlign=50" alt="Hero Banner" width="100%"/>

<p align="center">
<img src="https://img.shields.io/badge/Frontend-React_Native_(Expo)-02569B?style=for-the-badge&logo=react&logoColor=white" alt="React Native" />
<img src="https://img.shields.io/badge/Backend-Node.js_%7C_Express-43853D?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/Database-PostgreSQL_%2B_PostGIS-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
<img src="https://img.shields.io/badge/Real--Time-Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white" alt="Socket.io" />
</p>

<h3><b>A scalable, multi-platform PERN stack ecosystem featuring a Customer App, Driver App, and Web Dashboard, engineered for real-time order tracking and geospatial data filtering.</b></h3>

<a href="#live-demo"><kbd> 


 📱 View Mobile Apps 


 </kbd></a> 
<a href="#architecture"><kbd> 


 🧠 View Architecture 


 </kbd></a> 
<a href="#installation"><kbd> 


 ⚙️ Quick Install 


 </kbd></a>



<h4><b>Engineered With</b></h4>
<a href="https://skillicons.dev">
<img src="https://skillicons.dev/icons?i=react,nodejs,express,postgres,ts,js,html,css,git&perline=10" alt="Tech Stack" />
</a>

</div>



🎯 The Business Case
Most personal projects are simple CRUD apps. I wanted to tackle the complexity of a tri-sided marketplace (Customers, Drivers, and Restaurants) where data must remain perfectly synchronized across three different interfaces in real-time.

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
<img src="https://user-images.githubusercontent.com/73097560/115834477-dbab4520-a447-11eb-908a-139a6edaec5c.gif" alt="App Demo GIF Placeholder" width="80%" style="border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);"/>
<p><i>(Replace this placeholder with a GIF showing an order placed on the Customer App instantly pinging the Driver App)</i></p>
</div>

🏗️ Architectural Decisions & "The Why"
I approach application development with a focus on separation of concerns, scalability, and performance.

1. PostgreSQL + PostGIS (Instead of MongoDB)
Why? Location is everything in delivery. While NoSQL is great for unstructured data, calculating the exact distance between a driver and a restaurant in meters requires heavy geospatial math. By extending PostgreSQL with PostGIS, I offloaded complex spatial queries (like finding the "Fastest Near You") directly to the database layer, drastically reducing Node.js memory overhead.

2. Socket.io for Real-Time Dispatch
Why? Drivers cannot be expected to constantly "pull-to-refresh" to check for new orders. I implemented a bidirectional WebSocket connection. When an order hits the database, the Node server instantly pushes a payload to the active driver pool, triggering native mobile vibration and alerts without polling.

3. Unified Backend Architecture (views/ routes/ public/ database/)
Why? To manage the Restaurant Manager Dashboard without spinning up a completely separate React web app, I utilized Server-Side Rendering via EJS natively within the Express server. The views/ and public/ directories serve a highly secure, session-based Web Portal for managers, while the routes/ directory handles the stateless REST API for the Expo mobile apps.

🧠 Engineering Challenge Overcome
<table>
<tr>
<td>
<img src="https://cdn-icons-png.flaticon.com/512/1006/1006363.png" width="80" alt="Bug Icon"/>
</td>
<td>
<h3><b>The Challenge: Geospatial Type Casting Errors</b></h3>
<p>While implementing the "Distance from Customer" feature, the backend crashed with: <code>cannot cast type point to geography</code>. Standard SQL <code>POINT(x, y)</code> structures fail to account for the curvature of the earth, making distance calculations inaccurate or impossible.</p>
<h3><b>The Resolution</b></h3>
<p>I dove into advanced PostGIS documentation and rewrote the database schema and query logic. I implemented <code>ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography</code> within the Node.js database controllers. This explicitly cast the raw coordinates into standard GPS geography mapping (SRID 4326), allowing the server to calculate precise meter-by-meter distances for the mobile frontend seamlessly.</p>
</td>
</tr>
</table>

⚡ Core Ecosystem
<div align="center">
<table>
<tr>
<td align="center" width="33%">
<img src="https://cdn-icons-png.flaticon.com/512/3405/3405802.png" width="60" alt="Customer App"/>


<b>Customer Expo App</b>


Features a premium UI with Animated API transitions, live map tracking, and smart categorizations based on active location.
</td>
<td align="center" width="33%">
<img src="https://cdn-icons-png.flaticon.com/512/2906/2906274.png" width="60" alt="Manager Portal"/>


<b>Manager Web Portal</b>


Session-authenticated EJS dashboard for restaurants to edit menus, apply discounts, and manage live incoming order statuses.
</td>
<td align="center" width="33%">
<img src="https://cdn-icons-png.flaticon.com/512/1055/1055685.png" width="60" alt="Driver App"/>


<b>Driver Courier App</b>


Real-time order pinging via WebSockets, one-tap acceptance, and step-by-step delivery status progression.
</td>
</tr>
</table>
</div>

⚙️ Setup & Deployment
<details>
<summary><b>🔥 Click to expand the Installation Guide</b></summary>


Deploy the entire ecosystem locally. Ensure you have Node.js, Expo CLI, and PostgreSQL (with PostGIS extension) installed.

1. Clone & Install Dependencies

Bash
git clone https://github.com/TheolnCodeLand/happy-deliveries.git
cd happy-deliveries

# Install Backend dependencies
cd backend && npm install

# Install Frontend dependencies (in a separate terminal)
cd ../app && npm install
2. Configure Environment
Create a .env file in the /backend directory:

Code snippet
DATABASE_URL=postgres://user:password@localhost:5432/happy_deliveries
PORT=5000
SESSION_SECRET=your_secure_secret
3. Initialize Database & Start Servers

Bash
# Terminal 1: Start Node/Express Server & Web Portal
cd backend
node server.js

# Terminal 2: Start Mobile App Environment
cd app
npx expo start
Access the Web Manager Portal at http://localhost:5000/manager/login. Scan the Expo QR code to launch the Customer/Driver apps.

</details>

<div align="center">
<img src="https://capsule-render.vercel.app/api?type=rect&color=FF6B35&height=4&width=100%"/>




<b>Engineered by Theophilus Thobejane</b>



<a href="https://github.com/TheolnCodeLand">GitHub</a> • <a href="mailto:Thobejanetheo@gmail.com">Email</a>
</div>
