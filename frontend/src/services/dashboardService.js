import apiClient from "../api/apiClient";


/* ============================================================
   DISTRICTS
============================================================ */

export const getDistricts = async () => {

    const response = await apiClient.get(
        "/districts/"
    );

    return response.data;
};


/* ============================================================
   MANDALS
============================================================ */

export const getMandals = async () => {

    const response = await apiClient.get(
        "/mandals/"
    );

    return response.data;
};


/* ============================================================
   DAILY RAINFALL
============================================================ */

export const getDailyRainfall = async (
    date
) => {

    const response = await apiClient.get(
        `/daily/${date}/`
    );

    return response.data;
};


/* ============================================================
   2022 CALENDAR
============================================================ */

export const getRainfallCalendar = async () => {

    const response = await apiClient.get(
        "/calendar/"
    );

    return response.data;
};