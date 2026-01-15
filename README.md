[ Video Link 
](https://youtu.be/81GYQieq3s0)

# Taste-GO-Repo
# Taste & Go 🌍🍽️

Taste & Go is a role-based, map-centric food exploration platform that allows users to record, explore, and manage restaurant experiences based on location and time of day. The system combines interactive web mapping, user-generated content, and administrative moderation to provide a reliable and scalable spatial food discovery experience.

[🌍 View Live Demo](https://gmt-458-web-gis.github.io/full-stack-web-gis-irem122/)
---

## Project Overview

Taste & Go enables users to mark restaurants they have visited on an interactive world map. Each entry is associated with a specific time period (morning, afternoon, or evening) and is automatically geolocated. The platform supports multiple user roles, multilingual interface support, and a reporting mechanism to ensure data quality and trustworthiness.

The primary objective of the project is to design a crowdsourced yet moderated spatial recommendation system using modern web technologies and geospatial visualization techniques.

<img width="412" height="120" alt="Ekran Resmi 2026-01-14 20 04 17" src="https://github.com/user-attachments/assets/49e25675-478a-45d3-8c47-4247c5de7671" />


---

## Key Features

- Interactive map-based restaurant exploration  
- Automatic location detection for added markers  
- Time-based classification (morning / afternoon / evening)  
- Country and city-based filtering  
- Multiple map layers (terrain, satellite, standard)  
- Role-based access control  
- Marker reporting and admin moderation system  
- Multilingual interface support (English & Turkish)  

---

## Technologies Used

- **Frontend:** HTML, CSS, JavaScript  
- **Mapping Library:** Leaflet.js  
- **Backend & Database:** Firebase (Authentication & Firestore)  
- **APIs:** Country and city name retrieval APIs  
- **Other:** Client-side filtering, role-based UI rendering  

---

## System Architecture

Taste & Go follows a client-centric architecture where all user interactions are handled on the frontend, while authentication, authorization, and data persistence are managed through Firebase services.

- Firebase Authentication handles user login and role validation  
- Firestore stores restaurant markers, user roles, and reports  
- Leaflet.js renders the interactive map and spatial layers  

---

## Project Structure

```
taste-go/
│
├── index.html
├── admin.html
│
├── src/
│   ├── main.js
│   ├── map.js
│   ├── auth.js
│   ├── firebase-client.js
│   └── ui.js
│
├── assets/
│   └── screenshots/
│       ├── login.png
│       ├── map.png
│       ├── filters.png
│       ├── marker-crud.png
│       └── admin-panel.png
│
├── firebase/
│   ├── firestore.rules
│   └── auth.rules
│
└── README.md
```

---

## User Roles & Access Control




### Guest (Visitor)
- Can view all publicly available restaurant markers  
- Can filter markers by country, city, time period, and map layer  
- Cannot create, update, or delete markers

- <img width="1545" height="940" alt="Ekran Resmi 2026-01-14 20 11 31" src="https://github.com/user-attachments/assets/3090d098-b4ec-4561-92eb-35da0e5b3263" />

### Registered User
- Can add new restaurant markers  
- Marker location is automatically detected  
- Can define restaurant name and time period of visit  
- Can update or delete only their own markers  
- Can view markers added by other users  
- Can report misleading or inappropriate markers

  <img width="1545" height="940" alt="Ekran Resmi 2026-01-14 20 12 34" src="https://github.com/user-attachments/assets/4af6d941-8267-4d38-a8fd-4f7597325f6f" />


### Admin

- Has full access to all system data  
- Can view all markers and their owners  
- Can delete any marker  
- Can review reported markers  
- Can monitor system statistics  

Authentication and authorization are enforced using Firebase Authentication and role-based Firestore rules.

<img width="1545" height="940" alt="Ekran Resmi 2026-01-14 20 11 56" src="https://github.com/user-attachments/assets/6e559ca8-c436-4f65-943c-cfc2a6ceed08" />---

## CRUD Operations

### Restaurant Markers

| Operation | Guest | User | Admin |
|---------|------|------|-------|
| Create  | ❌ | ✅ | ✅ |
| Read    | ✅ | ✅ | ✅ |
| Update  | ❌ | ✅ (own only) | ✅ |
| Delete  | ❌ | ✅ (own only) | ✅ |



---

## Map Features & Filtering

<img width="1200" height="858" alt="Ekran Resmi 2026-01-14 20 20 26" src="https://github.com/user-attachments/assets/f9ce3bb0-db4e-4762-9a2a-de46accfb21e" />


- Multiple base map layers (terrain, satellite, standard)  
- Filtering by country and city  
- Time-based filtering (morning, afternoon, evening)  
- Dynamic marker visibility based on selected filters  
- Seamless layer switching without data reload  

---

## Reporting & Moderation System

Registered users can report markers that they find misleading or inappropriate. These reports are forwarded to the admin panel for review. Admin users evaluate the reports and decide whether to keep or remove the reported markers.



---

## Performance Monitoring & Optimization

- Client-side filtering to reduce database queries  
- Role-based rendering to load only authorized UI components  
- Efficient Firestore query constraints  
- Map layer switching without re-fetching marker data  

---

## Getting Started

### Prerequisites
- Modern web browser  
- Firebase account  

### Installation

1. Clone the repository:
```bash

```

2. Create a Firebase project and enable:
- Firebase Authentication  
- Firestore Database  

3. Add your Firebase configuration to:
```
src/firebase-client.js
```





## Future Improvements

- Restaurant rating system  
- Recommendation engine  
- Heatmap visualization for popular areas  
- Advanced admin analytics dashboard  
- Mobile-responsive design  

---


