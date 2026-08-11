# Telangana Rainfall Analytics Dashboard

An interactive web-based dashboard for analyzing rainfall and humidity data across Telangana. The application provides district-level, mandal-level, monthly, and daily visualizations to help users understand rainfall patterns and atmospheric conditions.

## Features

- Telangana rainfall overview dashboard
- Daily rainfall analysis
- Monthly rainfall trends
- District-wise rainfall analysis
- Mandal-wise rainfall analysis
- Rainfall intensity visualization
- Rainfall anomaly analysis
- Quarterly rainfall comparison
- Humidity analysis
- Monthly humidity trends
- Humidity distribution analysis
- Humidity vs rainfall comparison
- Top 10 district humidity comparison
- District humidity heatmap
- Interactive Telangana district map
- Responsive dashboard interface
- Local dataset integration for faster data access

## Technology Stack

### Frontend
- React
- Vite
- JavaScript
- Recharts
- React Router
- CSS

### Backend
- Python
- Django
- Django REST Framework
- SQLite

### Data
- Telangana rainfall dataset
- Telangana district GeoJSON data
- Monthly and daily rainfall records
- Humidity measurements

## Project Structure

```text
TelanganaRainfallDashboard/
│
├── backend/
│   ├── config/
│   ├── records/
│   ├── data/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── image/
│   ├── package.json
│   └── vite.config.js
│
└── README.md
